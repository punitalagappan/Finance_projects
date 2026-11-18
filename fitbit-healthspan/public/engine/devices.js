// Device profiles: what each Google wearable (and WHOOP, as the reference) can measure, and how.
// Source: reports/Fitbit vs WHOOP tracker differences.md (research notes, Nov 2026).
// Fields marked `verified: false` come from secondary sources or background knowledge and need checking
// against Google's spec pages.
//
// skinTemp: 'dedicated' (own sensor), 'variation' (relative nightly change only), 'device' (device temp sensor)
// eda:      'continuous' (cEDA → Body Response), 'scan' (on-demand palm scan), null
// vo2:      'gps' (refined by GPS runs) or 'demographic' (RHR + age + sex + weight estimate)

export const DEVICES = {
  'fitbit-air': {
    tier: 'C', name: 'Fitbit Air', family: 'fitbit', launch: '2026-05', display: false, price: '$99.99 (3 mo Premium incl.)',
    gps: false, spo2: true, skinTemp: 'device', eda: null, ecg: false, afibBackground: true, batteryDays: 7, multipath: false,
    vo2: 'demographic', verified: true,
    notes: 'Screenless band positioned against WHOOP. Readiness, Cardio Load and AZM did not populate at launch in one review (May 2026).',
  },
  'fitbit-edge': {
    tier: 'B', name: 'Fitbit Edge', family: 'fitbit', launch: '2026-10', display: true, price: '$179.99',
    gps: true, spo2: true, skinTemp: 'dedicated', eda: null, ecg: true, afibBackground: true, batteryDays: 7, multipath: false,
    vo2: 'gps', verified: true,
    notes: 'Charge 6 successor with GPS (+Galileo), altimeter, ECG and a user-replaceable battery. No on-demand EDA scan.',
  },
  'charge-6': {
    tier: 'B', name: 'Fitbit Charge 6', family: 'fitbit', launch: '2023-10', display: true, price: '$159',
    gps: true, spo2: true, skinTemp: 'variation', eda: 'scan', ecg: true, afibBackground: true, batteryDays: 7, multipath: false,
    vo2: 'gps', exerciseHrMape: 5.5, verified: true,
    notes: 'Exercise HR MAPE 5.5% (CCC 0.93) in a 2026 10-device study.',
  },
  'inspire-3': {
    tier: 'C', name: 'Fitbit Inspire 3', family: 'fitbit', launch: '2022-09', display: true, price: '$99',
    gps: false, spo2: true, skinTemp: 'variation', eda: null, ecg: false, afibBackground: true, batteryDays: 10, multipath: false,
    vo2: 'demographic', verified: false,
  },
  luxe: {
    tier: 'C', name: 'Fitbit Luxe', family: 'fitbit', launch: '2021-04', display: true, price: 'discontinued?',
    gps: false, spo2: true, skinTemp: 'variation', eda: null, ecg: false, afibBackground: true, batteryDays: 5, multipath: false,
    vo2: 'demographic', verified: false,
  },
  'versa-4': {
    tier: 'B', name: 'Fitbit Versa 4', family: 'fitbit', launch: '2022-09', display: true, price: '$199',
    gps: true, spo2: true, skinTemp: 'variation', eda: null, ecg: false, afibBackground: true, batteryDays: 6, multipath: false,
    vo2: 'gps', verified: false,
    notes: 'Only Fitbit with a published HRV validation: pilot (n=8) read ~8% higher than a Firstbeat ECG reference.',
  },
  'sense-2': {
    tier: 'A', name: 'Fitbit Sense 2', family: 'fitbit', launch: '2022-09', display: true, price: '$249',
    gps: true, spo2: true, skinTemp: 'dedicated', eda: 'continuous', ecg: true, afibBackground: true, batteryDays: 6, multipath: false,
    vo2: 'gps', sleepKappa: 0.42, verified: false,
    notes: 'Sleep staging vs PSG: κ 0.42 (Schyvens 2025, Fitbit Sense).',
  },
  'pixel-watch-2': {
    tier: 'A', name: 'Pixel Watch 2', family: 'pixel', launch: '2023-10', display: true, price: '—',
    gps: true, spo2: true, skinTemp: 'dedicated', eda: 'continuous', ecg: true, afibBackground: true, batteryDays: 1, multipath: true,
    vo2: 'gps', exerciseHrMape: 6.7, verified: true,
    notes: 'First multipath PPG + on-device deep-learning HR. Exercise HR MAPE 6.7% (2026 study). ~24 h battery: charge outside sleep.',
  },
  'pixel-watch-3': {
    tier: 'A', name: 'Pixel Watch 3', family: 'pixel', launch: '2024-08', display: true, price: '—',
    gps: true, spo2: true, skinTemp: 'dedicated', eda: 'continuous', ecg: true, afibBackground: true, batteryDays: 1, multipath: true,
    vo2: 'gps', exerciseHrMape: 2.73, verified: true,
    notes: 'Exercise HR MAPE 2.73% (bias −2.4 bpm). Cardio Load on-device. Loss of Pulse (some regions).',
  },
  'pixel-watch-4': {
    tier: 'A', name: 'Pixel Watch 4', family: 'pixel', launch: '2025-08', display: true, price: '—',
    gps: true, spo2: true, skinTemp: 'dedicated', eda: 'continuous', ecg: true, afibBackground: true, batteryDays: 1.5, multipath: true,
    vo2: 'gps', verified: true,
    notes: 'Far-field skin-temperature sensor; 30-40 h battery.',
  },
  'pixel-watch-5': {
    tier: 'A', name: 'Pixel Watch 5', family: 'pixel', launch: '2026-08', display: true, price: '—',
    gps: true, spo2: true, skinTemp: 'dedicated', eda: 'continuous', ecg: true, afibBackground: true, batteryDays: 1.5, multipath: true,
    vo2: 'gps', verified: true,
    notes: 'Adds cuffless Blood Pressure Trends and Insulin Resistance Trends (reports from Oct 2026; not in the Google Health API data types).',
  },
  other: {
    tier: 'B', name: 'Other / unknown Fitbit', family: 'fitbit', launch: '', display: true, price: '',
    gps: true, spo2: true, skinTemp: 'variation', eda: null, ecg: false, afibBackground: false, batteryDays: 5, multipath: false,
    vo2: 'demographic', verified: false,
  },
};

/** WHOOP reference profile (what the WHOOP-style scores were designed around). */
export const WHOOP = {
  name: 'WHOOP 4.0 / 5.0 / MG',
  sensors: '4.0: 5 LEDs (3 green, 1 red, 1 IR), 4 photodiodes; 5.0/MG similar layout, ~26 Hz sampling (claimed), skin temp, SpO2; MG adds single-lead ECG (FDA-cleared AFib) and cuff-calibrated BP insights',
  wear: 'Wrist, bicep or Body apparel (torso/waist/calf); no screen',
  battery: '4.0: 4-5 days; 5.0/MG: 14+ days',
  price: 'One $199/yr · Peak $239/yr (Healthspan) · Life $359/yr (MG: ECG, BP)',
};

/** Guess the device profile from a Google Health pairedDevices `deviceVersion` (or any device name). */
export function detectDevice(name) {
  const s = String(name || '').toLowerCase();
  if (!s) return null;
  if (/pixel.*watch.*5|pw ?5/.test(s)) return 'pixel-watch-5';
  if (/pixel.*watch.*4/.test(s)) return 'pixel-watch-4';
  if (/pixel.*watch.*3/.test(s)) return 'pixel-watch-3';
  if (/pixel.*watch/.test(s)) return 'pixel-watch-2';
  if (/air/.test(s)) return 'fitbit-air';
  if (/edge/.test(s)) return 'fitbit-edge';
  if (/charge\s*6/.test(s)) return 'charge-6';
  if (/inspire\s*3/.test(s)) return 'inspire-3';
  if (/luxe/.test(s)) return 'luxe';
  if (/versa\s*4/.test(s)) return 'versa-4';
  if (/sense\s*2/.test(s)) return 'sense-2';
  return 'other';
}

export const deviceProfile = (id) => DEVICES[id] || DEVICES.other;

export const TIERS = {
  A: 'Full sensors: multipath HR (Pixel), deep-sleep HRV, SpO₂, dedicated skin temp, continuous EDA, ECG, GPS',
  B: 'GPS band/watch: HRV, breathing, SpO₂, skin-temp variation, GPS; no continuous EDA',
  C: 'No GPS: HRV, breathing, RHR, SpO₂ (region), relative temp; no run-based VO₂max, ECG or EDA',
};

/**
 * Fitbit adaptation rules applied by the engine (see analyze()) — surfaced in the UI so users can see
 * exactly how their device's data is translated into WHOOP-style inputs.
 */
export function adaptationNotes(id) {
  const d = deviceProfile(id);
  const notes = [
    { area: 'HRV', rule: 'Uses Fitbit deep-sleep RMSSD (closest to WHOOP\'s slow-wave-weighted HRV), falling back to whole-night RMSSD for the entire series when deep values are missing on >20% of nights; the two are never mixed. Recovery compares HRV only with your own 30-night baseline (z-score), so the device offset cancels out.' },
    { area: 'Resting HR', rule: 'WHOOP measures RHR during sleep; Fitbit\'s daily RHR also uses awake data. When minute heart rate is available we use the 5th percentile of HR during your main sleep instead, so Body Age\'s 60/64 bpm targets mean the same thing.' },
    { area: 'New tracker', rule: 'When you switch trackers, your old nights are rescaled to the new device (by the ratio of median HRV and resting HR) once 7 nights exist on it, and scores are flagged for 14 nights. No fixed Fitbit↔WHOOP or device↔device offset exists in the literature.' },
    { area: 'Sampling', rule: 'Fitbit samples HR about every 5-15 s at rest (1 s during exercise) vs WHOOP\'s continuous high-rate PPG. Minute averages are used and gaps up to 5 min are bridged; longer gaps are treated as not worn.' },
    { area: 'Zones', rule: 'Fitbit Active Zone Minutes are not WHOOP zones. Zone minutes are recomputed from raw HR using heart-rate reserve (WHOOP\'s method) and counted only inside logged workouts for Body Age.' },
    {
      area: 'VO₂max',
      rule: d.vo2 === 'gps'
        ? `${d.name} has GPS. Only VO₂max estimated from GPS-tracked runs counts toward Body Age; demographic estimates (built from resting HR and age) are left out to avoid double counting.`
        : `${d.name} has no GPS: Cardio Fitness is a demographic estimate built from resting HR, age, sex and weight. Body Age already counts resting HR and age, so demographic VO₂max is left out of it (shown for information only).`,
    },
    {
      area: 'Stress',
      rule: d.eda === 'continuous'
        ? `${d.name} has continuous EDA (Body Response), but EDA isn't exposed by the Google Health API, so Stress uses heart rate vs your 14-day baseline.`
        : 'Stress uses heart rate vs your 14-day baseline with workouts and walking excluded (WHOOP\'s motion correction). Fitbit\'s daytime HRV isn\'t available, so the HRV part of WHOOP\'s formula is dropped.',
    },
    {
      area: 'Skin temp',
      rule: d.skinTemp === 'device'
        ? `${d.name} uses a device temperature sensor that reports relative nightly variation only. It's used only as a deviation flag in Recovery.`
        : 'Nightly skin-temperature deviation from your baseline is used as a Recovery penalty when it swings more than 1.5× its normal spread (same as WHOOP\'s illness signal).',
    },
    { area: 'Sleep', rule: 'Fitbit and WHOOP stage sleep about equally well vs polysomnography (κ ≈ 0.41-0.42 Fitbit vs 0.37 WHOOP 4.0); both under-detect wake, so efficiency reads high on both. "Classic" (unstaged) nights are scored without the restorative-sleep figure.' },
  ];
  if (d.batteryDays <= 1.5) notes.push({ area: 'Battery', rule: `${d.name} lasts ~1-1.5 days. Charge it outside sleep (e.g. during a shower) or nights go missing, and Recovery and Body Age need 21 nights in 31 days.` });
  return notes;
}

/** Fitbit's own scores mapped to their WHOOP counterparts (for the comparison screen). */
export const SCORE_MAP = [
  { fitbit: 'Daily Readiness (1-100; Low 1-29 · Moderate 30-64 · High 65-100)', whoop: 'Recovery (0-100%; red ≤33 · yellow 34-66 · green ≥67)', diff: 'Both: HRV + RHR + sleep vs your baseline. WHOOP adds respiratory rate (and temp/SpO₂ context). Fitbit needs 4 days to start and ~2 weeks to settle.' },
  { fitbit: 'Sleep Score (0-100: duration ~50, deep+REM ~25, restoration ~25)', whoop: 'Sleep Performance (% of a personal Sleep Need)', diff: 'Fitbit scores against fixed targets; WHOOP sets a nightly need from baseline + strain + debt − naps and also scores consistency.' },
  { fitbit: 'Cardio Load + Target Load (open-ended TRIMP; target from 7-vs-28-day load + Readiness)', whoop: 'Strain 0-21 (log scale) + Strain Target', diff: 'Same idea (HR-reserve-weighted load). WHOOP compresses it onto 0-21, so the numbers aren\'t interchangeable.' },
  { fitbit: 'Active Zone Minutes (fat burn 1×, cardio/peak 2×; 150/week goal)', whoop: 'HR-zone time (5 HRR zones) inside Healthspan', diff: 'Different zone edges and credit rules. This app recomputes WHOOP zones from raw HR.' },
  { fitbit: 'Stress Management Score (1-100 daily; responsiveness, exertion balance, sleep; EDA on Sense 2 / Pixel Watch)', whoop: 'Stress Monitor (0-3, live)', diff: 'Fitbit is a once-a-day summary; WHOOP is a live HR+HRV gauge vs 14 days.' },
  { fitbit: 'Cardio Fitness Score (VO₂max estimate, 6 levels by age/sex)', whoop: 'VO₂max (estimated from workouts; needs 14 recoveries in 21 days)', diff: 'Both are estimates. Fitbit\'s needs GPS runs to move beyond a demographic guess.' },
  { fitbit: '— (no biological-age feature)', whoop: 'Healthspan: WHOOP Age + Pace of Aging (Peak tier)', diff: 'Fitbit/Google has no equivalent; this app adds it.' },
  { fitbit: 'Health Metrics dashboard (HRV, RHR, breathing, SpO₂, skin temp ranges)', whoop: 'Health Monitor', diff: 'Equivalent idea.' },
  { fitbit: 'Google Health Coach (Gemini, Premium $9.99/mo or ~$99.99/yr)', whoop: 'WHOOP Coach (included in membership)', diff: 'Both are AI coaches. Fitbit hardware is a one-off purchase plus optional Premium; WHOOP is subscription-only with hardware included.' },
];
