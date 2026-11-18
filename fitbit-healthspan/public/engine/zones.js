// Heart-rate-reserve (Karvonen) zone accounting.
// Bands are minutes spent at 40-50, 50-60, 60-70, 70-80, 80-90, 90-100 %HRR.
// WHOOP Healthspan zones: Z1 40-60, Z2 60-70, Z3 70-80, Z4 80-90, Z5 90-100 %HRR (white paper p.23),
// so Z1-3 = bands[0..3] and Z4-5 = bands[4..5].

import { isNum } from './util.js';

export const BAND_EDGES = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

/** Tanaka et al. 2001 — better than 220-age for adults. */
export const estimateMaxHr = (age) => Math.round(208 - 0.7 * age);

export const emptyBands = () => [0, 0, 0, 0, 0, 0];

export function hrrFraction(hr, rhr, maxHr) {
  return (hr - rhr) / Math.max(1, maxHr - rhr);
}

export function bandIndex(frac) {
  for (let i = BAND_EDGES.length - 1; i >= 0; i--) if (frac >= BAND_EDGES[i]) return i;
  return -1;
}

/**
 * Accumulate minutes per %HRR band from per-minute heart rate.
 * @param {Array<number|null>} hrMinutes  heart rate per minute (null = no reading)
 * @param {number} rhr resting heart rate
 * @param {number} maxHr maximum heart rate
 * @param {number} [from=0] first minute index (inclusive)
 * @param {number} [to=hrMinutes.length] last minute index (exclusive)
 */
export function bandsFromHr(hrMinutes, rhr, maxHr, from = 0, to = hrMinutes.length) {
  const bands = emptyBands();
  for (let i = Math.max(0, from); i < Math.min(to, hrMinutes.length); i++) {
    const hr = hrMinutes[i];
    if (!isNum(hr)) continue;
    const b = bandIndex(hrrFraction(hr, rhr, maxHr));
    if (b >= 0) bands[b] += 1;
  }
  return bands;
}

/**
 * Fallback when only Fitbit Active Zone Minutes are known (no intraday HR).
 * Fitbit AZM zones are themselves %HRR based: fat burn ≈ 40-59%, cardio ≈ 60-84%, peak ≥ 85%.
 * `azm` values are *minutes in zone* (not the doubled AZM credit).
 */
export function bandsFromAzm(azm) {
  if (!azm) return null;
  const fb = azm.fatBurn || 0;
  const c = azm.cardio || 0;
  const p = azm.peak || 0;
  return [fb * 0.5, fb * 0.5, c * 0.4, c * 0.4, c * 0.2 + p * 0.5, p * 0.5];
}

export const z13 = (bands) => (bands ? bands[0] + bands[1] + bands[2] + bands[3] : 0);
export const z45 = (bands) => (bands ? bands[4] + bands[5] : 0);

export function addBands(a, b) {
  if (!a) return b ? [...b] : null;
  if (!b) return [...a];
  return a.map((v, i) => v + b[i]);
}
