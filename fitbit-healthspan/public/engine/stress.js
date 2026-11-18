// Stress Monitor (0-3) — report §S6.
//
// [OFFICIAL] 0-3 score from HR + HRV vs a 14-day baseline, with motion correction; 0-1 calm, 1-2 alert, 2-3 activated.
// [PATENT]   S = f(motion)·[w·HR_score + (1−w)·HRV_score].
// [RECON]    HR_score = 3·clamp((HR_5min − RHR14) / (0.5·(HRmax − RHR14)), 0, 1). Fitbit's HRV samples are
//            sleep-derived, so daytime stress here runs on HR alone (w = 1). Minutes inside logged workouts or
//            with > 60 steps/min are marked "activity" and not scored.

import { clamp, isNum } from './util.js';

export function stressMinutes(day, rhr14, maxHr) {
  const hr = day.hrMinutes;
  if (!hr || !isNum(rhr14)) return null;
  const active = new Uint8Array(1440);
  for (const w of day.workouts || []) {
    if (w.startMinute == null) continue;
    for (let i = w.startMinute; i < Math.min(1440, w.startMinute + w.durationMin); i++) active[i] = 1;
  }
  if (day.stepMinutes) day.stepMinutes.forEach((s, i) => { if (s > 60) active[i] = 1; });
  const out = new Array(1440).fill(null);
  const denom = Math.max(5, 0.5 * (maxHr - rhr14));
  for (let i = 0; i < 1440; i++) {
    const win = [];
    for (let j = Math.max(0, i - 4); j <= i; j++) if (isNum(hr[j])) win.push(hr[j]);
    if (!isNum(hr[i]) || !win.length) continue;
    if (active[i]) { out[i] = -1; continue; }
    const h5 = win.reduce((a, b) => a + b, 0) / win.length;
    out[i] = clamp((3 * (h5 - rhr14)) / denom, 0, 3);
  }
  return out;
}

/** Summarise a day's stress; `sleepWindow` = [startMinute, endMinute) of the main sleep inside this calendar day. */
export function summariseStress(perMinute, sleepRanges = []) {
  if (!perMinute) return null;
  const inSleep = new Uint8Array(1440);
  for (const [a, b] of sleepRanges) for (let i = Math.max(0, a); i < Math.min(1440, b); i++) inSleep[i] = 1;
  const awake = [];
  const asleep = [];
  perMinute.forEach((v, i) => {
    if (v == null || v < 0) return;
    (inSleep[i] ? asleep : awake).push(v);
  });
  if (!awake.length && !asleep.length) return null;
  const series = [];
  for (let s = 0; s < 1440; s += 15) {
    const chunk = perMinute.slice(s, s + 15);
    const vals = chunk.filter((v) => v != null && v >= 0);
    series.push({
      minute: s,
      value: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
      activity: chunk.filter((v) => v === -1).length > 7,
      asleep: inSleep[s] === 1,
    });
  }
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  return {
    average: avg(awake),
    highPct: awake.length ? (100 * awake.filter((v) => v >= 2).length) / awake.length : null,
    lowPct: awake.length ? (100 * awake.filter((v) => v < 1).length) / awake.length : null,
    sleepStressPct: asleep.length ? (100 * asleep.filter((v) => v >= 2).length) / asleep.length : null,
    series,
  };
}

export function stressBand(v) {
  if (v == null) return null;
  if (v >= 2) return { key: 'high', label: 'Highly activated' };
  if (v >= 1) return { key: 'medium', label: 'Alert' };
  return { key: 'low', label: 'Calm' };
}
