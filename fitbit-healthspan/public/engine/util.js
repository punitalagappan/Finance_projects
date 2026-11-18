// Small math + date helpers shared by the browser app and the Node server/tests.

export const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
export const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

export function mean(arr) {
  const v = arr.filter(isNum);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function sd(arr) {
  const v = arr.filter(isNum);
  if (v.length < 2) return null;
  const m = mean(v);
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1));
}

export function percentile(arr, p) {
  const v = arr.filter(isNum).sort((a, b) => a - b);
  if (!v.length) return null;
  const idx = clamp((v.length - 1) * p, 0, v.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return v[lo] + (v[hi] - v[lo]) * (idx - lo);
}

export const median = (arr) => percentile(arr, 0.5);

/** Linear interpolation over sorted [x, y] points, clamped at the ends. */
export function interp(points, x) {
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return points[points.length - 1][1];
}

// ---- dates (all dates are civil 'YYYY-MM-DD' strings in the user's local time) ----

export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}

export function dateRange(start, end) {
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Minutes since local midnight for an ISO-ish timestamp (no timezone conversion surprises). */
export function minutesOfDay(ts) {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

/** Deterministic PRNG (mulberry32) for demo data. */
export function rng(seed = 42) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.normal = (mu = 0, sigma = 1) => {
    const u = Math.max(next(), 1e-9);
    const v = next();
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return next;
}

export const round = (x, d = 0) => (isNum(x) ? Math.round(x * 10 ** d) / 10 ** d : null);
