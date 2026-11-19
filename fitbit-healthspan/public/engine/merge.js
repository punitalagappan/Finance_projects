// Multi-device merge: combine several data sources (Fitbit via Google Health, each app/device found in Apple Health,
// file imports, demo) into one day series with per-metric provenance.
//
// Rules (from reports/Fitbit vs WHOOP tracker differences.md: "no fixed cross-device conversion exists"):
//  • Overnight vitals (HRV, resting HR, breathing, SpO₂, skin temp) each come from ONE primary source for the whole
//    timeline, never mixed night-by-night, so personal baselines stay internally consistent. Default = the source with
//    the best recent coverage (ties broken by device suitability: ring/band > watch > phone); the user can override.
//  • Sleep comes from one primary source; nights it missed may be filled from the next source (flagged per night).
//  • Minute heart rate comes from the best-covered source, with missing minutes filled from others.
//  • Steps: the highest daily count (devices overlap, so summing would double-count).
//  • Workouts: union, de-duplicated when two sources recorded the same session (>50% overlap).
//  • VO₂max: prefer measured (GPS/run/walk-test) estimates over demographic ones.

import { isNum } from './util.js';
import { deviceProfile } from './devices.js';

export const VITAL_KEYS = ['hrv', 'rhr', 'respRate', 'spo2', 'skinTempDelta'];
export const METRIC_LABELS = {
  hrv: 'Heart rate variability', rhr: 'Resting heart rate', respRate: 'Respiratory rate', spo2: 'Blood oxygen',
  skinTempDelta: 'Skin temperature', sleep: 'Sleep', hrMinutes: 'Heart rate (strain & stress)', steps: 'Steps',
  workouts: 'Workouts', vo2max: 'VO₂ max', bodyFatPct: 'Body composition',
};
const OVERRIDABLE = ['hrv', 'rhr', 'respRate', 'spo2', 'skinTempDelta', 'sleep', 'hrMinutes', 'vo2max'];
export const overridableMetrics = () => OVERRIDABLE;

// Device suitability for overnight measurement (higher wins ties).
const FORM_RANK = { ring: 4, band: 3, watch: 2, scale: 1, phone: 0 };
const formRank = (src) => FORM_RANK[deviceProfile(src.device).form] ?? 2;

const has = (d, key) => {
  if (key === 'sleep') return Boolean(d.sleep && d.sleep.asleepMin);
  if (key === 'hrMinutes') return Boolean(d.hrMinutes && d.hrMinutes.some(isNum));
  if (key === 'hrv') return isNum(d.hrv) || isNum(d.hrvDeep) || isNum(d.hrvAvg);
  if (key === 'workouts') return Boolean(d.workouts && d.workouts.length);
  return isNum(d[key]);
};

/** Coverage of `key` over the source's most recent `window` days. */
export function coverage(src, key, window = 60) {
  const recent = src.days.slice(-window);
  if (!recent.length) return 0;
  const n = recent.filter((d) => has(d, key)).length;
  if (key === 'hrMinutes') {
    const minutes = recent.reduce((a, d) => a + (d.hrMinutes ? d.hrMinutes.filter(isNum).length : 0), 0);
    return minutes / (recent.length * 1440);
  }
  return n / recent.length;
}

export function pickPrimary(sources, key, override) {
  const usable = sources.filter((s) => s.enabled !== false && coverage(s, key, 400) > 0);
  if (!usable.length) return null;
  if (override && usable.some((s) => s.id === override)) return override;
  const scored = usable.map((s) => ({ s, cov: coverage(s, key), rank: formRank(s) }));
  // Coverage in 10% steps first, then form factor (ring/band preferred overnight), then exact coverage.
  const bucket = (c) => Math.round(c * 10);
  scored.sort((a, b) => bucket(b.cov) - bucket(a.cov) || b.rank - a.rank || b.cov - a.cov);
  return scored[0].s.id;
}

const overlap = (a, b) => {
  const s1 = new Date(a.start).getTime();
  const e1 = s1 + (a.durationMin || 0) * 60000;
  const s2 = new Date(b.start).getTime();
  const e2 = s2 + (b.durationMin || 0) * 60000;
  const inter = Math.max(0, Math.min(e1, e2) - Math.max(s1, s2));
  const shorter = Math.max(1, Math.min(e1 - s1, e2 - s2));
  return inter / shorter;
};

export function mergeWorkouts(lists) {
  const out = [];
  for (const { sourceId, workouts } of lists) {
    for (const w of workouts || []) {
      if (!w.start) { out.push({ ...w, sourceId }); continue; }
      const dup = out.find((o) => o.start && overlap(o, w) > 0.5);
      if (!dup) { out.push({ ...w, sourceId }); continue; }
      // Keep the richer record: one with heart-rate info, else the longer one.
      const better = (isNum(w.avgHr) && !isNum(dup.avgHr)) || (!isNum(dup.avgHr) === !isNum(w.avgHr) && (w.durationMin || 0) > (dup.durationMin || 0));
      if (better) Object.assign(dup, { ...w, sourceId, type: w.type || dup.type, name: w.name || dup.name });
    }
  }
  return out.sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

/**
 * @param {Array<{id,label,device,days,enabled?}>} sources
 * @param {Object<string,string>} overrides metric → source id
 * @returns {{ days, primary: Object<string,string|null>, sources }}
 */
export function mergeSources(sources, overrides = {}) {
  const active = sources.filter((s) => s.enabled !== false && s.days && s.days.length);
  if (!active.length) return { days: [], primary: {}, sources: [] };
  if (active.length === 1) {
    const only = active[0];
    const primary = Object.fromEntries([...OVERRIDABLE].map((k) => [k, coverage(only, k, 400) > 0 ? only.id : null]));
    return { days: only.days.map((d) => withVo2Flag({ ...d, sources: { all: only.id } }, only)), primary, sources: active };
  }

  const byId = new Map(active.map((s) => [s.id, s]));
  const maps = new Map(active.map((s) => [s.id, new Map(s.days.map((d) => [d.date, d]))]));
  const primary = {};
  for (const k of OVERRIDABLE) primary[k] = pickPrimary(active, k, overrides[k]);

  const dates = [...new Set(active.flatMap((s) => s.days.map((d) => d.date)))].sort();
  const order = (first) => [first, ...active.map((s) => s.id).filter((id) => id !== first)].filter(Boolean);

  const days = dates.map((date) => {
    const get = (id) => maps.get(id)?.get(date);
    const out = { date, sources: {} };

    // Overnight vitals: single primary source, no per-night fallback.
    for (const k of VITAL_KEYS) {
      const id = primary[k];
      const d = id && get(id);
      if (!d) continue;
      if (k === 'hrv') {
        for (const f of ['hrv', 'hrvDeep', 'hrvAvg']) if (isNum(d[f])) out[f] = d[f];
        if (has(d, 'hrv')) out.sources.hrv = id;
      } else if (isNum(d[k])) {
        out[k] = d[k];
        out.sources[k] = id;
        if (k === 'rhr' && d.rhrAwakeOnly) out.rhrAwakeOnly = true;
        if (k === 'skinTempDelta' && isNum(d.skinTempSd)) out.skinTempSd = d.skinTempSd;
      }
    }

    // Sleep: primary, then fallback sources for nights the primary missed.
    for (const id of order(primary.sleep)) {
      const d = get(id);
      if (d && d.sleep && d.sleep.asleepMin) {
        out.sleep = d.sleep;
        out.naps = d.naps || [];
        out.sources.sleep = id;
        if (id !== primary.sleep) out.sleepFallback = true;
        break;
      }
    }

    // Minute HR: primary series, gaps filled minute-by-minute from the others.
    const hrIds = order(primary.hrMinutes).filter((id) => get(id)?.hrMinutes);
    if (hrIds.length) {
      const base = get(hrIds[0]);
      const hr = base.hrMinutes.slice();
      for (const id of hrIds.slice(1)) {
        const other = get(id).hrMinutes;
        for (let i = 0; i < 1440; i++) if (!isNum(hr[i]) && isNum(other[i])) hr[i] = other[i];
      }
      out.hrMinutes = hr;
      out.sources.hrMinutes = hrIds[0];
      if (base.stepMinutes) out.stepMinutes = base.stepMinutes;
    }

    // Resting HR stays with its own source: don't re-derive it from another device's minute heart rate.
    if (out.sources.rhr && out.sources.hrMinutes && out.sources.rhr !== out.sources.hrMinutes) out.rhrLocked = true;

    // Steps: highest count across devices.
    let best = null;
    for (const s of active) {
      const d = get(s.id);
      if (d && isNum(d.steps) && (best == null || d.steps > best.v)) best = { v: d.steps, id: s.id };
    }
    if (best) { out.steps = best.v; out.sources.steps = best.id; }

    // Fitbit AZM (fallback for zone minutes without intraday HR) from whichever source has it.
    for (const s of active) { const d = get(s.id); if (d?.azm) { out.azm = d.azm; break; } }

    out.workouts = mergeWorkouts(active.map((s) => ({ sourceId: s.id, workouts: get(s.id)?.workouts })));

    // VO2max: prefer measured over demographic estimates, primary first.
    const vo2 = order(primary.vo2max).map((id) => ({ id, d: get(id) })).filter(({ d }) => d && isNum(d.vo2max));
    const measured = vo2.find(({ id, d }) => !estimatedFor(d, byId.get(id)));
    const pick = measured || vo2[0];
    if (pick) {
      out.vo2max = pick.d.vo2max;
      out.vo2Estimated = estimatedFor(pick.d, byId.get(pick.id));
      out.sources.vo2max = pick.id;
    }

    // Body composition and weight: first source that has it.
    for (const k of ['bodyFatPct', 'weightKg']) {
      for (const s of active) { const d = get(s.id); if (d && isNum(d[k])) { out[k] = d[k]; out.sources[k] = s.id; break; } }
    }
    return out;
  });

  return { days, primary, sources: active };
}

function estimatedFor(d, src) {
  if (typeof d.vo2Estimated === 'boolean') return d.vo2Estimated;
  return deviceProfile(src?.device).vo2 === 'demographic';
}

function withVo2Flag(d, src) {
  if (isNum(d.vo2max) && typeof d.vo2Estimated !== 'boolean') d.vo2Estimated = estimatedFor(d, src);
  return d;
}
