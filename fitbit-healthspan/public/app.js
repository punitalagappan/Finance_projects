import {
  analyze, recoveryBand, strainBand, sleepBand, stressBand, bedtimeFor, computeHealthspan, healthMonitor, strainTarget,
  BEHAVIORS, behaviorImpacts, isNum, mean, clamp, parseDate, addDays,
} from './engine/index.js';
import { ring, gauge, timeChart, rangeBar } from './ui/charts.js';
import { idbGet, idbSet, idbDel, lsGet, lsSet } from './ui/store.js';
import { generateDemo } from './adapters/demo.js';
import { importFiles } from './adapters/takeout.js';

// ---------------------------------------------------------------- state
const state = {
  dataset: null, // { days, profile, source, syncedAt }
  settings: lsGet('settings', { age: null, sex: null, maxHr: null, bodyFatPct: null, wakeTime: '07:00' }),
  journal: lsGet('journal', {}),
  analysis: null,
  idx: 0,
  tab: 'today',
  trendRange: 30,
  config: { googleConfigured: false, connected: false },
  busy: null,
  cache: new Map(),
};

const $ = (s) => document.querySelector(s);
const view = $('#view');
const COLORS = { green: 'var(--green)', yellow: 'var(--yellow)', red: 'var(--red)' };
const HEX = { green: '#2bd47d', yellow: '#f5c84b', red: '#ff5a5f', strain: '#3d8bfd', sleep: '#8b7cf6', stress: '#ff9f43', age: '#36d6c3', muted: '#8a96a3' };

// ---------------------------------------------------------------- formatting
const fmt = (v, dp = 0) => (isNum(v) ? v.toFixed(dp) : '–');
const fmtH = (min) => (isNum(min) ? `${Math.floor(min / 60)}:${String(Math.round(min % 60)).padStart(2, '0')}` : '–');
const fmtSigned = (v, dp = 1) => (isNum(v) ? `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(dp)}` : '–');
const fmtDate = (s, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => parseDate(s).toLocaleDateString(undefined, opts);
const shortDate = (s) => parseDate(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pill = (band) => (band ? `<span class="pill ${band.key}">${esc(band.label)}</span>` : '');

function toast(msg, ms = 3500) {
  const t = $('#toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, ms);
}

// ---------------------------------------------------------------- data lifecycle
function profile() {
  const s = state.settings;
  const p = state.dataset?.profile || {};
  return {
    age: Number(s.age) || p.age || 35,
    sex: s.sex || p.sex || 'male',
    maxHr: Number(s.maxHr) || undefined,
    bodyFatPct: isNum(Number(s.bodyFatPct)) && s.bodyFatPct !== '' && s.bodyFatPct != null ? Number(s.bodyFatPct) : undefined,
  };
}

function recompute(keepDate) {
  state.cache.clear();
  if (!state.dataset?.days?.length) { state.analysis = null; return; }
  const prevDate = keepDate && state.analysis?.days[state.idx]?.date;
  state.analysis = analyze(state.dataset.days, profile());
  const days = state.analysis.days;
  const i = prevDate ? days.findIndex((d) => d.date === prevDate) : -1;
  state.idx = i >= 0 ? i : days.length - 1;
}

async function setDataset(ds, { persist = true } = {}) {
  state.dataset = ds;
  if (ds.journal && !Object.keys(state.journal).length) {
    state.journal = ds.journal;
    lsSet('journal', state.journal);
  }
  recompute(false);
  if (persist) await idbSet('dataset', ds);
  render();
}

async function loadDemo() {
  const demo = generateDemo();
  await setDataset({ ...demo, source: 'demo', syncedAt: new Date().toISOString() });
  toast('Demo data loaded: 210 days for a 34-year-old');
}

async function syncGoogle() {
  state.busy = 'Syncing from Google Health… (first sync can take a minute or two)';
  render();
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch(`/api/sync?days=200&tz=${encodeURIComponent(tz)}`);
    const json = await res.json();
    if (res.status === 401) {
      state.config.connected = false;
      throw new Error(json.error || 'Please reconnect Google Health');
    }
    if (!res.ok) throw new Error(json.error || res.statusText);
    if (!json.days.length) throw new Error(`No data returned. ${json.warnings.join('; ')}`);
    if (state.dataset?.source === 'demo') { state.journal = {}; lsSet('journal', {}); }
    await setDataset({ days: json.days, profile: json.profile, source: 'google', syncedAt: new Date().toISOString(), warnings: json.warnings });
    toast(json.warnings.length ? `Synced ${json.days.length} days (${json.warnings.length} data types unavailable)` : `Synced ${json.days.length} days`);
  } catch (e) {
    toast(`Sync failed: ${e.message}`, 7000);
  } finally {
    state.busy = null;
    render();
  }
}

async function importFromFiles(files) {
  if (!files || !files.length) return;
  state.busy = `Reading ${files.length} files…`;
  render();
  try {
    const res = await importFiles(files, {
      maxDays: 200,
      hrIsUtc: state.settings.hrIsUtc !== false,
      onProgress: (n, total) => { state.busy = `Reading files… ${n}/${total}`; const b = $('#busy-msg'); if (b) b.textContent = state.busy; },
    });
    if (!res.days.length) throw new Error(res.warnings.join('; '));
    if (state.dataset?.source === 'demo') { state.journal = {}; lsSet('journal', {}); }
    if (res.profile) state.settings = { ...state.settings, ...Object.fromEntries(Object.entries(res.profile).filter(([k, v]) => v != null && !state.settings[k])) };
    await setDataset({ days: res.days, profile: res.profile || {}, journal: res.journal, source: 'import', syncedAt: new Date().toISOString(), warnings: res.warnings });
    toast(`Imported ${res.days.length} days${res.warnings.length ? ` (${res.warnings.length} warnings)` : ''}`);
  } catch (e) {
    toast(`Import failed: ${e.message}`, 7000);
  } finally {
    state.busy = null;
    render();
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify({ ...state.dataset, profile: profile(), journal: state.journal })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `fitbit-${state.analysis.latest.date}.healthspan.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------------------------------------------------------------- per-day context
function ctx() {
  const a = state.analysis;
  const i = state.idx;
  const day = a.days[i];
  const isLatest = i === a.days.length - 1;
  const memo = (k, f) => { const key = `${k}:${i}`; if (!state.cache.has(key)) state.cache.set(key, f()); return state.cache.get(key); };
  return {
    a, day, i, isLatest,
    history: a.days.slice(0, i),
    healthspan: memo('hs', () => (isLatest ? a.healthspan : computeHealthspan(a.days.slice(0, i + 1), profile()))),
    monitor: memo('mon', () => (isLatest ? a.monitor : healthMonitor(day, a.days.slice(0, i)))),
    target: strainTarget(day.recovery?.score ?? null),
    tonight: isLatest ? a.tonight : { ...a.days[i + 1].sleepNeed, typicalEfficiency: a.tonight.typicalEfficiency },
  };
}

// ---------------------------------------------------------------- render
function render() {
  const has = Boolean(state.analysis);
  $('#tabs').hidden = !has;
  $('#datepick').hidden = !has;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  if (state.busy) {
    view.innerHTML = `<div class="empty"><p><span class="spinner"></span> <span id="busy-msg">${esc(state.busy)}</span></p></div>`;
    return;
  }
  if (!has) { view.innerHTML = renderWelcome(); return; }
  const c = ctx();
  $('#current-date').textContent = c.isLatest ? `Today · ${fmtDate(c.day.date, { month: 'short', day: 'numeric' })}` : fmtDate(c.day.date);
  document.querySelector('[data-action="next-day"]').disabled = c.isLatest;
  document.querySelector('[data-action="prev-day"]').disabled = c.i === 0;
  const tabs = { today: renderToday, healthspan: renderHealthspan, sleep: renderSleep, strain: renderStrain, stress: renderStress, health: renderHealth, trends: renderTrends, journal: renderJournal };
  view.innerHTML = tabs[state.tab](c) + sourceFooter();
}

function sourceFooter() {
  const ds = state.dataset;
  const label = { demo: 'Demo data', google: 'Google Health API', import: 'Imported export' }[ds.source] || ds.source;
  return `<p class="note">Source: ${esc(label)} · ${ds.days.length} days · updated ${new Date(ds.syncedAt).toLocaleString()}.
    Scores are WHOOP-<em>style</em> estimates built from published research. They are not WHOOP's proprietary algorithms and not medical advice.</p>`;
}

function renderWelcome() {
  const g = state.config;
  return `<div class="empty">
    <img src="icon.svg" width="56" height="56" alt="" />
    <h1>Healthspan for Fitbit</h1>
    <p>Recovery, Strain, Sleep, Stress and a research-based <strong>Body Age</strong> with Pace of Aging, all calculated from your Fitbit data.</p>
    <div class="choice">
      <div class="card"><div><strong>Connect Google Health</strong><div class="tip">Live sync from your Fitbit via the Google Health API, which replaced the Fitbit Web API in November 2026.
        ${g.googleConfigured ? '' : 'Needs a Google Cloud OAuth client in <code>.env</code> first (see README).'}</div></div>
        ${g.googleConfigured ? (g.connected ? '<button class="btn primary" data-action="sync">Sync now</button>' : '<a class="btn primary" href="/auth/login">Connect</a>') : '<button class="btn" disabled>Connect</button>'}</div>
      <div class="card"><div><strong>Import a Fitbit / Takeout export</strong><div class="tip">Choose the unzipped export folder (or the JSON/CSV files). Everything is processed in your browser.</div></div>
        <label class="btn">Choose folder<input type="file" id="import-dir" webkitdirectory multiple hidden /></label></div>
      <div class="card"><div><strong>Explore with demo data</strong><div class="tip">210 days of realistic synthetic data, including a cold and a few late nights.</div></div>
        <button class="btn" data-action="demo">Load demo</button></div>
    </div>
  </div>`;
}

// ----- Today
function renderToday(c) {
  const { day } = c;
  const rec = day.recovery;
  const rb = recoveryBand(rec?.score);
  const sp = day.sleepPerf;
  const hs = c.healthspan;
  const recColor = rb ? HEX[rb.key] : HEX.muted;
  const recCenter = rec?.score != null ? Math.round(rec.score) : '–';
  const target = c.target;
  const bed = bedtimeFor(c.tonight.totalMin, state.settings.wakeTime || '07:00', c.tonight.typicalEfficiency);
  const trend = c.isLatest ? c.a.hrvTrend : null;

  return `
  <div class="grid cols-3">
    <div class="card ring-card">
      <div class="label c-sleep">Sleep</div>
      ${ring({ frac: (sp?.score ?? 0) / 100, color: HEX.sleep, center: sp ? Math.round(sp.score) : '–', unit: '%' })}
      <div class="sub">${day.sleep ? `${fmtH(day.sleep.asleepMin)} of ${fmtH(day.sleepNeedMin)} needed` : 'No sleep recorded'}</div>
      ${pill(sleepBand(sp?.score))}
    </div>
    <div class="card ring-card">
      <div class="label" style="color:${recColor}">Recovery</div>
      ${ring({ frac: (rec?.score ?? 0) / 100, color: recColor, center: recCenter, unit: rec?.score != null ? '%' : '' })}
      <div class="sub">${rec?.calibrating && rec?.score == null ? 'Calibrating: needs 4+ nights' : `HRV ${fmt(day.hrv)} ms · RHR ${fmt(day.sleepRhr)} bpm`}</div>
      ${pill(rb)}
    </div>
    <div class="card ring-card">
      <div class="label c-strain">Strain</div>
      <div style="width:200px">${gauge({ value: day.strain, min: 0, max: 21, color: HEX.strain, band: [target.lo, target.hi], label: 'Day strain' })}</div>
      <div class="sub">Target ${target.lo}–${target.hi} · ${esc(target.label)}</div>
      ${pill(strainBand(day.strain))}
    </div>
  </div>

  <div class="grid cols-2" style="margin-top:14px">
    <div class="card">
      <h2>What drove recovery</h2>
      ${rec && rec.baselines ? `<div class="kv">
        <div>Heart rate variability</div><div>${fmt(day.hrv)} ms <span class="muted small">vs ${fmt(rec.baselines.hrv)}</span></div>
        <div>Resting heart rate (asleep)</div><div>${fmt(day.sleepRhr)} bpm <span class="muted small">vs ${fmt(rec.baselines.rhr)}</span></div>
        <div>Respiratory rate</div><div>${fmt(day.respRate, 1)} rpm <span class="muted small">vs ${fmt(rec.baselines.respRate, 1)}</span></div>
        <div>Sleep performance</div><div>${fmt(sp?.score)}%</div>
      </div>
      ${penaltyNotes(rec)}` : '<p class="muted">Recovery appears after 4 nights with HRV or resting heart rate data.</p>'}
      ${trend ? `<hr><div class="row"><div>7-day HRV trend</div><div>${hrvTrendPill(trend)}</div></div>
        <p class="tip">7-day average ${fmt(trend.avg7)} ms vs your 60-day normal range ${fmt(trend.lo)}–${fmt(trend.hi)} ms.</p>` : ''}
    </div>
    <div class="card stack">
      <h2>Plan</h2>
      <div class="row"><div><strong>Strain target</strong><div class="tip">${esc(target.label)}</div></div><div class="big c-strain" style="font-size:28px">${target.lo}–${target.hi}</div></div>
      <hr>
      <div class="row"><div><strong>Sleep tonight</strong><div class="tip">Need ${fmtH(c.tonight.totalMin)} asleep · in bed by <strong>${bed.bedtime}</strong> to wake at ${esc(state.settings.wakeTime || '07:00')}</div></div><div class="big c-sleep" style="font-size:28px">${fmtH(c.tonight.totalMin)}</div></div>
      <hr>
      <div class="row"><div><strong>Body Age</strong><div class="tip">${hs.unlocked ? `${fmt(Math.abs(hs.difference), 1)} years ${hs.difference < 0 ? 'younger' : 'older'} than calendar age · Pace ${fmt(hs.pace, 1)}x` : `Unlocks after 21 nights in 31 days (${hs.recoveriesLast31}/21)`}</div></div>
        <button class="btn" data-tab="healthspan"><span class="c-age" style="font-weight:800">${hs.unlocked ? fmt(hs.bodyAge, 1) : '–'}</span> →</button></div>
    </div>
  </div>

  ${day.workouts.length ? `<h3 class="section-title">Activities</h3><div class="card"><ul class="list">${day.workouts.map(activityRow).join('')}</ul></div>` : ''}`;
}

function penaltyNotes(rec) {
  const p = rec.penalties || {};
  const notes = [];
  if (p.respRate > 0) notes.push('respiratory rate is elevated');
  if (p.skinTemp > 0) notes.push('skin temperature is off baseline');
  if (p.spo2 > 0) notes.push('blood oxygen is below normal');
  if (p.priorStrain > 0) notes.push("yesterday's strain was unusually high");
  return notes.length ? `<p class="tip" style="margin-top:10px">⚠ Lowered because ${notes.join(', ')}.</p>` : '';
}

function hrvTrendPill(t) {
  if (t.status === 'below') return '<span class="pill red">Below normal</span>';
  if (t.status === 'above') return '<span class="pill green">Above normal</span>';
  return '<span class="pill green">Within normal</span>';
}

function activityRow(w) {
  const zones = w.bands ? `Zones 1–3: ${Math.round(w.bands.slice(0, 4).reduce((a, b) => a + b, 0))} min · 4–5: ${Math.round(w.bands[4] + w.bands[5])} min` : '';
  return `<li><div><strong>${esc(w.name || w.type || 'Workout')}</strong> ${w.strength ? '<span class="pill">strength</span>' : ''}
    <div class="tip">${w.start ? w.start.slice(11, 16) : ''} · ${w.durationMin} min${isNum(w.avgHr) ? ` · avg ${Math.round(w.avgHr)} bpm` : ''}${zones ? ` · ${zones}` : ''}</div></div>
    <div class="c-strain" style="font-weight:800">${isNum(w.strain) ? w.strain.toFixed(1) : '–'}</div></li>`;
}

// ----- Healthspan
function renderHealthspan(c) {
  const hs = c.healthspan;
  const younger = hs.difference < 0;
  const groups = ['Sleep', 'Activity', 'Fitness'];
  const hist = c.a.healthspanHistory.filter((h) => h.date <= c.day.date);
  return `
  <div class="grid cols-2">
    <div class="card">
      <h2>Body Age</h2>
      ${hs.unlocked ? `<div class="row" style="align-items:flex-end">
        <div><div class="big c-age">${fmt(hs.bodyAge, 1)}</div><div class="muted">calendar age ${hs.chronologicalAge}</div></div>
        <div style="text-align:right"><div style="font-size:24px;font-weight:800" class="${younger ? 'c-green' : 'c-red'}">${fmt(Math.abs(hs.difference), 1)} yrs ${younger ? 'younger' : 'older'}</div>
        <div class="tip">based on your last 6 months</div></div></div>`
      : `<p class="muted">Body Age unlocks after 21 nights of data in 31 days (you have ${hs.recoveriesLast31}).</p>`}
      ${hs.calibrating && hs.unlocked ? '<p class="tip">Still calibrating: full accuracy after 90 days of data.</p>' : ''}
    </div>
    <div class="card">
      <h2>Pace of Aging</h2>
      <div style="max-width:260px;margin:auto">${gauge({ value: hs.unlocked ? hs.pace : null, min: -1, max: 3, color: hs.pace > 1.05 ? HEX.red : HEX.age, band: [-1, 1], label: 'Pace of aging' })}</div>
      <div class="row"><span class="tip">Projects your last 30 days six months ahead. 1.0x = aging one year per year.</span>${pill(hs.paceBand)}</div>
    </div>
  </div>

  ${groups.map((g) => `<h3 class="section-title">${g}</h3><div class="card">${hs.rows.filter((r) => r.group === g).map(metricRow).join('')}</div>`).join('')}

  ${hist.length > 1 ? `<h3 class="section-title">Body Age history (weekly)</h3><div class="card">${timeChart({
    labels: hist.map((h) => shortDate(h.date)),
    series: [{ values: hist.map((h) => h.bodyAge), color: HEX.age }],
    refLines: [{ y: hs.chronologicalAge, color: HEX.muted }],
    yFmt: (v) => v.toFixed(1),
  })}<p class="tip">Dashed line = calendar age.</p></div>` : ''}

  <details class="card" style="margin-top:14px"><summary><strong>How Body Age is calculated</strong></summary>
    <p class="tip">Following the method WHOOP published for WHOOP Age (2025 Healthspan white paper), each of nine habits is compared with a health-guideline target.
    The all-cause-mortality hazard ratio from large studies is converted into years with 10·ln(HR), because mortality risk rises about 10% per year of age.
    The years are added to your calendar age. Meeting a target adds 0. Beating it subtracts years. Falling short adds years.
    Because the habits overlap, every impact is scaled by 0.57. That factor was fitted so WHOOP's four published reference cases come out right
    (a typical 30-year-old American is about +6 years for men and +7.5 for women; the median WHOOP member is about −1.6).
    The per-metric curves are our reconstruction from the studies WHOOP cites, not WHOOP's proprietary model. Zone time counts only logged workouts, as WHOOP does.
    Lean mass is ignored unless you have smart-scale data or enter a body-fat % in Settings.</p>
  </details>`;
}

function metricRow(r) {
  const unitFmt = (v) => (isNum(v) ? (r.key === 'steps' ? Math.round(v).toLocaleString() : v.toFixed(r.dp)) : '–');
  const y = r.years;
  const w = clamp(Math.abs(y) / 3, 0, 1) * 50;
  const bar = y < 0 ? `<span style="right:50%;width:${w}%;background:var(--green)"></span>` : `<span style="left:50%;width:${w}%;background:var(--red)"></span>`;
  const trendTxt = isNum(r.recentValue) && isNum(r.value) && Math.abs(r.recentValue - r.value) / Math.max(1, Math.abs(r.value)) > 0.03
    ? ` · last 30 days ${unitFmt(r.recentValue)} ${r.recentYears < r.years ? '↗ improving' : '↘ slipping'}` : '';
  return `<div class="metric">
    <div class="name">${esc(r.label)}</div>
    <div class="impact ${r.missing ? 'muted' : y < -0.05 ? 'c-green' : y > 0.05 ? 'c-red' : 'muted'}">${r.missing ? 'no data' : `${fmtSigned(y)} yrs`}</div>
    <div class="impactbar">${r.missing ? '' : bar}</div>
    <div class="detail">${r.missing ? esc(r.tip) : `${unitFmt(r.value)} ${esc(r.unit)} · target ${unitFmt(r.target)}${trendTxt}`}${r.missing ? '' : `<br>${esc(r.tip)}`}</div>
  </div>`;
}

// ----- Sleep
function renderSleep(c) {
  const { day } = c;
  const sp = day.sleepPerf;
  const s = day.sleep;
  const need = day.sleepNeed;
  const tn = c.tonight;
  const bed = bedtimeFor(tn.totalMin, state.settings.wakeTime || '07:00', tn.typicalEfficiency);
  const last = c.a.days.slice(Math.max(0, c.i - 29), c.i + 1);
  const stageTotal = s ? (s.deepMin || 0) + (s.remMin || 0) + (s.lightMin || 0) + (s.awakeMin || 0) : 0;
  const seg = (v, color) => (stageTotal && v ? `<div style="width:${(100 * v) / stageTotal}%;background:${color}"></div>` : '');
  return `
  <div class="grid cols-2">
    <div class="card ring-card">
      <div class="label c-sleep">Sleep performance</div>
      ${ring({ frac: (sp?.score ?? 0) / 100, color: HEX.sleep, center: sp ? Math.round(sp.score) : '–', unit: '%', size: 170 })}
      ${pill(sleepBand(sp?.score))}
      ${s ? `<div class="sub">${s.start.slice(11, 16)} → ${s.end.slice(11, 16)} · ${fmtH(s.asleepMin)} asleep of ${fmtH(s.inBedMin)} in bed</div>` : '<div class="sub">No main sleep recorded for this night</div>'}
    </div>
    <div class="card">
      <h2>Performance breakdown</h2>
      ${sp ? `<div class="kv">
        <div>Hours vs needed <span class="tip">(55%)</span></div><div>${fmt(sp.sufficiency)}%</div>
        <div>Sleep efficiency <span class="tip">(20%, optimal ≥90%)</span></div><div>${fmt(sp.efficiency)}%</div>
        <div>Sleep consistency <span class="tip">(15%, optimal ≥80%)</span></div><div>${fmt(sp.consistency)}%</div>
        <div>High sleep stress <span class="tip">(10%, optimal &lt;1%)</span></div><div>${isNum(sp.sleepStressPct) ? `${fmt(sp.sleepStressPct, 1)}%` : '–'}</div>
        <div>Restorative (deep + REM)</div><div>${fmtH(sp.restorativeMin)}</div>
      </div>` : '<p class="muted">No sleep data.</p>'}
      ${s ? `<h3>Stages</h3><div class="stages">${seg(s.awakeMin, '#cfd6de')}${seg(s.remMin, '#8b7cf6')}${seg(s.lightMin, '#4f6bd8')}${seg(s.deepMin, '#2a2f86')}</div>
        <div class="legend"><span><i style="background:#cfd6de"></i>Awake ${fmtH(s.awakeMin)}</span><span><i style="background:#8b7cf6"></i>REM ${fmtH(s.remMin)}</span><span><i style="background:#4f6bd8"></i>Light ${fmtH(s.lightMin)}</span><span><i style="background:#2a2f86"></i>Deep ${fmtH(s.deepMin)}</span></div>` : ''}
    </div>
  </div>

  <div class="grid cols-2" style="margin-top:14px">
    <div class="card">
      <h2>Sleep need${c.isLatest ? ' tonight' : ' (following night)'}</h2>
      <div class="kv">
        <div>Baseline (your rested average)</div><div>${fmtH(tn.baselineMin)}</div>
        <div>+ from today's strain</div><div>${fmtH(tn.strainMin)}</div>
        <div>+ sleep debt</div><div>${fmtH(tn.debtMin)}</div>
        <div>− naps</div><div>${fmtH(tn.napMin)}</div>
        <div><strong>Total need</strong></div><div class="c-sleep">${fmtH(tn.totalMin)}</div>
      </div>
      ${need ? `<p class="tip">Last night's need was ${fmtH(need.totalMin)}.</p>` : ''}
    </div>
    <div class="card">
      <h2>Sleep planner</h2>
      <label class="tip">I want to wake up at <input type="time" id="wake-time" value="${esc(state.settings.wakeTime || '07:00')}" style="background:var(--bg);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:4px 8px"/></label>
      <div class="big c-sleep" style="margin:14px 0 6px">${bed.bedtime}</div>
      <div class="tip">Get in bed by then. That allows ${fmtH(bed.inBedMin)} in bed at your typical ${fmt(tn.typicalEfficiency)}% efficiency.</div>
    </div>
  </div>

  <h3 class="section-title">Last 30 nights: hours asleep vs need</h3>
  <div class="card">${timeChart({
    labels: last.map((d) => shortDate(d.date)),
    series: [
      { type: 'bar', values: last.map((d) => (d.sleep ? d.sleep.asleepMin / 60 : null)), color: HEX.sleep },
      { values: last.map((d) => d.sleepNeedMin / 60), color: '#e8edf2' },
    ],
    yMin: 0, yFmt: (v) => v.toFixed(0),
  })}<div class="legend"><span><i style="background:${HEX.sleep}"></i>Asleep (h)</span><span><i style="background:#e8edf2"></i>Need (h)</span></div></div>

  <h3 class="section-title">Sleep consistency</h3>
  <div class="card">${timeChart({
    labels: last.map((d) => shortDate(d.date)),
    series: [{ values: last.map((d) => d.consistency), color: HEX.sleep }],
    yMin: 0, yMax: 100, bandY: [80, 100],
  })}<p class="tip">How closely your sleep and wake times match the previous 4 days. 80%+ is optimal and 70% is the Body Age target.</p></div>`;
}

// ----- Strain
function renderStrain(c) {
  const { day } = c;
  const last = c.a.days.slice(Math.max(0, c.i - 13), c.i + 1);
  const b = day.bands;
  return `
  <div class="grid cols-2">
    <div class="card ring-card">
      <div class="label c-strain">Day strain</div>
      <div style="width:260px">${gauge({ value: day.strain, min: 0, max: 21, color: HEX.strain, band: [c.target.lo, c.target.hi], label: 'Day strain', size: 260 })}</div>
      ${pill(strainBand(day.strain))}
      <div class="sub">Target ${c.target.lo}–${c.target.hi}: ${esc(c.target.label)}</div>
    </div>
    <div class="card">
      <h2>Heart-rate zones today</h2>
      ${b && b.some((v) => v > 0) ? timeChart({
        labels: ['40–50%', '50–60%', '60–70%', '70–80%', '80–90%', '90%+'],
        series: [{ type: 'bar', values: b, colorFn: (v, i) => ['#3d6fb8', '#3d8bfd', '#5ba3ff', '#f5c84b', '#ff9f43', '#ff5a5f'][i] }],
        yMin: 0, height: 160,
      }) + '<p class="tip">Minutes at each % of heart-rate reserve. Zones 1–3 = 40–80%, zones 4–5 = 80%+.</p>' : `<p class="muted">${b ? 'No time above 40% of heart-rate reserve: a rest day.' : 'No heart-rate data for this day.'}</p>`}
      <div class="kv" style="margin-top:8px"><div>Steps</div><div>${isNum(day.steps) ? Math.round(day.steps).toLocaleString() : '–'}</div>
      <div>Strength time</div><div>${day.strengthMin} min</div></div>
    </div>
  </div>
  <h3 class="section-title">Activities</h3>
  <div class="card">${day.workouts.length ? `<ul class="list">${day.workouts.map(activityRow).join('')}</ul>` : '<p class="muted">No logged workouts. Fitbit auto-detects walks and runs over 15 minutes, or you can log them in the app.</p>'}</div>
  <h3 class="section-title">Last 14 days: strain vs recovery</h3>
  <div class="card">${timeChart({
    labels: last.map((d) => shortDate(d.date)),
    series: [{ type: 'bar', values: last.map((d) => d.strain), color: HEX.strain }],
    yMin: 0, yMax: 21,
  })}${timeChart({
    labels: last.map((d) => shortDate(d.date)),
    series: [{ type: 'bar', values: last.map((d) => d.recovery?.score ?? null), colorFn: (v) => HEX[recoveryBand(v).key] }],
    yMin: 0, yMax: 100, height: 120,
  })}<p class="tip">Top: day strain (0–21). Bottom: next-morning recovery.</p></div>
  <p class="note">Strain = Banister TRIMP on %HRR (max HR ${c.a.maxHr} bpm${state.settings.maxHr ? ', set by you' : ', estimated'}) on a soft-capped log scale fitted to WHOOP's anchors: 1 h walk ≈ 6, 1 h run ≈ 12, marathon ≈ 20, 24 h at max HR = 21.</p>`;
}

// ----- Stress
function renderStress(c) {
  const st = c.day.stress;
  if (!st) return `<div class="card"><h2>Stress monitor</h2><p class="muted">Stress needs minute-by-minute heart rate (Google Health sync or a Fitbit export with heart_rate files) and about 14 days of baseline.</p></div>`;
  const vals = st.series.map((s) => (s.activity ? null : s.value));
  return `
  <div class="grid cols-3">
    <div class="card ring-card"><div class="label c-stress">Avg daytime stress</div>
      ${ring({ frac: (st.average ?? 0) / 3, color: HEX.stress, center: fmt(st.average, 1), unit: '/3' })}${pill(stressBand(st.average))}</div>
    <div class="card"><h2>Time in states (awake)</h2><div class="kv">
      <div>Calm (0–1)</div><div>${fmt(st.lowPct)}%</div>
      <div>Alert (1–2)</div><div>${fmt(100 - st.lowPct - st.highPct)}%</div>
      <div>Highly activated (2–3)</div><div>${fmt(st.highPct)}%</div>
      <div>High stress while asleep</div><div>${isNum(st.sleepStressPct) ? `${fmt(st.sleepStressPct, 1)}%` : '–'}</div></div></div>
    <div class="card"><h2>Tips</h2><p class="tip">Long stretches above 2 when you are not moving often mean caffeine, deadlines, illness or dehydration. Try 4-7-8 or box breathing for 3 minutes, then check the chart again.</p></div>
  </div>
  <h3 class="section-title">24-hour stress</h3>
  <div class="card">${timeChart({
    labels: st.series.map((s) => `${String(Math.floor(s.minute / 60)).padStart(2, '0')}:00`),
    series: [{ type: 'bar', values: vals, colorFn: (v) => (v >= 2 ? HEX.red : v >= 1 ? HEX.stress : HEX.green) }],
    yMin: 0, yMax: 3, yFmt: (v) => v.toFixed(1),
  })}<p class="tip">15-minute averages. Gaps are workouts or movement, which are excluded like WHOOP's motion correction. Score = heart rate above your 14-day resting level, scaled 0–3.</p></div>`;
}

// ----- Health monitor
function renderHealth(c) {
  const ranges = { hrv: [10, 150], sleepRhr: [35, 100], respRate: [8, 24], spo2: [88, 100], skinTempDelta: [-2, 2] };
  const t = c.isLatest ? c.a.hrvTrend : null;
  return `
  <div class="card"><h2>Health monitor: last night vs your normal range</h2>
    ${c.monitor.map((m) => {
      const [min, max] = ranges[m.key];
      const st = { in: '<span class="pill green">In range</span>', out: '<span class="pill red">Out of range</span>', calibrating: '<span class="pill">Calibrating</span>', nodata: '<span class="pill">No data</span>' }[m.status];
      return `<div class="metric"><div class="name">${esc(m.label)}</div><div class="impact">${isNum(m.value) ? `${m.value > 0 && m.centred ? '+' : ''}${m.value.toFixed(m.dp)} ${esc(m.unit)}` : '–'}</div>
        <div style="grid-column:1/-1">${rangeBar({ value: m.value, lo: m.lo, hi: m.hi, min, max, color: m.status === 'out' ? HEX.red : HEX.green })}</div>
        <div class="detail">${isNum(m.lo) ? `Normal ${m.lo.toFixed(m.dp)}–${m.hi.toFixed(m.dp)} ${esc(m.unit)} · ` : ''}${st}</div></div>`;
    }).join('')}
    <p class="tip">Several vitals out of range together (higher temperature, breathing rate and resting heart rate with lower HRV) often show up a day or two before you feel ill.</p>
  </div>
  ${t ? `<div class="card" style="margin-top:14px"><h2>HRV trend (7-day vs 60-day)</h2><div class="row"><div class="big">${fmt(t.avg7)}<span class="muted small"> ms</span></div>${hrvTrendPill(t)}</div>
    <p class="tip">Normal band ${fmt(t.lo)}–${fmt(t.hi)} ms (60-day mean ± 0.5 SD of ln RMSSD, HRV4Training method). If it stays below the band for days, back off training load.</p></div>` : ''}`;
}

// ----- Trends
function renderTrends(c) {
  const n = state.trendRange;
  const days = c.a.days.slice(Math.max(0, c.i - n + 1), c.i + 1);
  const labels = days.map((d) => shortDate(d.date));
  const chart = (title, values, opts = {}) => `<div class="card"><h2>${title}</h2>${timeChart({ labels, series: [{ values, color: opts.color || HEX.strain, type: opts.type, colorFn: opts.colorFn }], ...opts })}
    <p class="tip">Average ${fmt(mean(values), opts.dp ?? 0)}${opts.unit || ''}</p></div>`;
  return `
  <div class="row" style="margin-bottom:12px"><div class="seg">${[30, 90, 180].map((r) => `<button data-range="${r}" class="${r === n ? 'active' : ''}">${r}d</button>`).join('')}</div></div>
  <div class="grid cols-2">
    ${chart('Recovery', days.map((d) => d.recovery?.score ?? null), { type: 'bar', colorFn: (v) => HEX[recoveryBand(v).key], yMin: 0, yMax: 100, unit: '%' })}
    ${chart('Heart rate variability', days.map((d) => d.hrv), { color: HEX.green, unit: ' ms' })}
    ${chart('Resting heart rate (asleep)', days.map((d) => d.sleepRhr), { color: HEX.red, unit: ' bpm' })}
    ${chart('Day strain', days.map((d) => d.strain), { type: 'bar', color: HEX.strain, yMin: 0, yMax: 21, dp: 1 })}
    ${chart('Hours asleep', days.map((d) => (d.sleep ? d.sleep.asleepMin / 60 : null)), { type: 'bar', color: HEX.sleep, yMin: 0, dp: 1, unit: ' h', yFmt: (v) => v.toFixed(0) })}
    ${chart('Sleep performance', days.map((d) => d.sleepPerf?.score ?? null), { color: HEX.sleep, yMin: 0, yMax: 100, unit: '%' })}
    ${chart('Steps', days.map((d) => d.steps ?? null), { type: 'bar', color: HEX.age, yMin: 0 })}
    ${chart('Respiratory rate', days.map((d) => d.respRate), { color: HEX.stress, dp: 1, unit: ' rpm', yFmt: (v) => v.toFixed(1) })}
    ${chart('VO₂ max', days.map((d) => d.vo2max), { color: HEX.age, dp: 1, yFmt: (v) => v.toFixed(1) })}
    ${chart('Daytime stress', days.map((d) => d.stress?.average ?? null), { color: HEX.stress, yMin: 0, yMax: 3, dp: 2, yFmt: (v) => v.toFixed(1) })}
  </div>`;
}

// ----- Journal
function renderJournal(c) {
  const date = c.day.date;
  const answers = state.journal[date] || {};
  const impacts = behaviorImpacts(state.journal, c.a.byDate, c.a.latest.date)
    .sort((x, y) => (y.ready - x.ready) || Math.abs(y.impact ?? 0) - Math.abs(x.impact ?? 0));
  return `
  <div class="grid cols-2">
    <div class="card"><h2>${fmtDate(date)}: what did you do?</h2>
      ${BEHAVIORS.map((b) => {
        const v = answers[b.key];
        return `<div class="check"><span>${esc(b.label)}</span><span class="toggle">
          <button data-journal="${b.key}" data-val="1" class="${v === true ? 'on-yes' : ''}">Yes</button>
          <button data-journal="${b.key}" data-val="0" class="${v === false ? 'on-no' : ''}">No</button></span></div>`;
      }).join('')}
      <p class="tip">Answer for this day. Each answer is compared with the <em>next</em> morning's recovery.</p>
    </div>
    <div class="card"><h2>Impact on recovery (last 90 days)</h2>
      <ul class="list">${impacts.map((b) => `<li><span>${esc(b.label)}</span>${b.ready
        ? `<strong class="${b.impact >= 0 ? 'c-green' : 'c-red'}">${fmtSigned(b.impact, 0)}%</strong>`
        : `<span class="tip">${b.yesCount}/5 yes · ${b.noCount}/5 no</span>`}</li>`).join('')}</ul>
      <p class="tip">Difference in average next-day recovery between "yes" and "no" days. Needs at least 5 of each. This is a correlation, not proof of cause.</p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- settings dialog
function openSettings() {
  const s = state.settings;
  const g = state.config;
  const p = profile();
  const form = $('#settings-form');
  form.innerHTML = `
    <div class="row"><h2>Profile & data</h2><button class="icon-btn" value="close" aria-label="Close">✕</button></div>
    <div class="two">
      <label>Age<input type="number" name="age" min="16" max="100" value="${esc(s.age ?? p.age)}"/></label>
      <label>Biological sex <select name="sex"><option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option></select></label>
      <label>Max heart rate (optional)<input type="number" name="maxHr" min="120" max="230" placeholder="${state.analysis ? state.analysis.maxHr : 'auto'}" value="${esc(s.maxHr ?? '')}"/></label>
      <label>Body fat % (optional)<input type="number" step="0.1" name="bodyFatPct" min="3" max="60" placeholder="from scale" value="${esc(s.bodyFatPct ?? '')}"/></label>
      <label>Usual wake time<input type="time" name="wakeTime" value="${esc(s.wakeTime || '07:00')}"/></label>
      <label>Export intraday times are <select name="hrIsUtc"><option value="1" ${s.hrIsUtc !== false ? 'selected' : ''}>UTC (Fitbit default)</option><option value="0" ${s.hrIsUtc === false ? 'selected' : ''}>Local time</option></select></label>
    </div>
    <p class="tip">Google Health doesn't share biological sex, so set it here. It selects the VO₂max/RHR/lean-mass targets and the strain formula.</p>
    <div class="actions"><button class="btn primary" value="save">Save profile</button></div>
    <hr>
    <strong>Google Health (Fitbit) sync</strong>
    <div class="actions">
      ${g.googleConfigured
        ? (g.connected
          ? '<button class="btn" value="sync">Sync now</button><button class="btn danger" value="logout">Disconnect</button>'
          : '<a class="btn" href="/auth/login">Connect Google Health</a>')
        : '<span class="tip">Not configured. Add a Google OAuth client to <code>.env</code> and restart the server (see README).</span>'}
    </div>
    <strong>Files</strong>
    <div class="actions">
      <label class="btn">Import export folder<input type="file" id="import-dir2" webkitdirectory multiple hidden /></label>
      <label class="btn">Import files<input type="file" id="import-files" multiple accept=".json,.csv" hidden /></label>
      ${state.dataset ? '<button class="btn" value="export">Export my data</button>' : ''}
      <button class="btn" value="demo">Load demo</button>
      ${state.dataset ? '<button class="btn danger" value="clear">Clear all data</button>' : ''}
    </div>
    ${state.dataset?.warnings?.length ? `<details><summary class="tip">${state.dataset.warnings.length} import/sync warnings</summary><pre class="tip" style="white-space:pre-wrap">${esc(state.dataset.warnings.join('\n'))}</pre></details>` : ''}
  `;
  $('#settings').showModal();
}

async function onSettingsAction(action) {
  const fd = new FormData($('#settings-form'));
  if (action === 'save') {
    state.settings = {
      ...state.settings,
      age: Number(fd.get('age')) || null,
      sex: fd.get('sex'),
      maxHr: Number(fd.get('maxHr')) || null,
      bodyFatPct: fd.get('bodyFatPct') === '' ? null : Number(fd.get('bodyFatPct')),
      wakeTime: fd.get('wakeTime') || '07:00',
      hrIsUtc: fd.get('hrIsUtc') !== '0',
    };
    lsSet('settings', state.settings);
    recompute(true);
    render();
    toast('Profile saved');
  } else if (action === 'sync') await syncGoogle();
  else if (action === 'logout') {
    await fetch('/auth/logout', { method: 'POST' }).catch(() => {});
    state.config.connected = false;
    toast('Disconnected from Google Health');
  } else if (action === 'export') exportData();
  else if (action === 'demo') await loadDemo();
  else if (action === 'clear') {
    if (!confirm('Delete all data, journal and settings stored in this browser?')) return;
    await idbDel('dataset');
    localStorage.clear();
    state.dataset = null;
    state.analysis = null;
    state.journal = {};
    state.settings = { wakeTime: '07:00' };
    render();
  }
}

// ---------------------------------------------------------------- events
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action],[data-tab],[data-range],[data-journal]');
  if (!t) return;
  if (t.dataset.tab) { state.tab = t.dataset.tab; render(); window.scrollTo(0, 0); return; }
  if (t.dataset.range) { state.trendRange = Number(t.dataset.range); render(); return; }
  if (t.dataset.journal) {
    const date = state.analysis.days[state.idx].date;
    const v = t.dataset.val === '1';
    const cur = state.journal[date] || {};
    if (cur[t.dataset.journal] === v) delete cur[t.dataset.journal];
    else cur[t.dataset.journal] = v;
    state.journal[date] = cur;
    lsSet('journal', state.journal);
    render();
    return;
  }
  const a = t.dataset.action;
  if (a === 'prev-day' && state.idx > 0) { state.idx--; render(); }
  if (a === 'next-day' && state.idx < state.analysis.days.length - 1) { state.idx++; render(); }
  if (a === 'open-settings') openSettings();
  if (a === 'demo') await loadDemo();
  if (a === 'sync') await syncGoogle();
});

$('#settings-form').addEventListener('submit', async (e) => {
  const action = e.submitter?.value;
  if (action && action !== 'close') {
    e.preventDefault();
    if (action !== 'save') $('#settings').close();
    await onSettingsAction(action);
    if (action === 'save') $('#settings').close();
  }
});

document.addEventListener('change', (e) => {
  if (['import-dir', 'import-dir2', 'import-files'].includes(e.target.id)) {
    $('#settings').open && $('#settings').close();
    importFromFiles(e.target.files);
  }
  if (e.target.id === 'wake-time') {
    state.settings.wakeTime = e.target.value;
    lsSet('settings', state.settings);
    render();
  }
});

document.addEventListener('keydown', (e) => {
  if (!state.analysis || e.target.closest('input,select,textarea')) return;
  if (e.key === 'ArrowLeft' && state.idx > 0) { state.idx--; render(); }
  if (e.key === 'ArrowRight' && state.idx < state.analysis.days.length - 1) { state.idx++; render(); }
});

// ---------------------------------------------------------------- boot
(async function boot() {
  try {
    const r = await fetch('/api/config');
    if (r.ok) state.config = await r.json();
  } catch { /* static hosting: no server features */ }

  const hash = location.hash;
  if (hash.startsWith('#error=')) {
    const err = decodeURIComponent(hash.slice(7));
    toast(err === 'account_not_linked'
      ? 'Your Fitbit account isn\'t linked to Google Health yet. Open the Google Health app, sign in with Google and migrate, then try again.'
      : `Google sign-in failed: ${err}`, 9000);
    history.replaceState(null, '', '/');
  }

  const saved = await idbGet('dataset');
  if (saved?.days?.length) {
    state.dataset = saved;
    recompute(false);
  }
  render();

  if (hash === '#connected') {
    history.replaceState(null, '', '/');
    state.config.connected = true;
    await syncGoogle();
  }
})();
