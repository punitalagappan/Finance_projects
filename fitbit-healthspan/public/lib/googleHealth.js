// Google Health API v4 client (successor to the Fitbit Web API, which was switched off on 2 Nov 2026).
// Docs: https://developers.google.com/health  (endpoints, data types, scopes, rate limits)
//
// Pulls everything the scoring engine needs and returns normalised days (see public/engine/index.js).
// Response parsing is deliberately tolerant (recursive field lookup) because several field paths are only
// documented by example; use GET /api/raw?type=<data-type> to inspect raw payloads for your account.


export const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const API = 'https://health.googleapis.com/v4/users/me';

export const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.profile.readonly',
  // Optional: lets the app detect which tracker you wear (users.pairedDevices) to apply per-device rules.
  'https://www.googleapis.com/auth/googlehealth.settings.readonly',
];

// ---------------- OAuth (Authorization Code + PKCE, confidential web-server client) ----------------

// Works in browsers, iOS WKWebView (Capacitor) and Node ≥ 18 — WebCrypto only, no Node built-ins.
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function randomString(bytes = 32) {
  return b64url(globalThis.crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function pkcePair() {
  const verifier = randomString(48);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: b64url(digest) };
}

export function authUrl({ clientId, redirectUri, state, challenge }) {
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${AUTH_URL}?${p}`;
}

async function tokenRequest(body) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(), // plain string: safest with Capacitor's native HTTP bridge
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`token endpoint ${res.status}: ${json.error_description || json.error}`);
  return { ...json, obtained_at: Date.now() };
}

const withSecret = (body, secret) => (secret ? { ...body, client_secret: secret } : body);

/** Installed-app (iOS) clients have no secret; web-server clients pass one. */
export const exchangeCode = ({ clientId, clientSecret, redirectUri, code, verifier }) =>
  tokenRequest(withSecret({ client_id: clientId, redirect_uri: redirectUri, code, code_verifier: verifier, grant_type: 'authorization_code' }, clientSecret));

export async function revoke(token) {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' } });
  } catch { /* best effort */ }
}

export async function refresh({ clientId, clientSecret, tokens }) {
  const t = await tokenRequest(withSecret({ client_id: clientId, refresh_token: tokens.refresh_token, grant_type: 'refresh_token' }, clientSecret));
  return { ...tokens, ...t, refresh_token: t.refresh_token || tokens.refresh_token };
}

export const isExpired = (tokens) => !tokens || Date.now() > tokens.obtained_at + (tokens.expires_in - 120) * 1000;

// ---------------- HTTP with backoff ----------------

export class Client {
  constructor(getToken) { this.getToken = getToken; }

  async call(path, { method = 'GET', body, query } = {}) {
    const url = new URL(path.startsWith('http') ? path : `${API}${path}`);
    if (query) for (const [k, v] of Object.entries(query)) if (v != null) url.searchParams.set(k, v);
    for (let attempt = 0; attempt < 5; attempt++) {
      const token = await this.getToken();
      const res = await fetch(url, {
        method,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
        continue;
      }
      const text = await res.text();
      const json = text ? JSON.parse(text) : {};
      if (!res.ok) {
        const err = new Error(`${method} ${url.pathname} → ${res.status}: ${json.error?.message || text.slice(0, 200)}`);
        err.status = res.status;
        err.reason = json.error?.details?.[0]?.reason || json.error?.status;
        throw err;
      }
      return json;
    }
    throw new Error(`${method} ${url.pathname}: rate limited / unavailable after retries`);
  }

  /** `list` with pagination; retries without the filter if the server rejects it (then filters client-side). */
  async list(type, filter, pageSize = 1000) {
    const out = [];
    let pageToken;
    let useFilter = filter;
    do {
      let json;
      try {
        json = await this.call(`/dataTypes/${type}/dataPoints`, { query: { filter: useFilter, pageSize, pageToken } });
      } catch (e) {
        if (e.status === 400 && useFilter) { useFilter = undefined; pageToken = undefined; out.length = 0; continue; }
        throw e;
      }
      out.push(...(json.dataPoints || []));
      pageToken = json.nextPageToken;
    } while (pageToken);
    return out;
  }

  async rollUp(type, startTime, endTime, windowSize) {
    const out = [];
    let pageToken;
    do {
      const json = await this.call(`/dataTypes/${type}/dataPoints:rollUp`, {
        method: 'POST',
        body: { range: { startTime, endTime }, windowSize, pageToken },
      });
      out.push(...(json.rollupDataPoints || json.dataPoints || []));
      pageToken = json.nextPageToken;
    } while (pageToken);
    return out;
  }

  async dailyRollUp(type, startDate, endDate) {
    const d = (s) => { const [year, month, day] = s.split('-').map(Number); return { date: { year, month, day } }; };
    const json = await this.call(`/dataTypes/${type}/dataPoints:dailyRollUp`, {
      method: 'POST',
      body: { range: { start: d(startDate), end: d(endDate) }, windowSizeDays: 1 },
    });
    return json.rollupDataPoints || json.dataPoints || [];
  }
}

// ---------------- tolerant field extraction ----------------

export function findKey(obj, test, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return undefined;
  for (const [k, v] of Object.entries(obj)) if (test(k, v)) return v;
  for (const v of Object.values(obj)) {
    const r = findKey(v, test, depth + 1);
    if (r !== undefined) return r;
  }
  return undefined;
}

const num = (v) => (v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const field = (obj, re) => num(findKey(obj, (k, v) => re.test(k) && (typeof v === 'number' || typeof v === 'string')));
const pad = (n) => String(n).padStart(2, '0');

/** Wall-clock parts of a physical instant in an IANA zone. */
function zoned(date, tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(date).map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
}

/** Normalise any time representation the API uses into a local 'YYYY-MM-DDTHH:MM:SS' string. */
export function localTime(t, tz) {
  if (!t) return null;
  if (typeof t === 'string') return /Z$|[+-]\d\d:\d\d$/.test(t) ? zoned(new Date(t), tz) : t.slice(0, 19);
  if (t.civilTime) return localTime(t.civilTime, tz);
  if (t.date && t.date.year) {
    const tm = t.time || {};
    return `${t.date.year}-${pad(t.date.month)}-${pad(t.date.day)}T${pad(tm.hours || 0)}:${pad(tm.minutes || 0)}:${pad(tm.seconds || 0)}`;
  }
  if (t.year) return `${t.year}-${pad(t.month)}-${pad(t.day)}T00:00:00`;
  if (t.physicalTime) return zoned(new Date(t.physicalTime), tz);
  return null;
}

/** Civil date a data point belongs to. */
export function pointDate(p, tz) {
  const d = findKey(p, (k, v) => k === 'date' && v && typeof v === 'object' && v.year);
  if (d) return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  const iv = findKey(p, (k) => k === 'interval');
  if (iv) return (localTime(iv.civilEndTime || iv.endTime, tz) || '').slice(0, 10);
  const st = findKey(p, (k) => k === 'sampleTime' || k === 'startTime');
  return (localTime(st, tz) || '').slice(0, 10) || null;
}

// ---------------- sync ----------------

const isoDate = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); return d; };
const STAGE_KEYS = { DEEP: 'deepMin', REM: 'remMin', LIGHT: 'lightMin', AWAKE: 'awakeMin' };

/**
 * @returns {Promise<{days: object[], profile: object, warnings: string[]}>}
 */
export async function syncDays(client, { days = 180, tz = 'UTC', onStep = () => {} } = {}) {
  const warnings = [];
  const map = new Map();
  const get = (date) => { if (!map.has(date)) map.set(date, { date, workouts: [], naps: [] }); return map.get(date); };
  const startDate = isoDate(daysAgo(days));
  const endDate = isoDate(daysAgo(-1));
  const safely = async (label, fn) => {
    try { onStep(label); await fn(); } catch (e) { warnings.push(`${label}: ${e.message}`); }
  };

  await safely('identity', async () => {
    await client.call('/identity');
  });

  // Daily records (Daily type: one point per civil date).
  const dailyTypes = [
    // Keep both series; the engine picks one consistently (deep-sleep preferred, never mixed).
    ['daily-heart-rate-variability', (d, p) => {
      d.hrvDeep = field(p, /deepSleepRootMeanSquare/i);
      d.hrvAvg = field(p, /averageHeartRateVariability/i);
    }],
    ['daily-resting-heart-rate', (d, p) => {
      d.rhr = field(p, /^beatsPerMinute$/);
      d.rhrAwakeOnly = findKey(p, (k) => k === 'calculationMethod') === 'ONLY_WITH_AWAKE_DATA';
    }],
    ['daily-respiratory-rate', (d, p) => { d.respRate = field(p, /^breathsPerMinute$/); }],
    ['daily-oxygen-saturation', (d, p) => { d.spo2 = field(p, /^averagePercentage$/); }],
    ['daily-sleep-temperature-derivations', (d, p) => {
      const n = field(p, /^nightlyTemperatureCelsius$/);
      const b = field(p, /^baselineTemperatureCelsius$/);
      if (n != null && b != null) d.skinTempDelta = n - b;
      d.skinTempSd = field(p, /relativeNightlyStddev30d/i);
    }],
    ['daily-vo2-max', (d, p) => {
      d.vo2max = field(p, /^vo2Max$/);
      const est = findKey(p, (k) => k === 'estimated');
      const method = findKey(p, (k) => k === 'measurementMethod');
      if (typeof est === 'boolean') d.vo2Estimated = est;
      if (typeof method === 'string') d.vo2Estimated = /DEMOGRAPHIC/i.test(method);
    }],
  ];
  for (const [type, apply] of dailyTypes) {
    await safely(type, async () => {
      const pts = await client.list(type, `${type.replace(/-/g, '_')}.date >= "${startDate}"`);
      for (const p of pts) {
        const date = pointDate(p, tz);
        if (date && date >= startDate) apply(get(date), p);
      }
    });
  }

  // VO2max provenance: run-based samples mark the day as measured (not demographic).
  await safely('vo2-max', async () => {
    for (const p of await client.list('vo2-max', `vo2_max.sample_time.physical_time >= "${startDate}T00:00:00Z"`)) {
      const date = pointDate(p, tz);
      const method = findKey(p, (k) => k === 'measurementMethod');
      const v = field(p, /^vo2Max$/);
      if (!date || typeof method !== 'string') continue;
      const d = get(date);
      if (/RUN/i.test(method)) { if (v != null) d.vo2max = v; d.vo2Estimated = false; }
      else if (d.vo2Estimated == null) d.vo2Estimated = /DEMOGRAPHIC/i.test(method);
    }
  });

  // Steps per day (90-day dailyRollUp chunks).
  await safely('steps', async () => {
    for (let s = days; s > -1; s -= 90) {
      const a = isoDate(daysAgo(s));
      const b = isoDate(daysAgo(Math.max(-1, s - 90)));
      for (const p of await client.dailyRollUp('steps', a, b)) {
        const date = pointDate(p, tz);
        const v = field(p, /countSum|^count$/i);
        if (date && v != null) get(date).steps = v;
      }
    }
  });

  // Sleep sessions (25 per page).
  await safely('sleep', async () => {
    const pts = await client.list('sleep', `sleep.interval.civil_start_time >= "${startDate}T00:00:00"`, 25);
    for (const p of pts) {
      const iv = findKey(p, (k) => k === 'interval') || {};
      const start = localTime(iv.civilStartTime || iv.startTime, tz);
      const end = localTime(iv.civilEndTime || iv.endTime, tz);
      if (!start || !end) continue;
      const summary = findKey(p, (k) => k === 'summary') || {};
      const rec = {
        start, end,
        asleepMin: num(summary.minutesAsleep),
        inBedMin: (num(summary.minutesInSleepPeriod) || 0) + (num(summary.minutesToFallAsleep) || 0) + (num(summary.minutesAfterWakeUp) || 0) || null,
      };
      for (const s of summary.stagesSummary || []) if (STAGE_KEYS[s.type]) rec[STAGE_KEYS[s.type]] = num(s.minutes);
      const sleepType = findKey(p, (k, v) => k === 'type' && (v === 'CLASSIC' || v === 'STAGES'));
      if (sleepType === 'CLASSIC') rec.classic = true;
      const stagesStatus = findKey(p, (k) => k === 'stagesStatus');
      if (typeof stagesStatus === 'string' && /REJECTED/i.test(stagesStatus)) rec.classic = true;
      if (findKey(p, (k) => k === 'manuallyEdited') === true) rec.edited = true;
      const meta = findKey(p, (k) => k === 'metadata') || {};
      const d = get(end.slice(0, 10));
      const isNap = meta.nap === true || (meta.mainSleep === false && rec.asleepMin < 180);
      if (isNap) d.naps.push(rec);
      else if (!d.sleep || (rec.asleepMin || 0) > (d.sleep.asleepMin || 0)) { if (d.sleep) d.naps.push(d.sleep); d.sleep = rec; }
    }
  });

  // Exercise sessions.
  await safely('exercise', async () => {
    const pts = await client.list('exercise', `exercise.interval.civil_start_time >= "${startDate}T00:00:00"`, 25);
    for (const p of pts) {
      const iv = findKey(p, (k) => k === 'interval') || {};
      const start = localTime(iv.civilStartTime || iv.startTime, tz);
      const end = localTime(iv.civilEndTime || iv.endTime, tz);
      if (!start) continue;
      const type = findKey(p, (k) => k === 'exerciseType');
      get(start.slice(0, 10)).workouts.push({
        name: findKey(p, (k) => k === 'displayName') || type,
        type,
        start,
        durationMin: end ? Math.round((new Date(end) - new Date(start)) / 60000) : 0,
        avgHr: field(p, /averageHeartRateBeatsPerMinute/),
      });
    }
  });

  // Body composition.
  await safely('body-fat', async () => {
    for (const p of await client.list('body-fat', `body_fat.sample_time.physical_time >= "${startDate}T00:00:00Z"`)) {
      const date = pointDate(p, tz);
      const v = field(p, /^percentage$/);
      if (date && v != null) get(date).bodyFatPct = v;
    }
  });
  await safely('weight', async () => {
    for (const p of await client.list('weight', `weight.sample_time.physical_time >= "${startDate}T00:00:00Z"`)) {
      const date = pointDate(p, tz);
      const g = field(p, /^weightGrams$/);
      if (date && g != null) get(date).weightKg = g / 1000;
    }
  });

  // Heart rate per minute: rollUp with 60 s windows, ≤14-day ranges (API limit).
  await safely('heart-rate', async () => {
    for (let s = days; s > -1; s -= 14) {
      const a = daysAgo(s);
      const b = daysAgo(Math.max(-1, s - 14));
      onStep(`heart-rate ${isoDate(a)}`);
      for (const p of await client.rollUp('heart-rate', a.toISOString(), b.toISOString(), '60s')) {
        const st = findKey(p, (k) => k === 'startTime' || k === 'civilStartTime') || findKey(p, (k) => k === 'interval');
        const t = localTime(st && st.startTime ? st.startTime : st, tz);
        const bpm = field(p, /beatsPerMinute(Avg|Average|Mean)|^(avg|average|mean)$/i) ?? field(p, /beatsPerMinute/i);
        if (!t || bpm == null) continue;
        const d = get(t.slice(0, 10));
        if (!d.hrMinutes) d.hrMinutes = new Array(1440).fill(0);
        d.hrMinutes[Number(t.slice(11, 13)) * 60 + Number(t.slice(14, 16))] = Math.round(bpm);
      }
    }
  });

  let profile = {};
  await safely('profile', async () => {
    const p = await client.call('/profile');
    const age = field(p, /^age$/i);
    if (age != null) profile.age = age;
  });

  await safely('paired-devices', async () => {
    const json = await client.call('/pairedDevices');
    const devices = json.pairedDevices || json.devices || (Array.isArray(json) ? json : []);
    const names = devices.map((d) => findKey(d, (k) => k === 'deviceVersion' || k === 'displayName' || k === 'model')).filter(Boolean);
    if (names.length) profile.deviceName = String(names[0]);
  });

  const out = [...map.values()].filter((d) => d.date >= startDate && d.date <= endDate).sort((a, b) => (a.date < b.date ? -1 : 1));
  return { days: out, profile, warnings };
}
