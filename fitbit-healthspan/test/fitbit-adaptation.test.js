// Fitbit-specific adaptation rules (reports/Fitbit vs WHOOP tracker differences.md).
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyze, bridgeGaps, segmentHistory } from '../public/engine/index.js';
import { level } from '../public/engine/confidence.js';
import { detectDevice, adaptationNotes } from '../public/engine/devices.js';
import { bodyAge } from '../public/engine/healthspan.js';
import { addDays } from '../public/engine/util.js';

const night = (date) => ({ start: `${addDays(date, -1)}T23:00:00`, end: `${date}T07:00:00`, asleepMin: 430, inBedMin: 480 });

test('Paired-device names map to profiles', () => {
  assert.equal(detectDevice('Charge 6'), 'charge-6');
  assert.equal(detectDevice('Google Pixel Watch 3'), 'pixel-watch-3');
  assert.equal(detectDevice('Fitbit Air'), 'fitbit-air');
  assert.equal(detectDevice('Fitbit Edge'), 'fitbit-edge');
  assert.equal(detectDevice('Something new'), 'other');
  assert.equal(detectDevice(''), null);
});

test('Sparse resting HR samples: gaps ≤5 min are bridged, longer gaps stay missing', () => {
  const a = [60, null, null, 66, null, null, null, null, null, null, 70];
  const out = bridgeGaps(a, 5);
  assert.deepEqual(out.slice(0, 4), [60, 62, 64, 66]);
  assert.equal(out[5], null);
});

test('HRV: deep-sleep series is preferred and never mixed with whole-night values', () => {
  const mk = (deepEvery) => Array.from({ length: 30 }, (_, i) => {
    const date = addDays('2026-05-01', i);
    return { date, sleep: night(date), rhr: 55, hrvAvg: 40, hrvDeep: i % deepEvery === 0 ? null : 50 };
  });
  const mostlyDeep = analyze(mk(10), { age: 35, sex: 'male' }); // 10% missing deep → use deep
  assert.equal(mostlyDeep.adaptation.hrvSource, 'deep');
  assert.ok(mostlyDeep.days.every((d) => d.hrv === 50 || d.hrv === null));
  const patchy = analyze(mk(3), { age: 35, sex: 'male' }); // 33% missing deep → whole-night for all
  assert.equal(patchy.adaptation.hrvSource, 'whole-night');
  assert.ok(patchy.days.every((d) => d.hrv === 40));
});

test('Demographic VO2max is excluded from Body Age; run-based VO2max counts', () => {
  const v = { vo2max: 50 };
  const half = bodyAge(v, 30, 'male', { vo2Weight: 0.5 }).rows.find((r) => r.key === 'vo2max').years;
  const full = bodyAge(v, 30, 'male').rows.find((r) => r.key === 'vo2max').years;
  assert.ok(Math.abs(half - full / 2) < 1e-9);
  const days = (extra) => Array.from({ length: 40 }, (_, i) => {
    const date = addDays('2026-05-01', i);
    return { date, sleep: night(date), rhr: 55, hrv: 50, vo2max: 48, steps: 9000, ...extra };
  });
  const air = analyze(days({}), { age: 35, sex: 'male', device: 'fitbit-air' });
  assert.equal(air.adaptation.vo2Demographic, true);
  assert.equal(air.healthspan.rows.find((r) => r.key === 'vo2max').missing, true);
  const charge = analyze(days({}), { age: 35, sex: 'male', device: 'charge-6' });
  assert.equal(charge.healthspan.rows.find((r) => r.key === 'vo2max').missing, false);
  const flagged = analyze(days({ vo2Estimated: true }), { age: 35, sex: 'male', device: 'charge-6' });
  assert.equal(flagged.healthspan.rows.find((r) => r.key === 'vo2max').missing, true);
});

test('Unknown biological sex blocks Body Age and flags strain', () => {
  const days = Array.from({ length: 40 }, (_, i) => {
    const date = addDays('2026-05-01', i);
    return { date, sleep: night(date), rhr: 55, hrv: 50, steps: 9000 };
  });
  const a = analyze(days, { age: 35 });
  assert.equal(a.healthspan.unlocked, false);
  assert.equal(a.healthspan.sexKnown, false);
  assert.ok(a.latest.confidence.strain.flags.includes('SEX_UNKNOWN'));
});

test('Confidence levels: High / Medium / Low per report rules', () => {
  assert.equal(level([]), 'high');
  assert.equal(level(['NO_SPO2']), 'medium');
  assert.equal(level(['NO_SPO2', 'NO_TEMP', 'SLEEP_EDITED']), 'low');
  assert.equal(level(['NO_STAGES']), 'low');
});

test('Switching trackers rescales the old baseline segment after 7 nights', () => {
  const days = Array.from({ length: 60 }, (_, i) => {
    const date = addDays('2026-05-01', i);
    const newDevice = i >= 40;
    return { date, sleep: night(date), rhr: newDevice ? 50 : 55, hrv: newDevice ? 60 : 40 };
  });
  const since = addDays('2026-05-01', 40);
  const withSeg = analyze(days, { age: 35, sex: 'male', deviceSince: since });
  const without = analyze(days, { age: 35, sex: 'male' });
  const day50 = (a) => a.days.find((d) => d.date === addDays('2026-05-01', 50));
  // Without segmenting, the step change looks like a huge recovery jump; with it, recovery stays near baseline.
  assert.ok(day50(without).recovery.score > 90);
  assert.ok(Math.abs(day50(withSeg).recovery.score - 60) < 15, `got ${day50(withSeg).recovery.score}`);
  assert.ok(day50(withSeg).confidence.recovery.flags.includes('DEVICE_CHANGED'));
  const hist = segmentHistory(withSeg.days.slice(0, 50), addDays('2026-05-01', 50), since);
  assert.ok(Math.abs(hist[0].hrv - 60) < 1e-9);
});

test('Adaptation notes reflect device capabilities', () => {
  const air = adaptationNotes('fitbit-air').map((n) => n.rule).join(' ');
  assert.match(air, /no GPS/);
  const pw = adaptationNotes('pixel-watch-3');
  assert.ok(pw.some((n) => n.area === 'Battery'));
  assert.ok(pw.some((n) => /continuous EDA/.test(n.rule)));
});
