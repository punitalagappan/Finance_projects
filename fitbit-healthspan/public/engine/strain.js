// Strain (0-21) — WHOOP-style cardiovascular load (report §S4).
//
// [OFFICIAL] logarithmic 0-21 scale, 21 ≈ max HR for 24 h, ~6.5 for a 1 h walk, ~12 for a 1 h run,
//            Day Strain is computed from total load (never by summing activity scores).
// [LIT]      Banister TRIMP weight per minute: x·0.64·e^(1.92x) (male) / x·0.86·e^(1.67x) (female), x = %HRR.
// [RECON]    soft-capped log map b = 6.4·ln(1 + L/20.5); Strain = 21·b / (b^12 + 21^12)^(1/12),
//            fitted to WHOOP's anchors (walk 6.2, run 12.4, marathon 20.1, 24 h max 21.0).

import { clamp, isNum } from './util.js';
import { hrrFraction } from './zones.js';

const A = 6.4;
const K = 20.5;
const P = 12;

export function trimpWeight(x, sex) {
  if (x < 0.2) return 0;
  const xc = clamp(x, 0, 1);
  const m = xc * 0.64 * Math.exp(1.92 * xc);
  const f = xc * 0.86 * Math.exp(1.67 * xc);
  if (sex === 'female') return f;
  if (sex === 'male') return m;
  return (m + f) / 2; // sex unknown: averaged coefficients (flagged)
}

/** Banister load from per-minute HR between minute indices [from, to). */
export function loadFromHr(hrMinutes, rhr, maxHr, sex, from = 0, to = hrMinutes.length) {
  let load = 0;
  for (let i = Math.max(0, from); i < Math.min(to, hrMinutes.length); i++) {
    const hr = hrMinutes[i];
    if (isNum(hr)) load += trimpWeight(hrrFraction(hr, rhr, maxHr), sex);
  }
  return load;
}

/** Fallback load from %HRR band minutes (band midpoints 45…95%). Misses the 20-40% HRR range. */
const MIDPOINTS = [0.45, 0.55, 0.65, 0.75, 0.85, 0.95];
export function loadFromBands(bands, sex) {
  if (!bands) return 0;
  return bands.reduce((acc, min, i) => acc + min * trimpWeight(MIDPOINTS[i], sex), 0);
}

export function strainFromLoad(load) {
  if (!isNum(load) || load <= 0) return 0;
  const b = A * Math.log(1 + load / K);
  return clamp((21 * b) / Math.pow(b ** P + 21 ** P, 1 / P), 0, 21);
}

export function strainBand(strain) {
  if (strain == null) return null;
  if (strain >= 18) return { key: 'allout', label: 'All Out' };
  if (strain >= 14) return { key: 'high', label: 'High' };
  if (strain >= 10) return { key: 'moderate', label: 'Moderate' };
  return { key: 'light', label: 'Light' };
}

/** Strain coach target for today given this morning's recovery [RECON heuristic]. */
export function strainTarget(recovery) {
  if (recovery == null) return { lo: 8, hi: 12, label: 'Calibrating: keep it moderate' };
  if (recovery >= 67) return { lo: 14, hi: 18, label: 'Primed: a hard session will pay off' };
  if (recovery >= 34) return { lo: 10, hi: 14, label: 'Maintain: moderate training' };
  return { lo: 0, hi: 10, label: 'Restore: prioritise rest and mobility' };
}
