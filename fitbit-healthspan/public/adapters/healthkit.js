// Apple Health (HealthKit) connector.
//
// Apple Health aggregates many wearables: Apple Watch, plus apps such as Oura, WHOOP, Garmin Connect, Withings,
// Polar and Ultrahuman that write to it. Every app/device that wrote a sample becomes its own Vitalspan *source*,
// so the multi-device merge can pick one consistent source per metric (see engine/merge.js).
//
// `normalizeHealthKit()` is pure (unit-tested with fixtures); `readHealthKit()` drives the native plugin.

import { detectDevice } from '../engine/devices.js';
import { isNum, median, toISODate } from '../engine/util.js';

export const READ_TYPES = [
  'heartRate', 'restingHeartRate', 'heartRateVariability', 'respiratoryRate', 'oxygenSaturation',
  'appleSleepingWristTemperature', 'sleep', 'steps', 'vo2Max', 'bodyFat', 'weight', 'workouts',
];

const STRENGTH_WORKOUTS = new Set([
  'traditionalStrengthTraining', 'functionalStrengthTraining', 'strengthTraining', 'weightlifting',
  'highIntensityIntervalTraining', 'coreTraining', 'pilates', 'yoga', 'barre', 'crossTraining', 'calisthenics',
  'bootCamp', 'deadlift', 'benchPress',
]);
const ASLEEP = new Set(['asleep', 'rem', 'deep', 'light']);

const pad = (n) => String(n).padStart(2, '0');
const localIso = (d) => `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const pct = (v) => (isNum(v) ? (v <= 1.5 ? v * 100 : v) : null);

function sourceKey(s) {
  const name = (s.sourceName || '').trim();
  return name || (s.deviceType ? `Unknown ${s.deviceType}` : 'Apple Health');
}

/** Overnight samples (HRV, breathing, SpO₂, temp) belong to the night that ends on the wake date. */
function nightDate(d) {
  const h = d.getHours();
  if (h < 13) return toISODate(d);
  if (h >= 18) { const n = new Date(d); n.setDate(n.getDate() + 1); return toISODate(n); }
  return null; // daytime spot readings don't define a nightly value
}

function groupSleep(segments) {
  const sorted = segments.slice().sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  const sessions = [];
  let cur = null;
  for (const s of sorted) {
    const st = new Date(s.startDate).getTime();
    const en = new Date(s.endDate).getTime();
    if (!cur || st - cur.end > 60 * 60000) { cur = { start: st, end: en, segs: [] }; sessions.push(cur); }
    cur.end = Math.max(cur.end, en);
    cur.segs.push({ st, en, state: s.sleepState || 'asleep' });
  }
  return sessions.map((x) => {
    const minutes = Math.ceil((x.end - x.start) / 60000);
    const state = new Array(minutes).fill(null);
    const priority = { deep: 5, rem: 4, light: 3, asleep: 2, awake: 1, inBed: 0 };
    for (const g of x.segs) {
      const a = Math.floor((g.st - x.start) / 60000);
      const b = Math.ceil((g.en - x.start) / 60000);
      for (let i = Math.max(0, a); i < Math.min(minutes, b); i++) {
        if (state[i] == null || priority[g.state] > priority[state[i]]) state[i] = g.state;
      }
    }
    const count = (k) => state.filter((v) => v === k).length;
    const asleepMin = state.filter((v) => ASLEEP.has(v)).length;
    const staged = count('deep') + count('rem') + count('light') > 0;
    const end = new Date(x.end);
    return {
      wakeDate: toISODate(end),
      sleep: {
        start: localIso(new Date(x.start)), end: localIso(end), asleepMin, inBedMin: minutes,
        deepMin: staged ? count('deep') : undefined, remMin: staged ? count('rem') : undefined,
        lightMin: staged ? count('light') : undefined, awakeMin: count('awake') + count('inBed'),
        classic: staged ? undefined : true,
      },
    };
  });
}

/**
 * @param {{ samples: Object<string, Array>, workouts?: Array, steps?: Array }} raw  plugin results by data type;
 *        `steps` = daily aggregated (deduplicated) sums from queryAggregated.
 * @returns {Array<{id,label,device,days}>} one source per contributing app/device
 */
export function normalizeHealthKit(raw) {
  const sources = new Map();
  const src = (sample) => {
    const key = sourceKey(sample);
    if (!sources.has(key)) {
      sources.set(key, { id: `hk:${key}`, label: key, device: detectDevice(key, sample.deviceType) || 'other', days: new Map(), _night: {} });
    }
    return sources.get(key);
  };
  const day = (s, date) => {
    if (!s.days.has(date)) s.days.set(date, { date, workouts: [], naps: [] });
    return s.days.get(date);
  };
  const nightly = (s, field, date, v) => {
    s._night[field] ??= {};
    (s._night[field][date] ??= []).push(v);
  };

  const S = raw.samples || {};
  for (const x of S.heartRate || []) {
    const t = new Date(x.startDate);
    const d = day(src(x), toISODate(t));
    d._hr ??= new Array(1440).fill(null).map(() => [0, 0]);
    const m = t.getHours() * 60 + t.getMinutes();
    d._hr[m][0] += x.value;
    d._hr[m][1] += 1;
  }
  for (const x of S.restingHeartRate || []) day(src(x), toISODate(new Date(x.startDate))).rhr = x.value;
  for (const [type, field, f = (v) => v] of [
    ['heartRateVariability', 'hrv'], ['respiratoryRate', 'respRate'], ['oxygenSaturation', 'spo2', pct], ['appleSleepingWristTemperature', 'wristTemp'],
  ]) {
    for (const x of S[type] || []) {
      const date = nightDate(new Date(x.startDate));
      if (date) nightly(src(x), field, date, f(x.value));
    }
  }
  for (const x of S.vo2Max || []) {
    const d = day(src(x), toISODate(new Date(x.startDate)));
    d.vo2max = x.value;
  }
  for (const x of S.bodyFat || []) day(src(x), toISODate(new Date(x.startDate))).bodyFatPct = pct(x.value);
  for (const x of S.weight || []) day(src(x), toISODate(new Date(x.startDate))).weightKg = x.unit === 'gram' ? x.value / 1000 : x.value;

  // Sleep: group each source's stage segments into sessions; longest per wake date is the main sleep.
  const sleepBySource = new Map();
  for (const x of S.sleep || []) {
    const k = sourceKey(x);
    src(x);
    if (!sleepBySource.has(k)) sleepBySource.set(k, []);
    if (x.stages && x.stages.length) for (const st of x.stages) sleepBySource.get(k).push({ startDate: st.startDate, endDate: st.endDate, sleepState: st.stage });
    else sleepBySource.get(k).push(x);
  }
  for (const [k, segs] of sleepBySource) {
    const s = sources.get(k);
    for (const sess of groupSleep(segs)) {
      if (sess.sleep.asleepMin < 15) continue;
      const d = day(s, sess.wakeDate);
      if (!d.sleep || sess.sleep.asleepMin > d.sleep.asleepMin) {
        if (d.sleep) d.naps.push(d.sleep);
        d.sleep = sess.sleep;
      } else d.naps.push(sess.sleep);
    }
  }

  for (const w of raw.workouts || []) {
    const s = src(w);
    const start = new Date(w.startDate);
    day(s, toISODate(start)).workouts.push({
      name: w.workoutType, type: w.workoutType, start: localIso(start), durationMin: Math.round((w.duration || 0) / 60),
      strength: STRENGTH_WORKOUTS.has(w.workoutType) || undefined,
    });
  }

  // Deduplicated daily steps (HealthKit statistics merge phone + watch) as their own source.
  if (raw.steps && raw.steps.length) {
    const s = { id: 'hk:Apple Health', label: 'Apple Health (all devices)', device: 'iphone', days: new Map(), _night: {} };
    sources.set('__steps', s);
    for (const b of raw.steps) if (isNum(b.value)) day(s, toISODate(new Date(b.startDate))).steps = Math.round(b.value);
  }

  // Finalise: minute HR arrays, nightly means, wrist-temp deviation vs this source's own rolling median.
  const out = [];
  for (const s of sources.values()) {
    for (const [field, byDate] of Object.entries(s._night)) {
      for (const [date, vals] of Object.entries(byDate)) {
        const v = vals.filter(isNum);
        if (v.length) day(s, date)[field] = v.reduce((a, b) => a + b, 0) / v.length;
      }
    }
    const days = [...s.days.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
    const temps = [];
    for (const d of days) {
      if (d._hr) { d.hrMinutes = d._hr.map(([sum, n]) => (n ? Math.round(sum / n) : null)); delete d._hr; }
      if (isNum(d.wristTemp)) {
        const base = median(temps.slice(-30));
        if (isNum(base) && temps.length >= 3) d.skinTempDelta = Math.round((d.wristTemp - base) * 100) / 100;
        temps.push(d.wristTemp);
        delete d.wristTemp;
      }
    }
    if (days.length) out.push({ id: s.id, label: s.label, device: s.device, days });
  }
  return out;
}

// ---------------------------------------------------------------- native read (iOS only)
const CHUNK_DAYS = 14;

export async function readHealthKit({ days = 200, onStep = () => {} } = {}) {
  const { Health } = await import('@capgo/capacitor-health');
  const avail = await Health.isAvailable();
  if (!avail.available) throw new Error(avail.reason || 'Apple Health is not available on this device.');
  await Health.requestAuthorization({ read: READ_TYPES });

  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  const samples = {};
  for (const type of READ_TYPES.filter((t) => t !== 'workouts' && t !== 'steps')) {
    samples[type] = [];
    for (let a = new Date(start); a < end; a = new Date(a.getTime() + CHUNK_DAYS * 86400000)) {
      const b = new Date(Math.min(end.getTime(), a.getTime() + CHUNK_DAYS * 86400000));
      onStep(`Apple Health · ${type} · ${toISODate(a)}`);
      try {
        const r = await Health.readSamples({ dataType: type, startDate: a.toISOString(), endDate: b.toISOString(), limit: 100000, ascending: true });
        samples[type].push(...(r.samples || []));
      } catch (e) {
        // A type the user didn't allow (HealthKit hides read denials) or that the OS doesn't support: skip it.
        if (a.getTime() === start.getTime()) console.warn(`HealthKit ${type}:`, e.message);
        break;
      }
    }
  }
  onStep('Apple Health · steps');
  let steps = [];
  try {
    steps = (await Health.queryAggregated({ dataType: 'steps', startDate: start.toISOString(), endDate: end.toISOString(), bucket: 'day', aggregation: 'sum' })).samples || [];
  } catch { /* steps not allowed */ }
  onStep('Apple Health · workouts');
  const workouts = [];
  let anchor;
  for (let page = 0; page < 50; page++) {
    let r;
    try {
      r = await Health.queryWorkouts({ startDate: start.toISOString(), endDate: end.toISOString(), limit: 500, ascending: true, anchor });
    } catch { break; }
    workouts.push(...(r.workouts || []));
    if (!r.anchor || !(r.workouts || []).length) break;
    anchor = r.anchor;
  }
  return normalizeHealthKit({ samples, workouts, steps });
}
