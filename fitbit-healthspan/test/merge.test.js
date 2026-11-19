// Multi-device merge rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeSources, pickPrimary, mergeWorkouts, coverage } from '../public/engine/merge.js';
import { analyze } from '../public/engine/index.js';
import { addDays } from '../public/engine/util.js';

const night = (date, min = 420) => ({ start: `${addDays(date, -1)}T23:00:00`, end: `${date}T07:00:00`, asleepMin: min, inBedMin: 480 });
const mkDays = (n, f) => Array.from({ length: n }, (_, i) => ({ date: addDays('2026-08-01', i), ...f(i, addDays('2026-08-01', i)) }));

const fitbit = { id: 'google', label: 'Fitbit', device: 'charge-6', days: mkDays(40, (i, date) => ({
  sleep: night(date), hrvDeep: 50, hrvAvg: 45, rhr: 56, spo2: 96, steps: 8000 + i, vo2max: 44, vo2Estimated: false,
  workouts: i === 10 ? [{ name: 'Run', type: 'RUNNING', start: `${date}T07:00:00`, durationMin: 40 }] : [],
})) };
const oura = { id: 'hk:Oura', label: 'Oura', device: 'oura', days: mkDays(40, (i, date) => ({
  sleep: i % 10 === 0 ? null : night(date, 440), hrv: 70, rhr: 52, respRate: 14.2, steps: 6000,
})) };
const watch = { id: 'hk:Apple Watch', label: 'Apple Watch', device: 'apple-watch', days: mkDays(40, (i, date) => ({
  hrv: 38, rhr: 58, steps: 9500, vo2max: 47, hrMinutes: Array.from({ length: 1440 }, (_, m) => (m % 3 === 0 ? 65 : null)),
  workouts: i === 10 ? [{ name: 'Running', type: 'running', start: `${date}T07:05:00`, durationMin: 38, avgHr: 150 }] : [],
})) };

test('Single source passes through unchanged', () => {
  const m = mergeSources([fitbit]);
  assert.equal(m.days.length, 40);
  assert.equal(m.days[0].hrvDeep, 50);
  assert.equal(m.primary.hrv, 'google');
});

test('Each overnight vital comes from exactly one source (never mixed night-to-night)', () => {
  const m = mergeSources([fitbit, oura, watch]);
  const hrvSources = new Set(m.days.map((d) => d.sources.hrv).filter(Boolean));
  assert.equal(hrvSources.size, 1);
  // Equal 100% coverage → the ring wins ties for overnight vitals.
  assert.equal(m.primary.hrv, 'hk:Oura');
  assert.ok(m.days.every((d) => d.hrv === 70 && d.hrvDeep === undefined));
  assert.equal(m.primary.spo2, 'google'); // only Fitbit has SpO2
  assert.equal(m.days[5].spo2, 96);
});

test('User override picks the source for a metric', () => {
  const m = mergeSources([fitbit, oura, watch], { hrv: 'google', rhr: 'hk:Apple Watch' });
  assert.equal(m.primary.hrv, 'google');
  assert.equal(m.days[3].hrvDeep, 50);
  assert.equal(m.days[3].rhr, 58);
});

test('Sleep falls back to another source on nights the primary missed (flagged)', () => {
  const m = mergeSources([fitbit, oura], { sleep: 'hk:Oura' });
  const d0 = m.days[0];
  assert.equal(d0.sources.sleep, 'google');
  assert.equal(d0.sleepFallback, true);
  assert.equal(m.days[1].sources.sleep, 'hk:Oura');
  assert.equal(m.days[1].sleep.asleepMin, 440);
});

test('Steps take the highest device count; workouts are de-duplicated', () => {
  const m = mergeSources([fitbit, oura, watch]);
  assert.equal(m.days[2].steps, 9500);
  const w = m.days[10].workouts;
  assert.equal(w.length, 1);
  assert.equal(w[0].avgHr, 150); // the record with heart rate wins
  assert.equal(mergeWorkouts([{ sourceId: 'a', workouts: [{ start: '2026-01-01T07:00:00', durationMin: 30 }] }, { sourceId: 'b', workouts: [{ start: '2026-01-01T12:00:00', durationMin: 30 }] }]).length, 2);
});

test('Minute heart rate: primary series with gaps filled from others', () => {
  const a = { id: 'a', device: 'charge-6', days: [{ date: '2026-08-01', hrMinutes: Array.from({ length: 1440 }, (_, m) => (m < 720 ? 60 : null)) }] };
  const b = { id: 'b', device: 'apple-watch', days: [{ date: '2026-08-01', hrMinutes: Array.from({ length: 1440 }, () => 70) }] };
  const m = mergeSources([a, b], { hrMinutes: 'a' });
  assert.equal(m.days[0].hrMinutes[100], 60);
  assert.equal(m.days[0].hrMinutes[1000], 70);
});

test('VO2max prefers measured estimates over demographic ones', () => {
  const m = mergeSources([oura, { ...watch }], { vo2max: 'hk:Oura' });
  assert.equal(m.days[0].vo2max, 47);
  assert.equal(m.days[0].vo2Estimated, false);
});

test('Coverage and primary selection ignore disabled sources', () => {
  assert.ok(coverage(oura, 'sleep') > 0.85 && coverage(oura, 'sleep') < 0.95);
  assert.equal(pickPrimary([{ ...oura, enabled: false }, fitbit], 'hrv'), 'google');
});

test('Merged multi-device data runs through the full engine', () => {
  const m = mergeSources([fitbit, oura, watch]);
  const a = analyze(m.days, { age: 40, sex: 'female', device: 'oura' });
  assert.ok(a.latest.recovery.score > 0);
  assert.equal(a.healthspan.rows.find((r) => r.key === 'vo2max').missing, false);
});

test('Resting HR is not re-derived from another device\'s heart rate', () => {
  const m = mergeSources([fitbit, oura, watch]);
  assert.equal(m.days[3].rhrLocked, true); // RHR from Oura, minute HR from the watch
  const a = analyze(m.days, { age: 40, sex: 'female' });
  assert.equal(a.days[3].sleepRhr, 52);
});
