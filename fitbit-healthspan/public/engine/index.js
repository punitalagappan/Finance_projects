// analyze(): turns normalised daily Fitbit / Google Health records into every score the app shows.
//
// Input day schema (all optional except `date`; times are local wall-clock ISO strings without "Z"):
// {
//   date: 'YYYY-MM-DD',                       // civil date; sleep is keyed by its wake-up date
//   sleep: { start, end, asleepMin, inBedMin, deepMin, remMin, lightMin, awakeMin } | null,   // main sleep
//   naps: [{ start, end, asleepMin }],
//   hrvDeep, hrvAvg,    // nightly deep-sleep / whole-night RMSSD in ms (Google Health); or `hrv` if only one is known
//   rhr,                // Fitbit daily resting HR (fallback for sleeping RHR)
//   respRate, spo2,     // nightly breaths/min and SpO2 %
//   skinTempDelta,      // nightly skin temp minus personal baseline, °C
//   skinTempSd,         // optional 30-day SD of the nightly deviation
//   vo2max, vo2Estimated, // VO2max and whether it is a demographic (non-GPS) estimate
//   steps, weightKg, bodyFatPct,
//   azm: { fatBurn, cardio, peak },            // minutes in Fitbit AZM zones (fallback when no intraday HR)
//   workouts: [{ name, type, start, durationMin, avgHr, strength }],
//   hrMinutes: number[1440] | null,           // mean HR per minute, local midnight → midnight
//   stepMinutes: number[1440] | null,
// }

import { isNum, median, percentile, addDays, parseDate, dateRange, mean, sd } from './util.js';
import { bandsFromHr, bandsFromAzm, addBands, z13, z45 } from './zones.js';
import { loadFromHr, loadFromBands, strainFromLoad, strainTarget } from './strain.js';
import { sleepConsistency, sleepNeed, sleepPerformance, sleepEfficiency } from './sleep.js';
import { computeRecovery } from './recovery.js';
import { stressMinutes, summariseStress } from './stress.js';
import { computeHealthspan } from './healthspan.js';
import { healthMonitor } from './monitor.js';
import { deviceProfile } from './devices.js';
import { dayConfidence } from './confidence.js';

export const STRENGTH_TYPES = new Set([
  'STRENGTH_TRAINING', 'WEIGHTLIFTING', 'WEIGHTS', 'FREE_WEIGHTS', 'WEIGHT_MACHINES', 'FUNCTIONAL_STRENGTH_TRAINING',
  'POWERLIFTING', 'BODY_WEIGHT', 'CALISTHENICS', 'CIRCUIT_TRAINING', 'CROSSFIT', 'HIIT', 'RESISTANCE_BANDS',
  'CORE_TRAINING', 'TRX', 'PILATES', 'YOGA', 'BARRE', 'BOOTCAMP',
]);
const STRENGTH_WORDS = /weight|strength|lift|hiit|crossfit|circuit|pilates|yoga|barre|calisthenic|bootcamp|functional|core|trx|kettlebell|f45|ruck/i;

export const isStrength = (w) => {
  if (typeof w.strength === 'boolean') return w.strength;
  if (w.type && STRENGTH_TYPES.has(String(w.type).toUpperCase())) return true;
  return STRENGTH_WORDS.test(`${w.type || ''} ${w.name || ''}`);
};

/** Gellish et al. 2007 non-linear max HR, floored by what the user has actually reached. */
export function estimateMaxHr(age, observed = []) {
  const gellish = 192 - 0.007 * age * age;
  const p = percentile(observed, 0.995);
  return Math.round(Math.max(gellish, isNum(p) ? p : 0));
}

/**
 * New-device baseline segment: once ≥7 valid nights exist on the new tracker (before `date`), rescale the old
 * segment's HRV and sleeping RHR by the ratio of medians (new / old) so baselines stay comparable.
 */
export function segmentHistory(history, date, since) {
  if (!since || date < since) return history;
  const oldSeg = history.filter((d) => d.date < since);
  const newSeg = history.filter((d) => d.date >= since);
  if (!oldSeg.length) return history;
  if (newSeg.filter((d) => d.validNight).length < 7) return history;
  const ratio = (key) => {
    const a = median(newSeg.map((d) => d[key]));
    const b = median(oldSeg.slice(-30).map((d) => d[key]));
    return isNum(a) && isNum(b) && b > 0 ? a / b : 1;
  };
  const rH = ratio('hrv');
  const rR = ratio('sleepRhr');
  return [
    ...oldSeg.map((d) => ({ ...d, hrv: isNum(d.hrv) ? d.hrv * rH : d.hrv, sleepRhr: isNum(d.sleepRhr) ? d.sleepRhr * rR : d.sleepRhr })),
    ...newSeg,
  ];
}

/** Bridge sampling gaps up to `maxGap` minutes by linear interpolation (Fitbit samples every 5-15 s at rest). */
export function bridgeGaps(arr, maxGap = 5) {
  const out = arr.slice();
  let last = -1;
  for (let i = 0; i < out.length; i++) {
    if (!isNum(out[i])) continue;
    const gap = i - last - 1;
    if (last >= 0 && gap > 0 && gap <= maxGap) {
      for (let k = 1; k <= gap; k++) out[last + k] = out[last] + ((out[i] - out[last]) * k) / (gap + 1);
    }
    last = i;
  }
  return out;
}

const minuteOf = (iso) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes(); };

/** Collect per-minute values from day arrays spanning [startIso, endIso). */
function spanMinutes(byDate, key, startIso, endIso) {
  const out = [];
  const s = new Date(startIso);
  const e = new Date(endIso);
  for (let t = new Date(s); t < e; t = new Date(t.getTime() + 60000)) {
    const date = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const arr = byDate.get(date)?.[key];
    if (!arr) continue;
    const v = arr[t.getHours() * 60 + t.getMinutes()];
    out.push(v);
  }
  return out;
}

function sleepRangesForDay(date, byDate) {
  // Minutes of calendar day `date` covered by the night ending today and the night ending tomorrow.
  const ranges = [];
  const dayStart = parseDate(date).getTime();
  for (const d of [date, addDays(date, 1)]) {
    const s = byDate.get(d)?.sleep;
    if (!s) continue;
    const a = Math.floor((new Date(s.start).getTime() - dayStart) / 60000);
    const b = Math.floor((new Date(s.end).getTime() - dayStart) / 60000);
    if (b > 0 && a < 1440) ranges.push([Math.max(0, a), Math.min(1440, b)]);
  }
  return ranges;
}

export function analyze(rawDays, profile, opts = {}) {
  if (!rawDays || !rawDays.length) return null;
  const sexKnown = profile.sex === 'female' || profile.sex === 'male';
  const sex = sexKnown ? profile.sex : 'unknown';
  const sorted = [...rawDays].sort((a, b) => (a.date < b.date ? -1 : 1));
  const input = new Map(sorted.map((d) => [d.date, d]));
  const dates = dateRange(sorted[0].date, opts.until || sorted[sorted.length - 1].date);

  const device = deviceProfile(profile.device);

  // Fitbit adaptation: one consistent HRV series. Deep-sleep RMSSD is the closest analogue to WHOOP's
  // slow-wave-weighted HRV; if it is missing on >20% of nights, use whole-night RMSSD for every night instead.
  const hrvNights = sorted.filter((d) => isNum(d.hrvDeep) || isNum(d.hrvAvg));
  const deepShare = hrvNights.length ? hrvNights.filter((d) => isNum(d.hrvDeep)).length / hrvNights.length : 0;
  const hrvSource = !hrvNights.length ? 'single' : deepShare >= 0.8 ? 'deep' : 'whole-night';

  // ---- pass 1: normalise + per-day facts that don't depend on history ----
  const days = dates.map((date) => {
    const d = { ...(input.get(date) || {}), date };
    if (hrvSource === 'deep') d.hrv = isNum(d.hrvDeep) ? d.hrvDeep : null;
    else if (hrvSource === 'whole-night') d.hrv = isNum(d.hrvAvg) ? d.hrvAvg : null;
    if (d.hrMinutes) d.hrMinutes = bridgeGaps(d.hrMinutes.map((v) => (isNum(v) && v > 25 ? v : null)), 5);
    if (isNum(d.vo2max) && d.vo2Estimated == null) d.vo2Estimated = device.vo2 === 'demographic';
    d.workouts = (d.workouts || []).map((w) => ({
      ...w,
      strength: isStrength(w),
      startMinute: w.start ? minuteOf(w.start) : null,
      durationMin: w.durationMin || 0,
    }));
    d.napMin = (d.naps || []).reduce((a, n) => a + (n.asleepMin || 0), 0);
    const hrCoverage = d.hrMinutes ? d.hrMinutes.filter(isNum).length : 0;
    d.validWear = d.hrMinutes ? hrCoverage >= 600 : isNum(d.steps) && d.steps > 500;
    if (d.validWear === false && isNum(d.steps) && d.steps > 500 && !d.hrMinutes) d.validWear = true;
    return d;
  });
  const byDate = new Map(days.map((d) => [d.date, d]));

  // Sleeping RHR: 5th percentile of minute HR inside the main sleep (fallback: Fitbit daily RHR).
  for (const d of days) {
    d.sleepRhr = null;
    if (d.sleep && d.sleep.start && d.sleep.end) {
      const hr = spanMinutes(byDate, 'hrMinutes', d.sleep.start, d.sleep.end).filter(isNum);
      if (hr.length >= 120) d.sleepRhr = percentile(hr, 0.05);
    }
    if (!isNum(d.sleepRhr) && isNum(d.rhr)) d.sleepRhr = d.rhr;
    d.validNight = !!(d.sleep && d.sleep.asleepMin >= 180 && (isNum(d.hrv) || isNum(d.sleepRhr)));
    d.quality = {
      hrHours: d.hrMinutes ? d.hrMinutes.filter(isNum).length / 60 : 0,
      hrvSource: isNum(d.hrv) ? hrvSource : null,
      sleepStaged: d.sleep ? !d.sleep.classic : null,
      rhrSource: d.sleep && isNum(d.sleepRhr) && d.sleepRhr !== d.rhr ? 'sleep-hr' : isNum(d.rhr) ? 'fitbit-daily' : null,
    };
  }

  const exerciseHr = [];
  for (const d of days.slice(-90)) {
    if (!d.hrMinutes) continue;
    for (const w of d.workouts) {
      if (w.startMinute == null) continue;
      for (let i = w.startMinute; i < Math.min(1440, w.startMinute + w.durationMin); i++) if (isNum(d.hrMinutes[i])) exerciseHr.push(d.hrMinutes[i]);
    }
  }
  const maxHr = profile.maxHr || estimateMaxHr(profile.age, exerciseHr);

  // ---- pass 2: strain, zones, stress (need rolling RHR) ----
  days.forEach((d, i) => {
    const window = days.slice(Math.max(0, i - 29), i + 1).map((x) => x.sleepRhr);
    const rhrRef = median(window) ?? 60;
    d.rhrRef = rhrRef;

    let load = 0;
    let workoutBands = null;
    let workoutBandsKnown = false;
    for (const w of d.workouts) {
      let bands = null;
      let wl = null;
      if (d.hrMinutes && w.startMinute != null) {
        bands = bandsFromHr(d.hrMinutes, rhrRef, maxHr, w.startMinute, w.startMinute + w.durationMin);
        wl = loadFromHr(d.hrMinutes, rhrRef, maxHr, sex, w.startMinute, w.startMinute + w.durationMin);
      } else if (w.zoneMinutes) {
        bands = bandsFromAzm(w.zoneMinutes);
        wl = loadFromBands(bands, sex);
      } else if (isNum(w.avgHr)) {
        const frac = (w.avgHr - rhrRef) / (maxHr - rhrRef);
        bands = [0, 0, 0, 0, 0, 0];
        const idx = Math.max(-1, Math.min(5, Math.floor((frac - 0.4) / 0.1)));
        if (idx >= 0) bands[idx] = w.durationMin;
        wl = loadFromBands(bands, sex);
      }
      if (bands) { workoutBands = addBands(workoutBands, bands); workoutBandsKnown = true; }
      w.bands = bands;
      w.strain = wl == null ? null : strainFromLoad(wl);
    }

    if (d.hrMinutes && d.validWear) {
      load = loadFromHr(d.hrMinutes, rhrRef, maxHr, sex);
    } else if (d.azm || isNum(d.steps) || workoutBandsKnown) {
      const azmBands = bandsFromAzm(d.azm);
      load = loadFromBands(azmBands || workoutBands, sex) + (isNum(d.steps) ? (d.steps / 100) * 0.3 : 0);
    } else {
      load = null;
    }
    d.load = load;
    d.strain = load == null ? null : strainFromLoad(load);
    d.bands = d.hrMinutes ? bandsFromHr(d.hrMinutes, rhrRef, maxHr) : bandsFromAzm(d.azm);

    // Healthspan zone time counts only logged activities (WHOOP rule); fall back to Fitbit AZM without intraday HR.
    const zb = workoutBandsKnown ? workoutBands : (!d.hrMinutes && d.azm ? bandsFromAzm(d.azm) : (d.workouts.length === 0 && d.hrMinutes ? [0, 0, 0, 0, 0, 0] : null));
    d.workoutZ13 = zb ? z13(zb) : null;
    d.workoutZ45 = zb ? z45(zb) : null;
    d.strengthMin = d.workouts.filter((w) => w.strength).reduce((a, w) => a + w.durationMin, 0);

    const rhr14 = median(days.slice(Math.max(0, i - 13), i + 1).map((x) => x.sleepRhr));
    d._stressMin = stressMinutes(d, rhr14, maxHr);
  });

  days.forEach((d) => {
    d.stress = d._stressMin ? summariseStress(d._stressMin, sleepRangesForDay(d.date, byDate)) : null;
  });

  // ---- pass 3: chronological sleep need → performance → recovery ----
  days.forEach((d, i) => {
    const history = days.slice(0, i);
    const need = sleepNeed(history);
    d.sleepNeed = need;
    d.sleepNeedMin = need.totalMin;
    d.sleepDebtMin = need.debtMin;
    d.consistency = sleepConsistency(byDate, d.date);
    let sleepStressPct = null;
    if (d.sleep && d.sleep.start) {
      const s = spanMinutes(byDate, '_stressMin', d.sleep.start, d.sleep.end).filter((v) => v != null && v >= 0);
      if (s.length > 60) sleepStressPct = (100 * s.filter((v) => v >= 2).length) / s.length;
    }
    d.sleepPerf = sleepPerformance(d.sleep, need.totalMin, d.consistency, sleepStressPct);
    d.recovery = d.validNight || isNum(d.hrv) ? computeRecovery(d, segmentHistory(history.filter((x) => x.validNight || x.recovery), d.date, profile.deviceSince), d.sleepPerf?.score) : null;
    d.confidence = dayConfidence(d, { hrvSource, device, deviceSince: profile.deviceSince, sexKnown });
  });

  for (const d of days) delete d._stressMin;

  const latest = days[days.length - 1];
  const today = { ...latest };
  const tonight = sleepNeed(days);
  const effs = days.slice(-30).map((d) => sleepEfficiency(d.sleep)).filter(isNum);

  // Demographic (non-GPS) VO2max estimates are derived from resting HR + age + sex + weight, which Body Age
  // already counts, so only run-based VO2max enters it (aggregate() drops estimated values).
  const vo2Vals = days.slice(-182).filter((d) => isNum(d.vo2max));
  const vo2Demographic = vo2Vals.length > 0 && vo2Vals.every((d) => d.vo2Estimated);
  const hsProfile = { ...profile, sex };

  // Weekly Healthspan history (every Sunday with enough data) + current value.
  const healthspanHistory = [];
  days.forEach((d, i) => {
    if (i < 30 || parseDate(d.date).getDay() !== 0) return;
    const h = computeHealthspan(days.slice(0, i + 1), hsProfile);
    if (h.unlocked) healthspanHistory.push({ date: d.date, bodyAge: h.bodyAge, pace: h.pace });
  });
  const healthspan = computeHealthspan(days, hsProfile);

  // HRV trend (HRV4Training style): 7-day ln-RMSSD mean vs 60-day mean ± 0.5 SD.
  const ln = (arr) => arr.map((d) => d.hrv).filter(isNum).map(Math.log);
  const ln60 = ln(days.slice(-60));
  const m7 = mean(ln(days.slice(-7)));
  const m60 = mean(ln60);
  const s60 = sd(ln60);
  let hrvTrend = null;
  if (isNum(m7) && isNum(m60) && isNum(s60) && ln60.length >= 21) {
    const lo = m60 - 0.5 * s60;
    const hi = m60 + 0.5 * s60;
    hrvTrend = {
      avg7: Math.exp(m7), lo: Math.exp(lo), hi: Math.exp(hi),
      status: m7 < lo ? 'below' : m7 > hi ? 'above' : 'normal',
    };
  }

  return {
    profile: { ...profile, sex },
    device: { id: profile.device || 'other', ...device },
    adaptation: { hrvSource, deepShare, vo2Demographic, sexKnown, deviceSince: profile.deviceSince || null, maxHrSource: profile.maxHr ? 'user' : 'estimated' },
    maxHr,
    days,
    byDate,
    latest: today,
    strainTarget: strainTarget(latest.recovery?.score ?? null),
    tonight: { ...tonight, typicalEfficiency: effs.length ? median(effs) : 90 },
    healthspan,
    healthspanHistory,
    monitor: healthMonitor(latest, days.slice(0, -1)),
    hrvTrend,
  };
}

export * from './util.js';
export { recoveryBand } from './recovery.js';
export { strainBand } from './strain.js';
export { sleepBand, bedtimeFor } from './sleep.js';
export { stressBand } from './stress.js';
export { METRICS, targets } from './healthspan.js';
export { BEHAVIORS, behaviorImpacts } from './journal.js';
export { computeHealthspan } from './healthspan.js';
export { healthMonitor, VITALS } from './monitor.js';
export { sleepNeed } from './sleep.js';
export { strainTarget } from './strain.js';
export { DEVICES, WHOOP, SCORE_MAP, TIERS, detectDevice, deviceProfile, adaptationNotes } from './devices.js';
export { FLAG_INFO } from './confidence.js';
