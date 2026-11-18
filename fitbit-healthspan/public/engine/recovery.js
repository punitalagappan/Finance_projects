// Recovery (0-100%) — WHOOP-style readiness (report §S2-S3).
//
// [OFFICIAL] morning score, Red 0-33 / Yellow 34-66 / Green 67-100; HRV (RMSSD) weighs most, then RHR;
//            sleep, respiratory rate, skin temp and SpO2 contribute; ~30-day baseline; hidden for first 4 days.
// [RECON]    robust z-scores (median / 1.4826·MAD) vs previous 30 valid nights;
//            Z = 0.55·z_HRV + 0.25·z_RHR + 0.20·z_SP − penalties (resp, temp, SpO2, prior strain);
//            Z* = Z / SD(Z over last 90 days) (0.75 until 30 scores); Recovery = 100/(1+e^−(1.06·Z*+0.44)),
//            which yields ≈15% red, ≈40% green and mean ≈59 for a standard-normal Z*.

import { median, isNum, clamp, sd } from './util.js';

const FLOORS = { lnHrv: 0.05, rhr: 1.0, respRate: 0.3, spo2: 0.5 };

export function robust(values, floor) {
  const v = values.filter(isNum);
  if (!v.length) return { med: null, sd: null, n: 0 };
  const med = median(v);
  const mad = median(v.map((x) => Math.abs(x - med)));
  return { med, sd: Math.max(1.4826 * mad, floor), n: v.length };
}

export function baselines(history) {
  const h = history.filter((d) => d.validNight).slice(-30);
  return {
    lnHrv: robust(h.map((d) => (isNum(d.hrv) ? Math.log(d.hrv) : null)), FLOORS.lnHrv),
    rhr: robust(h.map((d) => d.sleepRhr), FLOORS.rhr),
    respRate: robust(h.map((d) => d.respRate), FLOORS.respRate),
    spo2: robust(h.map((d) => d.spo2), FLOORS.spo2),
    strain: robust(history.slice(-30).map((d) => d.strain), 1),
  };
}

const zOf = (x, b) => (isNum(x) && b.n >= 4 ? (x - b.med) / b.sd : null);

/**
 * @param {object} day     today's record (needs hrv, sleepRhr; optional respRate, skinTempDelta, skinTempSd, spo2)
 * @param {Array} history  previous analysed days, chronological, excluding today
 * @param {number|null} sleepPerf  today's Sleep Performance 0-100
 */
export function computeRecovery(day, history, sleepPerf) {
  if (!isNum(day.hrv) && !isNum(day.sleepRhr)) return null;
  const b = baselines(history);
  if (b.lnHrv.n < 4 && b.rhr.n < 4) return { calibrating: true };

  const zHrv = zOf(isNum(day.hrv) ? Math.log(day.hrv) : null, b.lnHrv);
  const zRhrRaw = zOf(day.sleepRhr, b.rhr);
  const zRhr = zRhrRaw == null ? null : -zRhrRaw;
  const zSp = isNum(sleepPerf) ? (sleepPerf - 85) / 12 : null;

  // Weighted mean over the components we have (renormalised if one is missing).
  const parts = [[0.55, zHrv], [0.25, zRhr], [0.2, zSp]].filter(([, v]) => v != null);
  const wSum = parts.reduce((a, [w]) => a + w, 0);
  let Z = parts.reduce((a, [w, v]) => a + w * clamp(v, -4, 4), 0) / wSum;

  const zRR = zOf(day.respRate, b.respRate);
  const penRR = zRR == null ? 0 : Math.min(1, 0.5 * Math.max(0, zRR - 1.5));
  const tempSd = Math.max(day.skinTempSd ?? 0.25, 0.1);
  const penT = isNum(day.skinTempDelta) ? Math.min(1, 0.5 * Math.max(0, Math.abs(day.skinTempDelta) / tempSd - 1.5)) : 0;
  const zO2 = zOf(day.spo2, b.spo2);
  const penO2 = zO2 == null ? 0 : Math.min(1, 0.5 * Math.max(0, -zO2 - 1.5));
  const prev = history[history.length - 1];
  const zS = prev && b.strain.n >= 7 ? zOf(prev.strain, b.strain) : null;
  const penS = zS == null ? 0 : Math.min(0.5, 0.1 * Math.max(0, zS));
  Z -= penRR + penT + penO2 + penS;

  const prevZ = history.slice(-90).map((d) => d.recovery && d.recovery.Z).filter(isNum);
  const sZ = prevZ.length >= 30 ? Math.max(sd(prevZ), 0.3) : 0.75;
  const Zs = Z / sZ;
  const score = 100 / (1 + Math.exp(-(1.06 * Zs + 0.44)));

  return {
    score: clamp(score, 1, 99),
    Z,
    calibrating: b.lnHrv.n < 14,
    contributors: { hrv: zHrv, rhr: zRhr, sleep: zSp },
    penalties: { respRate: penRR, skinTemp: penT, spo2: penO2, priorStrain: penS },
    baselines: {
      hrv: isNum(b.lnHrv.med) ? Math.exp(b.lnHrv.med) : null,
      rhr: b.rhr.med,
      respRate: b.respRate.med,
      spo2: b.spo2.med,
    },
  };
}

export function recoveryBand(score) {
  if (score == null) return null;
  if (score >= 67) return { key: 'green', label: 'Green' };
  if (score >= 34) return { key: 'yellow', label: 'Yellow' };
  return { key: 'red', label: 'Red' };
}
