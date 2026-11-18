// Health Monitor: overnight vitals vs your own 30-day normal range (mean ± 2 SD with sensible floors).

import { mean, sd, isNum } from './util.js';

export const VITALS = [
  { key: 'hrv', label: 'Heart rate variability', unit: 'ms', floor: 6, dp: 0 },
  { key: 'sleepRhr', label: 'Resting heart rate (sleep)', unit: 'bpm', floor: 2, dp: 0 },
  { key: 'respRate', label: 'Respiratory rate', unit: 'rpm', floor: 0.4, dp: 1 },
  { key: 'spo2', label: 'Blood oxygen', unit: '%', floor: 0.8, dp: 1 },
  { key: 'skinTempDelta', label: 'Skin temp (vs baseline)', unit: '°C', floor: 0.3, dp: 2, centred: true },
];

export function healthMonitor(day, history) {
  return VITALS.map((v) => {
    const vals = history.slice(-30).map((d) => d[v.key]).filter(isNum);
    const value = day ? day[v.key] : null;
    if (vals.length < 7) return { ...v, value, lo: null, hi: null, status: isNum(value) ? 'calibrating' : 'nodata' };
    const m = v.centred ? 0 : mean(vals);
    const s = Math.max(sd(vals) ?? 0, v.floor / 2);
    const lo = m - 2 * s;
    const hi = m + 2 * s;
    let status = 'nodata';
    if (isNum(value)) status = value < lo || value > hi ? 'out' : 'in';
    return { ...v, value, lo, hi, mean: m, status };
  });
}
