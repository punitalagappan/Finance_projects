// Tiny dependency-free SVG chart helpers (return markup strings).

import { clamp, isNum } from '../engine/util.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** Circular progress ring. `frac` 0..1. */
export function ring({ frac, color, center, unit = '', size = 150, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const f = isNum(frac) ? clamp(frac, 0, 1) : 0;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(center)}${esc(unit)}">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#262c34" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#e8edf2" font-size="${size * 0.24}" font-weight="800">${esc(center)}<tspan font-size="${size * 0.11}" fill="#8a96a3">${esc(unit)}</tspan></text>
  </svg>`;
}

/** Semicircle gauge with optional target band. */
export function gauge({ value, min, max, color, label, band, size = 220, decimals = 1 }) {
  const w = size;
  const h = size * 0.62;
  const cx = w / 2;
  const cy = h - 10;
  const r = w / 2 - 16;
  const angle = (v) => Math.PI * (1 - (clamp(v, min, max) - min) / (max - min));
  const pt = (a, rr = r) => [cx + rr * Math.cos(a), cy - rr * Math.sin(a)];
  const arc = (a0, a1, rr = r) => {
    const [x0, y0] = pt(a0, rr);
    const [x1, y1] = pt(a1, rr);
    return `M${x0.toFixed(1)},${y0.toFixed(1)} A${rr},${rr} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}`;
  };
  const v = isNum(value) ? value : min;
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label || '')}">
    <path d="${arc(Math.PI, 0)}" fill="none" stroke="#262c34" stroke-width="14" stroke-linecap="round"/>
    ${band ? `<path d="${arc(angle(band[0]), angle(band[1]), r + 12)}" fill="none" stroke="${color}" stroke-opacity="0.35" stroke-width="4" stroke-linecap="round"/>` : ''}
    ${isNum(value) && value > min ? `<path d="${arc(Math.PI, angle(v))}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round"/>` : ''}
    <text x="${cx}" y="${cy - 18}" text-anchor="middle" fill="#e8edf2" font-size="${size * 0.2}" font-weight="800">${isNum(value) ? (Math.abs(v) < 0.5 * 10 ** -decimals ? 0 : v).toFixed(decimals) : '–'}</text>
    <text x="4" y="${h}" fill="#8a96a3" font-size="11">${min}</text>
    <text x="${w - 4}" y="${h}" fill="#8a96a3" font-size="11" text-anchor="end">${max}</text>
  </svg>`;
}

/**
 * Line / bar chart over dates.
 * series: [{ values: (number|null)[], color, type: 'line'|'bar', label, colorFn?(v) }]
 */
export function timeChart({ labels, series, height = 180, yMin, yMax, refLines = [], bandY, yFmt = (v) => Math.round(v) }) {
  const W = 640;
  const H = height;
  const L = 34;
  const R = 8;
  const T = 10;
  const B = 22;
  const all = [...series.flatMap((s) => s.values), ...refLines.map((r) => r.y)].filter(isNum);
  if (!all.length) return `<p class="muted small">Not enough data yet.</p>`;
  let lo = yMin ?? Math.min(...all);
  let hi = yMax ?? Math.max(...all);
  if (hi === lo) { hi += 1; lo -= 1; }
  const pad = yMin == null || yMax == null ? (hi - lo) * 0.1 : 0;
  lo = yMin ?? lo - pad;
  hi = yMax ?? hi + pad;
  const n = labels.length;
  const x = (i) => L + ((W - L - R) * (n === 1 ? 0.5 : i / (n - 1)));
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const bw = Math.max(2, ((W - L - R) / n) * 0.7);

  let out = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">`;
  if (bandY) out += `<rect x="${L}" y="${y(bandY[1])}" width="${W - L - R}" height="${Math.max(0, y(bandY[0]) - y(bandY[1]))}" fill="#2bd47d" opacity="0.08"/>`;
  for (const t of [lo, (lo + hi) / 2, hi]) {
    out += `<line x1="${L}" x2="${W - R}" y1="${y(t)}" y2="${y(t)}" stroke="#262c34"/><text x="${L - 6}" y="${y(t) + 4}" fill="#8a96a3" font-size="10" text-anchor="end">${yFmt(t)}</text>`;
  }
  for (const r of refLines) out += `<line x1="${L}" x2="${W - R}" y1="${y(r.y)}" y2="${y(r.y)}" stroke="${r.color || '#8a96a3'}" stroke-dasharray="4 4"/>`;
  const step = Math.max(1, Math.ceil(n / 6));
  labels.forEach((lab, i) => {
    if ((i % step === 0 && (n - 1 - i >= step / 2 || i === n - 1)) || i === n - 1) out += `<text x="${x(i)}" y="${H - 6}" fill="#8a96a3" font-size="10" text-anchor="${i === n - 1 && n > 1 ? 'end' : i === 0 && n > 1 ? 'start' : 'middle'}">${esc(lab)}</text>`;
  });
  for (const s of series) {
    if (s.type === 'bar') {
      s.values.forEach((v, i) => {
        if (!isNum(v)) return;
        const base = y(Math.max(lo, 0));
        const top = y(v);
        out += `<rect x="${x(i) - bw / 2}" y="${Math.min(top, base)}" width="${bw}" height="${Math.abs(base - top)}" rx="2" fill="${s.colorFn ? s.colorFn(v, i) : s.color}"><title>${esc(labels[i])}: ${esc(yFmt(v))}</title></rect>`;
      });
    } else {
      let d = '';
      s.values.forEach((v, i) => {
        if (!isNum(v)) return;
        d += `${d && isNum(s.values[i - 1]) ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      });
      out += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
      if (n <= 40) s.values.forEach((v, i) => { if (isNum(v)) out += `<circle cx="${x(i)}" cy="${y(v)}" r="2.6" fill="${s.color}"><title>${esc(labels[i])}: ${esc(yFmt(v))}</title></circle>`; });
    }
  }
  return `${out}</svg>`;
}

/** Horizontal range bar: value vs normal range. */
export function rangeBar({ value, lo, hi, min, max, color }) {
  const pos = (v) => `${(100 * clamp((v - min) / (max - min), 0, 1)).toFixed(1)}%`;
  return `<div class="rangebar">
    ${isNum(lo) && isNum(hi) ? `<div class="band" style="left:${pos(lo)};width:calc(${pos(hi)} - ${pos(lo)})"></div>` : ''}
    ${isNum(value) ? `<div class="dot" style="left:${pos(value)};background:${color}"></div>` : ''}
  </div>`;
}
