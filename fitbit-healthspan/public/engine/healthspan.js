// Healthspan: Body Age (WHOOP Age equivalent) and Pace of Aging — report §S7-S8.
//
// [OFFICIAL] (WHOOP Healthspan white paper, rev. 4 Sep 2025)
//   nine metrics; each metric's all-cause-mortality hazard ratio vs a guideline target → years via 10·ln(HR);
//   Age = chronological age + Σ impacts; at-target = 0; 6-month window for the age, 30-day window for Pace;
//   Pace = (projected age in 6 months − current age) / 0.5, clipped −1…3; targets incl. the VO2max table;
//   lean mass optional (no effect if missing); unlock after 21 recoveries in 31 days; 90-day calibration.
// [LIT]      per-metric slopes from the cited studies (Itani, Windred, Paluch, Lee, Ahmadi, Momma, Kodama/Mandsager,
//            Zhang, Jayedi).
// [RECON]    curve shapes/clamps and one shrinkage factor a = 0.57, fitted so WHOOP's four published 30-year-old
//            cases come out at +5.9 / −1.2 / +7.6 / −1.4 years (WHOOP: ≈+6 / −1.6 / ≈+7.5 / −1.6).

import { clamp, interp, isNum, mean } from './util.js';

export const SHRINK = 0.57;

const VO2_AGES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
const VO2_F = [40, 40, 38, 36, 34, 32, 30, 29, 27, 26, 25, 23, 22, 21, 20, 19, 18];
const VO2_M = [46, 46, 44, 42, 40, 37, 36, 34, 32, 30, 29, 27, 26, 25, 23, 22, 21];

export function targets(age, sex) {
  const male = sex !== 'female';
  const f = clamp((age - 40) / 25, 0, 1);
  const table = male ? VO2_M : VO2_F;
  return {
    sleepHours: 7,
    consistency: 70,
    steps: 8000 - 2400 * f,
    z13: 100 - 30 * f,
    z45: 10 - 3 * f,
    strength: 40,
    vo2max: interp(VO2_AGES.map((a, i) => [a, table[i]]), age),
    rhr: male ? 60 : 64,
    leanPct: male ? 80 : 67,
  };
}

/** Raw (unshrunk) age impact in years; positive = older. */
export const CURVES = {
  sleepHours: (h, T) => {
    const x = clamp(h, 5, 10);
    if (x < T) return 1.13 * (T - x);
    if (x <= 9) return -0.1 * (x - T);
    return 0;
  },
  consistency: (c, T) => -0.218 * (clamp(c, 40, 90) - T),
  steps: (s, T) => {
    const x = clamp(s, 2000, T + 4000);
    return x < T ? (1.03 * (T - x)) / 1000 : (-0.5 * (x - T)) / 1000;
  },
  z13: (m, T) => -2.21 * (Math.log(1 + clamp(m, 0, 600) / 60) - Math.log(1 + T / 60)),
  z45: (m, T) => -2.33 * (Math.log(1 + clamp(m, 0, 75) / 10) - Math.log(1 + T / 10)),
  strength: (m, T) => {
    const x = clamp(m, 0, 120);
    return x < T ? 1.63 * (1 - x / T) : (-0.5 * (x - T)) / 80;
  },
  vo2max: (v, T) => -0.4 * (clamp(v, T - 12, T + 12) - T),
  rhr: (r, T) => 0.086 * (clamp(r, 40, 90) - T),
  leanPct: (l, T) => (l < T ? 0.104 * (T - l) : -0.052 * Math.min(5, l - T)),
};

export const METRICS = [
  { key: 'sleepHours', label: 'Hours of sleep', unit: 'h/night', group: 'Sleep', dp: 1, tip: 'Aim for 7–9 h. Over 9 h has no effect.' },
  { key: 'consistency', label: 'Sleep consistency', unit: '%', group: 'Sleep', dp: 0, tip: 'Go to bed and wake at the same clock times, weekends included.' },
  { key: 'steps', label: 'Daily steps', unit: 'steps/day', group: 'Activity', dp: 0, tip: 'Benefits plateau around 8–10k (6–8k over 60).' },
  { key: 'z13', label: 'Time in HR zones 1-3', unit: 'min/week', group: 'Activity', dp: 0, tip: 'Easy-to-moderate cardio at 40–80% heart-rate reserve, logged as exercise.' },
  { key: 'z45', label: 'Time in HR zones 4-5', unit: 'min/week', group: 'Activity', dp: 0, tip: 'Hard intervals at 80%+ of heart-rate reserve. A few minutes a week counts.' },
  { key: 'strength', label: 'Strength activity time', unit: 'min/week', group: 'Activity', dp: 0, tip: 'Log weights, HIIT, pilates, yoga or functional training as exercise.' },
  { key: 'vo2max', label: 'VO₂ max', unit: 'ml/kg/min', group: 'Fitness', dp: 1, tip: 'Fitbit Cardio Fitness Score. Outdoor runs with GPS improve the estimate.' },
  { key: 'rhr', label: 'Resting heart rate (sleep)', unit: 'bpm', group: 'Fitness', dp: 0, tip: 'Measured while asleep. Aerobic fitness and good sleep lower it.' },
  { key: 'leanPct', label: 'Lean body mass', unit: '%', group: 'Fitness', dp: 1, tip: 'From a smart scale or a manual body-fat entry. Ignored when missing.' },
];

/** Aggregate the nine inputs over a window of analysed days. */
export function aggregate(days, profile = {}) {
  const wear = days.filter((d) => d.validWear);
  const weeks = wear.length / 7;
  const perWeek = (f) => (weeks > 0 ? wear.reduce((a, d) => a + (f(d) || 0), 0) / weeks : null);
  const anyZones = wear.some((d) => isNum(d.workoutZ13));
  const fat = isNum(profile.bodyFatPct) ? profile.bodyFatPct : mean(days.map((d) => d.bodyFatPct));
  return {
    sleepHours: mean(days.filter((d) => d.validNight).map((d) => d.sleep.asleepMin / 60)),
    consistency: mean(days.map((d) => d.consistency)),
    steps: mean(wear.map((d) => d.steps)),
    z13: anyZones ? perWeek((d) => d.workoutZ13) : null,
    z45: anyZones ? perWeek((d) => d.workoutZ45) : null,
    strength: perWeek((d) => d.strengthMin),
    // Only GPS-run VO2max counts; demographic estimates re-count resting HR and age (report rule).
    vo2max: mean(days.map((d) => (d.vo2Estimated ? null : d.vo2max))),
    rhr: mean(days.filter((d) => d.validNight).map((d) => d.sleepRhr)),
    leanPct: isNum(fat) ? 100 - fat : null,
  };
}

export function bodyAge(values, age, sex, { vo2Weight = 1 } = {}) {
  const T = targets(age, sex);
  const rows = METRICS.map((m) => {
    const v = values[m.key];
    const has = isNum(v);
    const w = m.key === 'vo2max' ? vo2Weight : 1;
    return { ...m, value: has ? v : null, target: T[m.key], years: has ? w * SHRINK * CURVES[m.key](v, T[m.key]) : 0, missing: !has, weight: w };
  });
  const offset = rows.reduce((a, r) => a + r.years, 0);
  return { age: age + offset, offset, rows };
}

export function paceBand(p) {
  if (p == null) return null;
  if (p > 1.05) return { key: 'accelerated', label: 'Accelerated' };
  if (p >= 0.95) return { key: 'steady', label: 'Steady' };
  if (p >= 0) return { key: 'slowing', label: 'Slowing' };
  return { key: 'reversing', label: 'Reversing' };
}

export function pace(nowAge, projectedAge) {
  return clamp((projectedAge - nowAge) / 0.5, -1, 3);
}

/**
 * @param {Array} days analysed days (chronological), ending at the evaluation date
 * @param {{age:number, sex:string, bodyFatPct?:number}} profile
 */
export function computeHealthspan(days, profile) {
  const last31 = days.slice(-31);
  const recoveries = last31.filter((d) => d.validNight).length;
  const opts = { vo2Weight: profile.vo2Weight ?? 1 };
  const now = bodyAge(aggregate(days.slice(-182), profile), profile.age, profile.sex, opts);
  // Projection: last-30-day habits held for 6 months. Targets are kept at today's age so that Pace reflects
  // behaviour change only (identical habits → exactly 1.0x), then 0.5 y of calendar time is added.
  const proj = bodyAge(aggregate(days.slice(-30), profile), profile.age, profile.sex, opts);
  const p = pace(now.age, proj.age + 0.5);
  return {
    sexKnown: profile.sex === 'male' || profile.sex === 'female',
    unlocked: recoveries >= 21 && (profile.sex === 'male' || profile.sex === 'female'),
    recoveriesLast31: recoveries,
    calibrating: days.filter((d) => d.validNight).length < 90,
    chronologicalAge: profile.age,
    bodyAge: now.age,
    difference: now.offset,
    pace: p,
    paceBand: paceBand(p),
    rows: now.rows.map((r, i) => ({ ...r, recentValue: proj.rows[i].value, recentYears: proj.rows[i].years })),
  };
}
