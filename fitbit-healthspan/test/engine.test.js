// Acceptance tests from the research report (§S9) plus unit checks of each score.
import test from 'node:test';
import assert from 'node:assert/strict';

import { bodyAge, pace, targets } from '../public/engine/healthspan.js';
import { strainFromLoad, trimpWeight } from '../public/engine/strain.js';
import { computeRecovery, recoveryBand } from '../public/engine/recovery.js';
import { sleepPerformance, sleepConsistency, nextDebt, bedtimeFor } from '../public/engine/sleep.js';
import { analyze } from '../public/engine/index.js';
import { behaviorImpacts } from '../public/engine/journal.js';
import { generateDemo } from '../public/adapters/demo.js';
import { rng, addDays } from '../public/engine/util.js';

const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg}: expected ${expected} ± ${tol}, got ${actual.toFixed(2)}`);

// WHOOP white paper Table 2 (p.35): 30-year-old reference cases.
const US_MALE = { sleepHours: 6.35, consistency: 65, steps: 5200, z13: 69, z45: 0, strength: 0, vo2max: 42.4, rhr: 67, leanPct: 73.9 };
const WHOOP_MALE = { sleepHours: 7.0, consistency: 67, steps: 10900, z13: 141, z45: 6, strength: 46, vo2max: 46.8, rhr: 58, leanPct: 81 };
const US_FEMALE = { sleepHours: 6.35, consistency: 65, steps: 5000, z13: 46, z45: 0, strength: 0, vo2max: 30.2, rhr: 72, leanPct: 62.2 };
const WHOOP_FEMALE = { sleepHours: 7.3, consistency: 68, steps: 11500, z13: 124, z45: 7, strength: 56, vo2max: 40.0, rhr: 63, leanPct: 73 };

test('Body Age reproduces WHOOP published anchor cases (±1 y)', () => {
  near(bodyAge(US_MALE, 30, 'male').offset, 6, 1, 'US-average 30M');
  near(bodyAge(WHOOP_MALE, 30, 'male').offset, -1.6, 1, 'WHOOP-median 30M');
  near(bodyAge(US_FEMALE, 30, 'female').offset, 7.5, 1, 'US-average 30F');
  near(bodyAge(WHOOP_FEMALE, 30, 'female').offset, -1.6, 1, 'WHOOP-median 30F');
});

test('Metrics exactly at target add zero years', () => {
  const t = targets(45, 'female');
  const r = bodyAge({ ...t, sleepHours: 7 }, 45, 'female');
  near(r.offset, 0, 1e-9, 'at-target offset');
});

test('Missing lean mass has no effect (WHOOP rule)', () => {
  const a = bodyAge({ ...WHOOP_MALE, leanPct: null }, 30, 'male');
  const row = a.rows.find((r) => r.key === 'leanPct');
  assert.equal(row.years, 0);
  assert.equal(row.missing, true);
});

test('Pace of Aging is 1.0x when recent habits equal the 6-month average', () => {
  const now = bodyAge(WHOOP_MALE, 30, 'male').age;
  const proj = bodyAge(WHOOP_MALE, 30, 'male').age + 0.5;
  near(pace(now, proj), 1, 0.05, 'pace');
  assert.equal(pace(30, 40), 3); // clipped
  assert.equal(pace(30, 20), -1);
});

test('Strain anchors (±0.6): walk ≈ 6.2, run ≈ 12.4, marathon ≈ 20.1, 24 h max = 21', () => {
  const minutes = (x, n) => trimpWeight(x, 'male') * n;
  near(strainFromLoad(minutes(0.4, 60)), 6.2, 0.6, '1 h walk @40% HRR');
  near(strainFromLoad(minutes(0.75, 60)), 12.4, 0.6, '1 h run @75% HRR');
  near(strainFromLoad(minutes(0.85, 210)), 20.1, 0.6, 'marathon @85% HRR');
  near(strainFromLoad(minutes(1, 1440)), 21, 0.05, '24 h at max');
  assert.ok(strainFromLoad(minutes(0.85, 420)) < 21 && strainFromLoad(minutes(0.85, 420)) > strainFromLoad(minutes(0.85, 210)));
  assert.equal(trimpWeight(0.1, 'male'), 0);
});

test('Recovery: ~15% red / ~40% green over a typical user, mean ≈ 58', () => {
  const r = rng(3);
  const history = [];
  const scores = [];
  for (let i = 0; i < 400; i++) {
    const day = { date: addDays('2026-01-01', i), hrv: Math.exp(Math.log(55) + r.normal(0, 0.15)), sleepRhr: 55 + r.normal(0, 2.5), respRate: 14.5 + r.normal(0, 0.3), validNight: true };
    const sp = Math.min(100, 85 + r.normal(0, 10));
    day.recovery = computeRecovery(day, history, sp);
    if (i >= 90 && day.recovery?.score != null) scores.push(day.recovery.score);
    history.push(day);
  }
  const red = scores.filter((s) => recoveryBand(s).key === 'red').length / scores.length;
  const green = scores.filter((s) => recoveryBand(s).key === 'green').length / scores.length;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  near(red, 0.15, 0.07, 'red share');
  near(green, 0.4, 0.08, 'green share');
  near(avg, 58, 6, 'mean recovery');
});

test('Recovery drops when HRV crashes and RHR spikes', () => {
  const history = Array.from({ length: 30 }, (_, i) => ({ date: addDays('2026-01-01', i), hrv: 60 + (i % 5), sleepRhr: 52 + (i % 3), validNight: true }));
  const good = computeRecovery({ hrv: 70, sleepRhr: 50 }, history, 95).score;
  const bad = computeRecovery({ hrv: 35, sleepRhr: 62, respRate: 18 }, history, 60).score;
  assert.ok(good >= 67, `good day should be green, got ${good}`);
  assert.ok(bad <= 33, `bad day should be red, got ${bad}`);
});

test('Sleep performance and planner', () => {
  const sleep = { asleepMin: 480, inBedMin: 520, deepMin: 90, remMin: 110 };
  const perf = sleepPerformance(sleep, 480, 85, 0.5);
  assert.ok(perf.score >= 85, `full need + good habits should be optimal, got ${perf.score}`);
  const poor = sleepPerformance({ asleepMin: 300, inBedMin: 420 }, 480, 50, 8);
  assert.ok(poor.score < 70);
  assert.equal(nextDebt(0, 480, 420), 60);
  assert.equal(nextDebt(100, 480, 300), 120); // capped
  assert.equal(bedtimeFor(450, '07:00', 90).bedtime, '22:40');
});

test('Sleep consistency: identical schedules = 100, shifted schedules lower', () => {
  const mk = (shift) => {
    const map = new Map();
    for (let i = 0; i < 5; i++) {
      const date = addDays('2026-03-01', i);
      const prev = addDays(date, -1);
      const off = shift * (i % 2);
      map.set(date, { date, sleep: { start: `${prev}T23:${String(off).padStart(2, '0')}:00`, end: `${date}T07:${String(off).padStart(2, '0')}:00` } });
    }
    return map;
  };
  near(sleepConsistency(mk(0), '2026-03-05'), 100, 0.01, 'identical');
  assert.ok(sleepConsistency(mk(45), '2026-03-05') < 100);
});

test('End-to-end on demo data: every score is produced and in range', () => {
  const demo = generateDemo({ days: 150, end: '2026-11-18' });
  const a = analyze(demo.days, demo.profile);
  const d = a.latest;
  assert.ok(d.recovery.score >= 0 && d.recovery.score <= 100);
  assert.ok(d.strain >= 0 && d.strain <= 21);
  assert.ok(d.sleepPerf.score >= 0 && d.sleepPerf.score <= 100);
  assert.ok(d.stress.average >= 0 && d.stress.average <= 3);
  assert.equal(a.healthspan.unlocked, true);
  assert.ok(Math.abs(a.healthspan.bodyAge - demo.profile.age) < 15);
  assert.ok(a.healthspan.pace >= -1 && a.healthspan.pace <= 3);
  const rest = a.days.filter((x) => x.workouts.length === 0 && x.strain != null).map((x) => x.strain);
  const restAvg = rest.reduce((p, c) => p + c, 0) / rest.length;
  assert.ok(restAvg > 2 && restAvg < 11, `rest-day strain should be light, got ${restAvg}`);
  const impacts = behaviorImpacts(demo.journal, a.byDate, d.date);
  const alcohol = impacts.find((b) => b.key === 'alcohol');
  assert.ok(alcohol.ready && alcohol.impact < 0, 'alcohol should lower next-day recovery in the demo');
});

test('Engine degrades gracefully with daily summaries only (no intraday HR)', () => {
  const days = Array.from({ length: 40 }, (_, i) => ({
    date: addDays('2026-06-01', i),
    sleep: { start: `${addDays('2026-06-01', i - 1)}T23:00:00`, end: `${addDays('2026-06-01', i)}T06:50:00`, asleepMin: 420, inBedMin: 470 },
    hrv: 45 + (i % 7), rhr: 60 - (i % 4), steps: 7000 + 300 * (i % 5), azm: { fatBurn: 20, cardio: 10, peak: 2 }, vo2max: 41,
  }));
  const a = analyze(days, { age: 40, sex: 'female' });
  assert.ok(a.latest.recovery.score > 0);
  assert.ok(a.latest.strain > 0);
  assert.equal(a.latest.stress, null);
  assert.equal(a.healthspan.unlocked, true);
});
