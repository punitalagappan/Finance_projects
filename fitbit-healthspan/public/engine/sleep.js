// Sleep: consistency, sleep need, sleep debt, sleep performance, planner (report §S5).
//
// [OFFICIAL] Need = Baseline + f(prior-day strain) + f(sleep debt) − naps; Sufficiency = sleep / need;
//            Performance blends sufficiency, consistency, efficiency, sleep stress; bands ≥85 / 70-85 / <70;
//            Consistency compares the last 24 h sleep/wake pattern with the previous 4 days.
// [RECON]    Baseline = median sleep over the last 28 nights after below-median strain, clamped 7-9 h (8 h default);
//            +5 min per strain point above 10; debt D_t = clamp(0.794·D_{t−1} + (B − TST_{t−1}), 0, 120);
//            performance weights 0.55 / 0.20 / 0.15 / 0.10 on threshold-aligned sub-scores.

import { clamp, isNum, median, addDays, parseDate } from './util.js';

export const DEFAULT_BASELINE_MIN = 480;

/** Asleep mask on the civil clock for the noon-to-noon window ending on wake date `date`. */
export function sleepMask(date, sleep) {
  const mask = new Uint8Array(1440);
  if (!sleep || !sleep.start || !sleep.end) return mask;
  const windowStart = parseDate(addDays(date, -1)).getTime() + 12 * 3600000;
  const a = Math.floor((new Date(sleep.start).getTime() - windowStart) / 60000);
  const b = Math.floor((new Date(sleep.end).getTime() - windowStart) / 60000);
  for (let i = Math.max(0, a); i < Math.min(1440, b); i++) mask[i] = 1;
  return mask;
}

export function sleepConsistency(byDate, date) {
  const today = byDate.get(date);
  if (!today || !today.sleep) return null;
  const m0 = sleepMask(date, today.sleep);
  let agree = 0;
  let total = 0;
  for (let k = 1; k <= 4; k++) {
    const prev = byDate.get(addDays(date, -k));
    if (!prev || !prev.sleep) continue;
    const mk = sleepMask(addDays(date, -k), prev.sleep);
    for (let i = 0; i < 1440; i++) if (m0[i] === mk[i]) agree++;
    total += 1440;
  }
  if (total < 2 * 1440) return null;
  return clamp(200 * (agree / total) - 100, 0, 100);
}

/** @param history analysed days before tonight (chronological). */
export function baselineNeed(history) {
  const recent = history.slice(-28);
  const medStrain = median(recent.map((d) => d.strain));
  const qualifying = recent
    .filter((d, i) => {
      if (!d.sleep || !isNum(d.sleep.asleepMin)) return false;
      const prev = recent[i - 1];
      return !prev || !isNum(prev.strain) || !isNum(medStrain) || prev.strain < medStrain;
    })
    .map((d) => d.sleep.asleepMin);
  if (qualifying.length < 14) return DEFAULT_BASELINE_MIN;
  return clamp(median(qualifying), 420, 540);
}

export const strainNeedMinutes = (strain) => (isNum(strain) ? 5 * Math.max(0, strain - 10) : 0);

export function nextDebt(prevDebt, baseline, lastNightAsleepMin) {
  const carried = 0.794 * (prevDebt || 0);
  if (!isNum(lastNightAsleepMin)) return clamp(carried, 0, 120);
  return clamp(carried + (baseline - lastNightAsleepMin), 0, 120);
}

/**
 * Need for the night ending on wake date t.
 * @param history   analysed days up to and including day t−1 (the day before the night)
 */
export function sleepNeed(history) {
  const prev = history[history.length - 1];
  const baselineMin = baselineNeed(history);
  const debtMin = nextDebt(prev ? prev.sleepDebtMin : 0, baselineMin, prev && prev.sleep ? prev.sleep.asleepMin : null);
  const strainMin = strainNeedMinutes(prev ? prev.strain : null);
  const napMin = prev ? prev.napMin || 0 : 0;
  return { totalMin: Math.max(300, baselineMin + strainMin + debtMin - napMin), baselineMin, strainMin, debtMin, napMin };
}

export function sleepEfficiency(sleep) {
  if (!sleep || !isNum(sleep.asleepMin) || !isNum(sleep.inBedMin) || sleep.inBedMin <= 0) return null;
  return clamp((100 * sleep.asleepMin) / sleep.inBedMin, 0, 100);
}

export function sleepPerformance(sleep, needMin, consistency, sleepStressPct) {
  if (!sleep || !isNum(sleep.asleepMin) || !needMin) return null;
  const sufficiency = 100 * Math.min(1, sleep.asleepMin / needMin);
  const eff = sleepEfficiency(sleep);
  const parts = [
    [0.55, sufficiency],
    [0.2, isNum(eff) ? clamp(85 + 1.5 * (eff - 90), 0, 100) : null],
    [0.15, isNum(consistency) ? clamp(85 + 1.5 * (consistency - 80), 0, 100) : null],
    [0.1, isNum(sleepStressPct) ? clamp(85 - 3.75 * (sleepStressPct - 1), 0, 100) : null],
  ].filter(([, v]) => v != null);
  const w = parts.reduce((a, [x]) => a + x, 0);
  return {
    score: parts.reduce((a, [x, v]) => a + x * v, 0) / w,
    sufficiency,
    efficiency: eff,
    consistency: isNum(consistency) ? consistency : null,
    sleepStressPct: isNum(sleepStressPct) ? sleepStressPct : null,
    restorativeMin: sleep.classic ? null : (sleep.deepMin || 0) + (sleep.remMin || 0),
  };
}

export function sleepBand(score) {
  if (score == null) return null;
  if (score >= 85) return { key: 'optimal', label: 'Optimal' };
  if (score >= 70) return { key: 'sufficient', label: 'Sufficient' };
  return { key: 'poor', label: 'Poor' };
}

const fmtClock = (x) => {
  const m = ((Math.round(x) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Recommended time in bed = need / typical efficiency; bedtime counted back from the wake time. */
export function bedtimeFor(needMin, wakeTime, efficiencyPct = 90) {
  const [h, m] = wakeTime.split(':').map(Number);
  const inBed = needMin / (clamp(efficiencyPct, 60, 100) / 100);
  return { bedtime: fmtClock(h * 60 + m - inBed), inBedMin: Math.round(inBed) };
}
