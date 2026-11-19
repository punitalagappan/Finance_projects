// Synthetic but physiologically plausible Fitbit-like data so the app can be explored without an account.
// Persona: 34-year-old who trains 5-6x/week, gets fitter over time, has a few late nights, drinks occasionally,
// and catches a cold ~6 weeks ago (temperature, breathing rate and RHR rise; HRV drops).

import { rng, addDays, toISODate, clamp, parseDate } from '../engine/util.js';

const pad = (n) => String(n).padStart(2, '0');
const isoAt = (date, minute) => {
  const d = parseDate(date);
  d.setMinutes(minute);
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

export const DEMO_PROFILE = { age: 34, sex: 'male', name: 'Demo athlete', deviceName: 'Charge 6' };

export function generateDemo({ days = 210, end = toISODate(new Date()), seed = 7 } = {}) {
  const r = rng(seed);
  const start = addDays(end, -(days - 1));
  const plan = [];
  const journal = {};

  // ---- plan each day: sleep, workouts, behaviours ----
  for (let i = 0; i < days + 1; i++) {
    const date = addDays(start, i);
    const dow = parseDate(date).getDay();
    const progress = i / days; // fitness improves through the period
    const sick = i >= days - 45 && i < days - 40;
    const weekend = dow === 5 || dow === 6;
    const alcohol = (weekend && r() < 0.45) || r() < 0.05;
    const lateCaffeine = r() < 0.2;
    const meditation = r() < 0.35;
    const screens = r() < 0.4;

    // bedtime minutes after midnight of `date` (e.g. 1400 = 23:20)
    const bed = 1395 + (weekend ? 50 : 0) + (alcohol ? 25 : 0) + r.normal(0, 22) + (progress > 0.6 ? -15 : 0);
    const sleepNeedish = 450 + (weekend ? 35 : 0) + r.normal(0, 30) - (alcohol ? 20 : 0) + (sick ? 40 : 0);

    const workouts = [];
    if (!sick) {
      const runDays = [1, 3, 5];
      if (runDays.includes(dow) && r() < 0.9) {
        const hard = dow === 3 && r() < 0.6;
        workouts.push({ name: hard ? 'Interval run' : 'Run', type: 'RUNNING', startMinute: 7 * 60 + 20, durationMin: Math.round(40 + r() * 20), intensity: hard ? 0.8 : 0.72 });
      }
      if ((dow === 2 || dow === 4) && r() < 0.85) {
        workouts.push({ name: 'Weight training', type: 'WEIGHTLIFTING', startMinute: 18 * 60, durationMin: Math.round(40 + r() * 20), intensity: 0.5 });
      }
      if (dow === 6 && r() < 0.8) {
        workouts.push({ name: 'Bike ride', type: 'BIKING', startMinute: 9 * 60, durationMin: Math.round(80 + r() * 50), intensity: 0.62 });
      }
      if (dow === 0 && r() < 0.5) {
        workouts.push({ name: 'Yoga', type: 'YOGA', startMinute: 10 * 60, durationMin: 45, intensity: 0.3 });
      }
    }
    plan.push({ date, dow, i, progress, sick, alcohol, bed, sleepNeedish, workouts });
    journal[date] = { alcohol, lateCaffeine, meditation, screens, sick };
  }

  // ---- render each calendar day ----
  const out = [];
  let hrvState = 0;
  for (let i = 1; i <= days; i++) {
    const p = plan[i];
    const prev = plan[i - 1];
    const { date, progress, sick } = p;
    const rhrBase = 57 - 3 * progress;
    const prevLoad = prev.workouts.reduce((a, w) => a + w.durationMin * w.intensity, 0);

    // Night ending today: starts at prev.bed (relative to prev date), lasts ~ sleepNeedish of prev plan.
    const sleepStart = prev.bed - 1440; // minutes relative to today's midnight (negative = yesterday)
    const tib = clamp(prev.sleepNeedish + 25, 300, 600);
    const sleepEnd = sleepStart + tib;
    const awake = Math.round(clamp(r.normal(prev.alcohol ? 48 : 34, 10), 12, 90));
    const asleep = Math.round(tib - awake);
    const deep = Math.round(asleep * clamp(r.normal(prev.alcohol ? 0.13 : 0.17, 0.02), 0.08, 0.25));
    const rem = Math.round(asleep * clamp(r.normal(prev.alcohol ? 0.17 : 0.22, 0.03), 0.1, 0.3));

    // Autonomic state: HRV down after alcohol, big load, short sleep, sickness; slow fitness gains.
    hrvState = 0.6 * hrvState + r.normal(0, 0.06)
      - (prev.alcohol ? 0.14 : 0) - (prevLoad > 55 ? 0.06 : 0) - (asleep < 390 ? 0.06 : 0) - (sick || prev.sick ? 0.25 : 0);
    const hrv = Math.round(Math.exp(Math.log(50 + 8 * progress) + hrvState) * 10) / 10;
    const rhr = rhrBase - hrvState * 12 + r.normal(0, 1.2) + (sick ? 5 : 0);
    const maxHr = 185;

    // ---- per-minute heart rate for today (00:00-24:00) ----
    const hrMinutes = new Array(1440);
    const stepMinutes = new Array(1440).fill(0);
    const nextSleepStart = p.bed; // tonight's bedtime (minutes after today's midnight)
    for (let m = 0; m < 1440; m++) {
      const asleepNow = m < sleepEnd || m >= nextSleepStart;
      if (asleepNow) {
        const dip = Math.sin(Math.PI * clamp((m < sleepEnd ? m - sleepStart : m - nextSleepStart) / tib, 0, 1));
        hrMinutes[m] = rhr + 4 - 4 * dip + r.normal(0, 1.5);
      } else {
        hrMinutes[m] = rhr + 13 + 5 * Math.sin(((m - 600) / 1440) * 2 * Math.PI) + r.normal(0, 3) + (sick ? 6 : 0);
        if (r() < 0.06) { hrMinutes[m] += 14 + r() * 10; stepMinutes[m] = Math.round(70 + r() * 40); } // short walks
        else if (r() < 0.25) stepMinutes[m] = Math.round(r() * 20);
      }
    }
    // a midday stressful meeting block on some weekdays
    if (p.dow >= 1 && p.dow <= 5 && r() < 0.4) for (let m = 14 * 60; m < 15 * 60; m++) hrMinutes[m] += 10 + r.normal(0, 3);

    const workouts = [];
    for (const w of p.workouts) {
      let total = 0;
      for (let k = 0; k < w.durationMin; k++) {
        const m = w.startMinute + k;
        const warm = Math.min(1, k / 8);
        const interval = w.name === 'Interval run' && Math.floor(k / 4) % 2 === 1 ? 0.12 : 0;
        const frac = clamp(w.intensity * warm + interval + r.normal(0, 0.03), 0.2, 1);
        hrMinutes[m] = rhr + frac * (maxHr - rhr);
        total += hrMinutes[m];
        if (w.type === 'RUNNING') stepMinutes[m] = 160 + Math.round(r() * 10);
      }
      workouts.push({
        name: w.name, type: w.type, start: isoAt(date, w.startMinute), durationMin: w.durationMin, avgHr: Math.round(total / w.durationMin),
      });
    }
    const steps = stepMinutes.reduce((a, b) => a + b, 0);

    out.push({
      date,
      sleep: {
        start: isoAt(date, sleepStart), end: isoAt(date, sleepEnd), asleepMin: asleep, inBedMin: Math.round(tib), deepMin: deep, remMin: rem,
        lightMin: asleep - deep - rem, awakeMin: awake,
      },
      naps: r() < 0.05 ? [{ start: isoAt(date, 14 * 60), end: isoAt(date, 14 * 60 + 25), asleepMin: 20 }] : [],
      hrv,
      rhr: Math.round(rhr),
      respRate: Math.round((14.6 + r.normal(0, 0.35) + (sick ? 1.6 : 0)) * 10) / 10,
      spo2: Math.round((96.6 + r.normal(0, 0.5) - (sick ? 1.2 : 0)) * 10) / 10,
      skinTempDelta: Math.round((r.normal(0, 0.15) + (sick ? 0.9 : 0) + (prev.alcohol ? 0.15 : 0)) * 100) / 100,
      vo2max: Math.round((44.5 + 2 * progress + r.normal(0, 0.3)) * 10) / 10,
      steps,
      bodyFatPct: Math.round((19 - 2 * progress + r.normal(0, 0.4)) * 10) / 10,
      workouts,
      hrMinutes: hrMinutes.map((v) => Math.round(v)),
      stepMinutes,
    });
  }
  // the demo journal answers refer to the behaviour day; drop the last (today has no next morning yet)
  return { days: out, profile: DEMO_PROFILE, journal };
}

/**
 * Multi-device demo: the same person wearing a Fitbit Charge 6 (via Google Health) and an Oura Ring
 * (via Apple Health). The ring reports its own HRV scale and slightly different sleep timing; it has no
 * minute heart rate in this demo, so Strain/Stress come from the Charge 6 while vitals come from the ring.
 */
export function generateDemoMulti(opts = {}) {
  const base = generateDemo(opts);
  const r = rng((opts.seed ?? 7) + 101);
  const ringDays = base.days.map((d, i) => {
    const out = { date: d.date, workouts: [], naps: [] };
    if (i % 23 === 5) return out; // ring left on the charger some nights
    if (d.sleep) {
      const shift = Math.round(r.normal(0, 6));
      const asleep = Math.max(200, d.sleep.asleepMin + Math.round(r.normal(8, 10)));
      const deep = Math.round(asleep * 0.19);
      const rem = Math.round(asleep * 0.23);
      const sh = (iso, m) => { const t = new Date(iso); t.setMinutes(t.getMinutes() + m); return `${toISODate(t)}T${pad(t.getHours())}:${pad(t.getMinutes())}:00`; };
      out.sleep = { start: sh(d.sleep.start, shift), end: sh(d.sleep.end, shift), asleepMin: asleep, inBedMin: d.sleep.inBedMin + 5, deepMin: deep, remMin: rem, lightMin: asleep - deep - rem, awakeMin: d.sleep.inBedMin + 5 - asleep };
    }
    if (isFinite(d.hrv)) out.hrv = Math.round(d.hrv * 1.32 * Math.exp(r.normal(0, 0.05)) * 10) / 10;
    if (isFinite(d.rhr)) out.rhr = Math.round(d.rhr - 2 + r.normal(0, 0.8));
    if (isFinite(d.respRate)) out.respRate = Math.round((d.respRate - 0.3 + r.normal(0, 0.2)) * 10) / 10;
    if (isFinite(d.skinTempDelta)) out.skinTempDelta = Math.round((d.skinTempDelta + r.normal(0, 0.05)) * 100) / 100;
    out.steps = Math.round(d.steps * 0.93);
    return out;
  });
  return {
    profile: base.profile,
    journal: base.journal,
    sources: [
      { id: 'demo:charge-6', label: 'Fitbit Charge 6', device: 'charge-6', group: 'demo', days: base.days },
      { id: 'demo:oura', label: 'Oura Ring (via Apple Health)', device: 'oura', group: 'demo', days: ringDays },
    ],
  };
}
