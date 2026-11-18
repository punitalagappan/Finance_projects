// Confidence flags per score (reports/Fitbit vs WHOOP tracker differences.md, "Confidence flags").
// High = no flags · Medium = 1-2 minor · Low = any major or 3+ minor. Low Recovery is shown greyed.

import { isNum, addDays } from './util.js';

export const FLAG_INFO = {
  CALIBRATING: { severity: 'major', text: 'Still building your baseline' },
  DEVICE_CHANGED: { severity: 'major', text: 'Fewer than 14 nights on your new tracker' },
  NO_STAGES: { severity: 'major', text: 'Sleep was not staged (classic mode)' },
  LOW_HR_COVERAGE: { severity: 'major', text: 'Less than 16 h of heart-rate data' },
  HRV_WHOLE_NIGHT: { severity: 'minor', text: 'Using whole-night HRV (deep-sleep HRV missing)' },
  RHR_AWAKE_ONLY: { severity: 'minor', text: "Fitbit's RHR came from awake data only" },
  NO_SPO2: { severity: 'minor', text: 'No SpO₂ last night' },
  NO_TEMP: { severity: 'minor', text: 'No skin temperature last night' },
  SLEEP_EDITED: { severity: 'minor', text: 'Sleep was edited manually' },
  BAND_HIGH_INTENSITY: { severity: 'minor', text: 'Over 20 min above 80% HRR on a band (wrist HR is less accurate at high intensity)' },
  VO2_DEMOGRAPHIC: { severity: 'minor', text: 'No GPS-run VO₂max, so VO₂max is left out of Body Age' },
  SEX_UNKNOWN: { severity: 'major', text: 'Biological sex not set: strain uses averaged coefficients' },
};

export function level(flags) {
  const major = flags.filter((f) => FLAG_INFO[f]?.severity === 'major').length;
  const minor = flags.length - major;
  if (major > 0 || minor >= 3) return 'low';
  if (minor > 0) return 'medium';
  return 'high';
}

const pack = (flags) => ({ level: level(flags), flags });

/**
 * @param {object} d        analysed day
 * @param {object} ctx      { hrvSource, device, deviceSince, sexKnown }
 */
export function dayConfidence(d, ctx) {
  const common = [];
  if (ctx.deviceSince && d.date >= ctx.deviceSince && d.date < addDays(ctx.deviceSince, 14)) common.push('DEVICE_CHANGED');

  const rec = [...common];
  if (d.recovery?.calibrating) rec.push('CALIBRATING');
  if (d.sleep?.classic) rec.push('NO_STAGES');
  if (isNum(d.hrv) && ctx.hrvSource === 'whole-night') rec.push('HRV_WHOLE_NIGHT');
  if (d.rhrAwakeOnly && d.quality?.rhrSource !== 'sleep-hr') rec.push('RHR_AWAKE_ONLY');
  if (!isNum(d.spo2)) rec.push('NO_SPO2');
  if (!isNum(d.skinTempDelta)) rec.push('NO_TEMP');
  if (d.sleep?.edited) rec.push('SLEEP_EDITED');

  const strain = [...common];
  if (d.hrMinutes && d.quality?.hrHours < 16) strain.push('LOW_HR_COVERAGE');
  if (ctx.device?.tier !== 'A' && d.bands && d.bands[4] + d.bands[5] > 20) strain.push('BAND_HIGH_INTENSITY');
  if (!ctx.sexKnown) strain.push('SEX_UNKNOWN');

  const sleep = [];
  if (d.sleep?.classic) sleep.push('NO_STAGES');
  if (d.sleep?.edited) sleep.push('SLEEP_EDITED');

  return { recovery: pack(rec), strain: pack(strain), sleep: pack(sleep) };
}
