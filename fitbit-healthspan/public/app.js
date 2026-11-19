import {
  analyze, recoveryBand, strainBand, sleepBand, stressBand, bedtimeFor, computeHealthspan, healthMonitor, strainTarget,
  BEHAVIORS, behaviorImpacts, isNum, mean, clamp, parseDate, addDays,
  DEVICES, WHOOP, SCORE_MAP, TIERS, FLAG_INFO, detectDevice, adaptationNotes,
  mergeSources, overridableMetrics, METRIC_LABELS, coverage,
} from './engine/index.js';
import { ring, gauge, timeChart, rangeBar } from './ui/charts.js';
import { idbGet, idbSet, idbDel, lsGet, lsSet } from './ui/store.js';
import { generateDemoMulti } from './adapters/demo.js';
import { importFiles } from './adapters/takeout.js';
import { APP } from './app.config.js';
import * as platform from './platform.js';

// ---------------------------------------------------------------- state
const state = {
  sources: {}, // group → { label, syncedAt, items: [{ id, label, device, days }], profile, warnings }
  dataset: null, // merged view: { days, primary, profile, syncedAt, warnings }
  settings: lsGet('settings', { age: null, sex: null, maxHr: null, bodyFatPct: null, wakeTime: '07:00', reminders: false, onboarded: false }),
  onboardStep: 0,
  journal: lsGet('journal', {}),
  analysis: null,
  idx: 0,
  tab: 'today',
  trendRange: 30,
  config: { available: false, connected: false },
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
const fmtSigned = (v, dp = 1) => {
  if (!isNum(v)) return '–';
  const r = Number(v.toFixed(dp));
  return `${r > 0 ? '+' : r < 0 ? '−' : '±'}${Math.abs(r).toFixed(dp)}`;
};
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
// Several sources can be connected at once (Fitbit via Google Health, every device found in Apple Health,
// a file import, or the demo). Each group holds one or more device "items"; they are merged per metric.
const GROUP_LABEL = { google: 'Fitbit / Pixel Watch (Google Health)', healthkit: 'Apple Health', import: 'Fitbit export file', demo: 'Demo data' };
const now = () => new Date().toISOString();

function allItems() {
  const off = new Set(state.settings.disabledSources || []);
  return Object.entries(state.sources).flatMap(([group, g]) => g.items.map((it) => ({ ...it, group, enabled: !off.has(it.id) })));
}

function itemLabel(id) {
  const it = allItems().find((x) => x.id === id);
  return it ? it.label : id;
}

function rebuild(keepDate = true) {
  const groups = Object.values(state.sources);
  if (!groups.length) { state.dataset = null; recompute(false); return; }
  const merged = mergeSources(allItems(), state.settings.sourcePrefs || {});
  state.dataset = merged.days.length ? {
    days: merged.days,
    primary: merged.primary,
    profile: Object.assign({}, ...groups.map((g) => g.profile || {})),
    syncedAt: groups.map((g) => g.syncedAt).sort().pop(),
    warnings: groups.flatMap((g) => g.warnings || []),
  } : null;
  recompute(keepDate);
}

function profile() {
  const s = state.settings;
  const p = state.dataset?.profile || {};
  const prim = state.dataset?.primary || {};
  const deviceOf = (id) => allItems().find((x) => x.id === id)?.device;
  return {
    device: s.device || deviceOf(prim.hrv) || deviceOf(prim.hrMinutes) || detectDevice(p.deviceName) || 'other',
    age: Number(s.age) || p.age || 35,
    sex: s.sex || p.sex || null,
    deviceSince: s.deviceSince || undefined,
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

async function persistSources() { await idbSet('sources', state.sources); }

/** Add or replace a source group. Real data replaces the demo (and its sample journal). */
async function setSource(group, data) {
  if (group !== 'demo' && state.sources.demo) {
    delete state.sources.demo;
    state.journal = {};
    lsSet('journal', {});
  }
  state.sources[group] = { label: GROUP_LABEL[group], syncedAt: now(), ...data };
  if (data.journal && !Object.keys(state.journal).length) { state.journal = data.journal; lsSet('journal', state.journal); }
  delete state.sources[group].journal;
  await persistSources();
  rebuild(true);
  render();
  updateReminders();
}

async function removeSource(group) {
  delete state.sources[group];
  if (group === 'google' && state.config.connected) { await platform.disconnect(); state.config.connected = false; }
  await persistSources();
  rebuild(false);
  render();
  updateReminders();
}

async function loadDemo() {
  const demo = generateDemoMulti();
  if (Object.keys(state.sources).some((g) => g !== 'demo')) { toast('Demo is only available when no real device is connected.'); return; }
  await setSource('demo', { items: demo.sources, profile: demo.profile, journal: demo.journal });
  toast('Demo loaded: a Fitbit Charge 6 and an Oura Ring, 210 days');
}

const setBusy = (msg) => { state.busy = msg; const b = $('#busy-msg'); if (b) b.textContent = msg; else render(); };

async function syncGoogle({ quiet = false } = {}) {
  if (!quiet) setBusy('Syncing Fitbit from Google Health… (the first sync can take a minute or two)');
  try {
    const json = await platform.sync({ days: 200, onStep: (st) => { if (!quiet) setBusy(`Syncing ${st}…`); } });
    if (!json.days.length) throw new Error(`No data returned. ${json.warnings.join('; ')}`);
    const name = json.profile?.deviceName;
    const device = detectDevice(name) && detectDevice(name) !== 'other' ? detectDevice(name) : (state.sources.google?.items[0]?.device || 'charge-6');
    await setSource('google', { items: [{ id: 'google', label: name ? `${name} (Fitbit)` : 'Fitbit', device, days: json.days }], profile: json.profile, warnings: json.warnings });
    if (!quiet) toast(json.warnings.length ? `Synced ${json.days.length} days from Fitbit (${json.warnings.length} data types unavailable)` : `Synced ${json.days.length} days from Fitbit`);
  } catch (e) {
    if (e.status === 401) state.config.connected = false;
    toast(`Fitbit sync failed: ${e.message}`, 7000);
  } finally {
    state.busy = null;
    render();
  }
}

async function connectGoogle() {
  try {
    platform.tap();
    await platform.connect();
    state.config.connected = true;
    await syncGoogle();
  } catch (e) {
    toast(e.message === 'account_not_linked'
      ? "Your Fitbit account isn't linked to Google Health yet. Open the Google Health app, sign in and finish the move, then try again."
      : `Google sign-in failed: ${e.message}`, 9000);
  }
}

async function syncHealth({ quiet = false } = {}) {
  if (!quiet) setBusy('Reading Apple Health…');
  try {
    platform.tap();
    const items = await platform.syncHealthKit({ days: 200, onStep: (st) => { if (!quiet) setBusy(st); } });
    const useful = items.filter((it) => it.days.length);
    if (!useful.length) {
      toast('No data found in Apple Health. Check access in the Health app → Sharing → Apps → Vitalspan.', 9000);
      return;
    }
    await setSource('healthkit', { items: useful });
    if (!quiet) toast(`Apple Health: found ${useful.map((i) => i.label).join(', ')}`);
  } catch (e) {
    toast(`Apple Health: ${e.message}`, 7000);
  } finally {
    state.busy = null;
    render();
  }
}

async function syncAll({ quiet = false } = {}) {
  if (state.config.connected) await syncGoogle({ quiet });
  if (state.sources.healthkit && platform.healthKitSupported()) await syncHealth({ quiet: true });
}

const canSync = () => state.config.connected || (state.sources.healthkit && platform.healthKitSupported());
const isStale = () => !state.dataset?.syncedAt || Date.now() - new Date(state.dataset.syncedAt) > 60 * 60 * 1000;

async function updateReminders() {
  const a = state.analysis;
  if (!a) return;
  const wake = state.settings.wakeTime || '07:00';
  const bed = bedtimeFor(a.tonight.totalMin, wake, a.tonight.typicalEfficiency);
  await platform.scheduleReminders({ enabled: Boolean(state.settings.reminders), bedtime: bed.bedtime, wakeTime: wake, needText: fmtH(a.tonight.totalMin) });
}

async function importFromFiles(files) {
  if (!files || !files.length) return;
  setBusy(`Reading ${files.length} files…`);
  try {
    const res = await importFiles(files, {
      maxDays: 200,
      hrIsUtc: state.settings.hrIsUtc !== false,
      onProgress: (n, total) => setBusy(`Reading files… ${n}/${total}`),
    });
    if (!res.days.length) throw new Error(res.warnings.join('; '));
    if (res.profile) state.settings = { ...state.settings, ...Object.fromEntries(Object.entries(res.profile).filter(([k, v]) => v != null && !state.settings[k] && k !== 'deviceName')) };
    const name = res.profile?.deviceName;
    await setSource('import', {
      items: [{ id: 'import', label: name ? `${name} (export)` : 'Fitbit export', device: detectDevice(name) || 'other', days: res.days }],
      profile: res.profile || {}, journal: res.journal, warnings: res.warnings,
    });
    toast(`Imported ${res.days.length} days${res.warnings.length ? ` (${res.warnings.length} warnings)` : ''}`);
  } catch (e) {
    toast(`Import failed: ${e.message}`, 7000);
  } finally {
    state.busy = null;
    render();
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify({ days: state.dataset.days, profile: profile(), journal: state.journal })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vitalspan-${state.analysis.latest.date}.healthspan.json`;
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
  $('#tabbar').hidden = !has;
  $('#datepick').hidden = !has || ['more', 'devices'].includes(state.tab);
  $('#sync-btn').hidden = !(has && canSync());
  const MORE = ['stress', 'health', 'trends', 'journal', 'devices', 'more'];
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  document.querySelectorAll('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab || (b.dataset.tab === 'more' && MORE.includes(state.tab))));
  if (state.busy) {
    view.innerHTML = `<div class="empty"><p><span class="spinner"></span> <span id="busy-msg">${esc(state.busy)}</span></p></div>`;
    return;
  }
  if (!has) { view.innerHTML = state.settings.onboarded ? renderWelcome() : renderOnboarding(); return; }
  const c = ctx();
  $('#current-date').textContent = c.isLatest ? `Today · ${fmtDate(c.day.date, { month: 'short', day: 'numeric' })}` : fmtDate(c.day.date);
  document.querySelector('[data-action="next-day"]').disabled = c.isLatest;
  document.querySelector('[data-action="prev-day"]').disabled = c.i === 0;
  const tabs = { today: renderToday, healthspan: renderHealthspan, sleep: renderSleep, strain: renderStrain, stress: renderStress, health: renderHealth, trends: renderTrends, journal: renderJournal, devices: renderDevices, more: renderMore };
  view.innerHTML = tabs[state.tab](c) + sourceFooter();
}

function sourceFooter() {
  const ds = state.dataset;
  const devices = allItems().filter((i) => i.enabled).map((i) => i.label);
  return `<p class="note">Sources: ${esc(devices.join(', '))} · ${ds.days.length} days · updated ${new Date(ds.syncedAt).toLocaleString()}.
    ${esc(APP.name)} scores are wellness estimates built from published research. They are not a medical device and not medical advice. <a href="${APP.privacyUrl}">Privacy</a></p>`;
}

function addSourceCards({ demo = true } = {}) {
  const g = state.config;
  const hkOk = platform.healthKitSupported();
  const hasHK = Boolean(state.sources.healthkit);
  const fitbitBtn = g.available
    ? (g.connected ? '<button class="btn" data-action="sync">Sync</button>' : '<button class="btn primary" data-action="connect">Connect</button>')
    : '<button class="btn" disabled>Unavailable</button>';
  const hkBtn = hkOk ? `<button class="btn ${hasHK ? '' : 'primary'}" data-action="connect-health">${hasHK ? 'Re-scan' : 'Connect'}</button>` : '<button class="btn" disabled>iPhone app</button>';
  const realConnected = Object.keys(state.sources).some((k) => k !== 'demo');
  return `
    <div class="card src-card"><div class="src-logo" style="background:#00b0b9">F</div><div><strong>Fitbit or Pixel Watch</strong><div class="tip">Sign in with the Google account your device uses (Google Health). ${g.connected ? '<b class="c-green">Connected.</b>' : ''}
      ${g.available ? '' : platform.isNative ? 'Google sign-in is not enabled in this build.' : 'Needs a Google Cloud OAuth client in <code>.env</code> (see README).'}</div></div>${fitbitBtn}</div>
    <div class="card src-card"><div class="src-logo health">♥</div><div><strong>Apple Health</strong><div class="tip">Apple Watch, plus Oura, WHOOP, Garmin, Withings, Polar, Ultrahuman and any app that shares with Apple Health. ${hasHK ? `<b class="c-green">${state.sources.healthkit.items.length} device${state.sources.healthkit.items.length === 1 ? '' : 's'} found.</b>` : ''}</div></div>${hkBtn}</div>
    <div class="card src-card"><div class="src-logo" style="background:#3d4a59">⇪</div><div><strong>Import a Fitbit export</strong><div class="tip">Google Takeout / Fitbit export files, processed on this device.</div></div>
      <label class="btn">Choose<input type="file" id="import-dir" ${platform.isNative ? '' : 'webkitdirectory'} multiple hidden /></label></div>
    ${demo && !realConnected ? `<div class="card src-card"><div class="src-logo" style="background:#2a3038">▶</div><div><strong>Try the demo</strong><div class="tip">A Fitbit Charge 6 and an Oura Ring worn together for 210 days. Shows how multiple devices merge.</div></div>
      <button class="btn" data-action="demo">Try demo</button></div>` : ''}`;
}

function renderWelcome() {
  return `<div class="empty">
    <img src="icon.svg" width="56" height="56" alt="" />
    <h1>${esc(APP.name)}</h1>
    <p>${esc(APP.tagline)}</p>
    <div class="choice">${addSourceCards()}</div>
  </div>`;
}

function renderOnboarding() {
  const s = state.settings;
  const step = state.onboardStep;
  const dots = `<div class="dots">${[0, 1, 2, 3].map((i) => `<span class="${i === step ? 'on' : ''}"></span>`).join('')}</div>`;
  if (step === 0) {
    return `<div class="onboard">
      <img src="icon.svg" width="72" height="72" alt="" />
      <h1>${esc(APP.name)}</h1>
      <p class="lead">${esc(APP.tagline)}</p>
      <ul class="features">
        <li><b class="c-green">Recovery</b> How ready your body is each morning, from HRV, resting heart rate, breathing and sleep.</li>
        <li><b class="c-strain">Strain</b> Daily cardiovascular load on a 0–21 scale, with a target for today.</li>
        <li><b class="c-sleep">Sleep</b> Your personal sleep need, performance, consistency and a bedtime planner.</li>
        <li><b class="c-age">Body Age</b> A research-based biological age and your Pace of Aging.</li>
      </ul>
      ${dots}<button class="btn primary wide" data-action="onboard-next">Get started</button></div>`;
  }
  if (step === 1) {
    return `<div class="onboard">
      <h1>Before you start</h1>
      <div class="card stack" style="text-align:left">
        <p><b>Wellness, not medicine.</b> ${esc(APP.name)} is not a medical device. It does not diagnose, treat or prevent any disease. Scores are estimates from consumer wearable data and published research, and can be wrong. Talk to a doctor about any health concern.</p>
        <p><b>Your data stays yours.</b> Health data goes directly from Google to this device and is processed here. No account, no ads, no tracking. Our servers never receive it.</p>
        <p><b>Not affiliated.</b> ${esc(APP.name)} is an independent app. It is not made or endorsed by Google, Fitbit or any wearable maker.</p>
        <label class="checkline"><input type="checkbox" id="consent" ${s.consent ? 'checked' : ''}/> I understand and agree to the <a href="${APP.termsUrl}">Terms</a> and <a href="${APP.privacyUrl}">Privacy Policy</a>.</label>
      </div>
      ${dots}<button class="btn primary wide" data-action="onboard-next" id="consent-next" ${s.consent ? '' : 'disabled'}>Continue</button></div>`;
  }
  if (step === 2) {
    return `<div class="onboard">
      <h1>About you</h1>
      <p class="tip">Used only on this device to personalise heart-rate zones and Body Age targets.</p>
      <form class="card settings-form" id="onboard-form" style="text-align:left">
        <div class="two">
          <label>Age<input type="number" name="age" min="16" max="100" required value="${esc(s.age ?? '')}"/></label>
          <label>Biological sex<select name="sex" required><option value="">Select</option><option value="female" ${s.sex === 'female' ? 'selected' : ''}>Female</option><option value="male" ${s.sex === 'male' ? 'selected' : ''}>Male</option></select></label>

          <label>Usual wake time<input type="time" name="wakeTime" value="${esc(s.wakeTime || '07:00')}"/></label>
        </div>
        ${platform.isNative ? `<label class="checkline"><input type="checkbox" name="reminders" ${s.reminders ? 'checked' : ''}/> Remind me to wind down before bed and when Recovery is ready</label>` : ''}
      </form>
      ${dots}<button class="btn primary wide" data-action="onboard-profile">Continue</button></div>`;
  }
  return `<div class="onboard">
    <h1>Connect your devices</h1>
    <p class="tip">Connect as many as you wear. ${esc(APP.name)} picks the best device for each metric, and you can change it later under More → Devices.</p>
    <div class="choice">${addSourceCards()}</div>
    ${dots}<p class="tip">Fitbit users: open the Google Health app once first so your Fitbit account has moved to your Google account.</p></div>`;
}

function renderMore() {
  const item = (tab, title, sub, color = '') => `<button class="more-item" data-tab="${tab}"><span><b class="${color}">${title}</b><span class="tip">${sub}</span></span><span class="chev">›</span></button>`;
  return `<div class="card more">
    ${item('stress', 'Stress', 'Live 0–3 stress from heart rate vs your baseline', 'c-stress')}
    ${item('health', 'Health Monitor', 'Overnight vitals vs your normal range', 'c-green')}
    ${item('trends', 'Trends', '30/90/180-day charts for every metric', 'c-strain')}
    ${item('journal', 'Journal', 'Log habits and see what moves your recovery', 'c-sleep')}
    ${item('devices', 'Devices & sources', 'Connect devices, choose a device per metric, accuracy notes', 'c-age')}
    <button class="more-item" data-action="open-settings"><span><b>Settings & data</b><span class="tip">Profile, sync, reminders, export, delete</span></span><span class="chev">›</span></button>
    <a class="more-item" href="${APP.privacyUrl}"><span><b>Privacy policy</b><span class="tip">No account, no tracking, data stays on device</span></span><span class="chev">›</span></a>
    <a class="more-item" href="${APP.termsUrl}"><span><b>Terms & medical disclaimer</b></span><span class="chev">›</span></a>
    <a class="more-item" href="mailto:${APP.supportEmail}"><span><b>Contact support</b><span class="tip">${esc(APP.supportEmail)}</span></span><span class="chev">›</span></a>
  </div>
  <p class="note">${esc(APP.name)} ${esc(APP.version)}. Not affiliated with or endorsed by Apple, Google, Fitbit, Oura, WHOOP or Garmin. Method references are listed on each screen.</p>`;
}

// ----- Today
function renderToday(c) {
  const { day } = c;
  const rec = day.recovery;
  const rb = recoveryBand(rec?.score);
  const sp = day.sleepPerf;
  const hs = c.healthspan;
  const conf = day.confidence || { recovery: { level: 'high', flags: [] }, strain: { level: 'high', flags: [] }, sleep: { level: 'high', flags: [] } };
  const recColor = rb && conf.recovery.level !== 'low' ? HEX[rb.key] : HEX.muted;
  const recCenter = rec?.score != null ? Math.round(rec.score) : '–';
  const target = c.target;
  const bed = bedtimeFor(c.tonight.totalMin, state.settings.wakeTime || '07:00', c.tonight.typicalEfficiency);
  const trend = c.isLatest ? c.a.hrvTrend : null;

  return `
  <div class="grid cols-3 rings">
    <div class="card ring-card" data-tab="sleep">
      <div class="label c-sleep">Sleep</div>
      ${ring({ frac: (sp?.score ?? 0) / 100, color: HEX.sleep, center: sp ? Math.round(sp.score) : '–', unit: '%' })}
      <div class="sub">${day.sleep ? `${fmtH(day.sleep.asleepMin)} of ${fmtH(day.sleepNeedMin)} needed` : 'No sleep recorded'}</div>
      ${pill(sleepBand(sp?.score))} ${confPill(conf.sleep)}
    </div>
    <div class="card ring-card" data-tab="health">
      <div class="label" style="color:${recColor}">Recovery</div>
      ${ring({ frac: (rec?.score ?? 0) / 100, color: recColor, center: recCenter, unit: rec?.score != null ? '%' : '' })}
      <div class="sub">${rec?.calibrating && rec?.score == null ? 'Calibrating: needs 4+ nights' : `HRV ${fmt(day.hrv)}<span class="hide-sm"> ms</span> · RHR ${fmt(day.sleepRhr)}`}</div>
      ${pill(rb)} ${confPill(conf.recovery)}
    </div>
    <div class="card ring-card" data-tab="strain">
      <div class="label c-strain">Strain</div>
      <div class="gaugebox">${gauge({ value: day.strain, min: 0, max: 21, color: HEX.strain, band: [target.lo, target.hi], label: 'Day strain' })}</div>
      <div class="sub">Target ${target.lo}–${target.hi}<span class="hide-sm"> · ${esc(target.label)}</span></div>
      ${pill(strainBand(day.strain))} ${confPill(conf.strain)}
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
      ${flagList(conf)}
      ${qualityLine(day, c.a)}
      ${trend ? `<hr><div class="row"><div>7-day HRV trend</div><div>${hrvTrendPill(trend)}</div></div>
        <p class="tip">7-day average ${fmt(trend.avg7)} ms vs your 60-day normal range ${fmt(trend.lo)}–${fmt(trend.hi)} ms.</p>` : ''}
    </div>
    <div class="card stack">
      <h2>Plan</h2>
      <div class="row"><div><strong>Strain target</strong><div class="tip">${esc(target.label)}</div></div><div class="big c-strain" style="font-size:28px">${target.lo}–${target.hi}</div></div>
      <hr>
      <div class="row"><div><strong>Sleep tonight</strong><div class="tip">Need ${fmtH(c.tonight.totalMin)} asleep · in bed by <strong>${bed.bedtime}</strong> to wake at ${esc(state.settings.wakeTime || '07:00')}</div></div><div class="big c-sleep" style="font-size:28px">${fmtH(c.tonight.totalMin)}</div></div>
      <hr>
      <div class="row"><div><strong>Body Age</strong><div class="tip">${hs.unlocked ? `${fmt(Math.abs(hs.difference), 1)} years ${hs.difference < 0 ? 'younger' : 'older'} than calendar age · Pace ${fmt(hs.pace, 1)}x` : (hs.sexKnown ? `Unlocks after 21 nights in 31 days (${hs.recoveriesLast31}/21)` : 'Set your biological sex in Settings to unlock')}</div></div>
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
      : hs.sexKnown ? `<p class="muted">Body Age unlocks after 21 nights of data in 31 days (you have ${hs.recoveriesLast31}).</p>` : '<p class="muted">Google Health doesn\'t share biological sex, and the VO₂max, resting-HR and lean-mass targets depend on it. <button class="btn" data-action="open-settings">Set it in Settings</button></p>'}
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
    <p class="tip">Following the effective-age method described in WHOOP's published 2025 Healthspan white paper, each of nine habits is compared with a health-guideline target.
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
    <div class="detail">${r.missing ? esc(r.tip) : `${unitFmt(r.value)} ${esc(r.unit)} · target ${unitFmt(r.target)}${trendTxt}`}${r.missing ? '' : `<br>${esc(r.tip)}`}${r.key === 'vo2max' && r.missing && state.analysis?.adaptation.vo2Demographic ? '<br>⚖ Left out: your Cardio Fitness Score is a demographic estimate (from resting HR, age, sex and weight), which Body Age already counts. GPS-tracked runs produce a VO₂max that counts.' : ''}</div>
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
  <p class="note">Strain = Banister TRIMP on %HRR (max HR ${c.a.maxHr} bpm${state.settings.maxHr ? ', set by you' : ', estimated'}) on a soft-capped log scale fitted to published anchors: 1 h walk ≈ 6, 1 h run ≈ 12, marathon ≈ 20, 24 h at max HR = 21.</p>`;
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
  })}<p class="tip">15-minute averages. Gaps are workouts or movement, which are excluded (motion correction). Score = heart rate above your 14-day resting level, scaled 0–3.</p></div>`;
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

function confPill(c) {
  if (!c || c.level === 'high') return '';
  return `<span class="pill" title="${esc(c.flags.map((f) => FLAG_INFO[f]?.text || f).join('; '))}">${c.level === 'low' ? 'Low confidence' : 'Medium confidence'}</span>`;
}

function flagList(conf) {
  const all = [...new Set([...conf.recovery.flags, ...conf.strain.flags, ...conf.sleep.flags])];
  if (!all.length) return '';
  return `<p class="tip" style="margin-top:10px">Confidence notes: ${all.map((f) => `<span title="${esc(f)}">${esc(FLAG_INFO[f]?.text || f)}</span>`).join(' · ')}</p>`;
}

function qualityLine(day, a) {
  const q = day.quality || {};
  const parts = [];
  const src = day.sources || {};
  const named = [['hrv', 'HRV'], ['sleep', 'Sleep'], ['hrMinutes', 'HR']].filter(([k]) => src[k]).map(([k, l]) => `${l}: ${itemLabel(src[k])}`);
  if (Object.keys(state.sources).length && allItems().filter((i) => i.enabled).length > 1) parts.push(...named);
  else parts.push(`${a.device.name}`);
  if (q.hrvSource && q.hrvSource !== 'single') parts.push(`HRV type: ${q.hrvSource === 'deep' ? 'deep-sleep RMSSD' : 'whole-night RMSSD'}`);
  if (day.sleepFallback) parts.push('sleep from backup device');
  if (q.rhrSource) parts.push(`RHR: ${q.rhrSource === 'sleep-hr' ? 'from sleep HR' : 'device-reported'}`);
  if (q.hrHours) parts.push(`${q.hrHours.toFixed(0)} h of HR data`);
  if (q.sleepStaged === false) parts.push('sleep not staged');
  const low = (q.hrHours && q.hrHours < 16) || q.sleepStaged === false;
  return `<p class="tip" style="margin-top:10px">${low ? '⚠ Lower confidence: ' : 'Data: '}${esc(parts.join(' · '))}</p>`;
}

const yes = (v, label = 'Yes') => (v ? `<span class="c-green">${label}</span>` : '<span class="muted">—</span>');

const METRIC_CHIPS = [['sleep', 'Sleep'], ['hrv', 'HRV'], ['rhr', 'Resting HR'], ['respRate', 'Breathing'], ['spo2', 'SpO₂'], ['skinTempDelta', 'Temp'], ['hrMinutes', 'Heart rate'], ['steps', 'Steps'], ['workouts', 'Workouts'], ['vo2max', 'VO₂max'], ['bodyFatPct', 'Body fat']];

function renderSources(c) {
  const items = allItems();
  const primary = state.dataset?.primary || {};
  const prefs = state.settings.sourcePrefs || {};
  const groups = Object.entries(state.sources);
  const groupCard = ([gid, g]) => `<div class="card">
    <div class="row"><div><strong>${esc(g.label || GROUP_LABEL[gid])}</strong><div class="tip">Updated ${new Date(g.syncedAt).toLocaleString()}</div></div>
      <div class="actions">${gid === 'google' && state.config.connected ? '<button class="btn" data-action="sync">Sync</button>' : ''}${gid === 'healthkit' && platform.healthKitSupported() ? '<button class="btn" data-action="connect-health">Re-scan</button>' : ''}
      <button class="btn danger" data-action="remove-source" data-group="${gid}">Remove</button></div></div>
    ${g.items.map((it) => {
      const enabled = !(state.settings.disabledSources || []).includes(it.id);
      const prof = DEVICES[it.device] || DEVICES.other;
      const chips = METRIC_CHIPS.map(([k, label]) => {
        const cov = coverage(it, k, 60);
        return cov > 0 ? `<span class="chip ${Object.values(primary).includes(it.id) && primary[k] === it.id ? 'on' : ''}">${label}${primary[k] === it.id ? ' ✓' : ''}</span>` : '';
      }).join('');
      return `<div class="device-row"><div><b>${esc(it.label)}</b> <span class="tip">${esc(prof.name)} · ${it.days.length} days</span><div class="chips">${chips || '<span class="tip">No usable data yet</span>'}</div></div>
        <button class="switch ${enabled ? 'on' : ''}" data-action="toggle-source" data-id="${esc(it.id)}" aria-label="Use ${esc(it.label)}" aria-pressed="${enabled}"></button></div>`;
    }).join('')}
  </div>`;

  const prefRows = overridableMetrics().map((m) => {
    const opts = items.filter((it) => it.enabled && coverage(it, m, 400) > 0);
    if (!opts.length) return '';
    const short = (id) => { const it = items.find((x) => x.id === id); return it ? (DEVICES[it.device] && it.device !== 'other' ? DEVICES[it.device].name : it.label) : id; };
    const auto = primary[m] && !prefs[m] ? `: ${esc(short(primary[m]))}` : '';
    return `<div class="pref-row"><span>${esc(METRIC_LABELS[m])}</span><select data-pref="${m}">
      <option value="">Automatic${auto}</option>
      ${opts.map((it) => `<option value="${esc(it.id)}" ${prefs[m] === it.id ? 'selected' : ''}>${esc(short(it.id))}</option>`).join('')}
    </select></div>`;
  }).join('');

  return `
  <h3 class="section-title" style="margin-top:4px">Connected devices</h3>
  <div class="stack">${groups.map(groupCard).join('') || '<div class="card"><p class="muted">No devices connected.</p></div>'}</div>
  ${items.filter((i) => i.enabled).length > 1 ? `<h3 class="section-title">Which device is used for each metric</h3>
  <div class="card">${prefRows}
    <p class="tip">Automatic picks the device with the best recent coverage (rings and bands are preferred overnight). Overnight vitals always come from one device, never mixed night-to-night, so your baselines stay consistent. Steps use the highest count, duplicate workouts are merged, and gaps in heart rate are filled from your other devices.</p></div>` : ''}
  <h3 class="section-title">Add a device</h3>
  <div class="choice" style="margin-top:0">${addSourceCards({ demo: false })}</div>`;
}

function renderDevices(c) {
  const a = c.a;
  const dev = a.device;
  const chips = [
    ['GPS', dev.gps], ['SpO₂', dev.spo2], ['ECG', dev.ecg], ['Continuous EDA', dev.eda === 'continuous'], ['EDA scan', dev.eda === 'scan'], ['Screen', dev.display],
  ].map(([k, v]) => `<span class="pill ${v ? 'green' : ''}" style="${v ? '' : 'opacity:.55'}">${v ? '✓' : '✕'} ${k}</span>`).join(' ');
  const rows = [
    ['Heart-rate sampling', '1 s during exercise, about every 5-15 s at rest (developer reports)', 'Continuous PPG, about 26 Hz on 5.0/MG (WHOOP claim)', 'Fitbit minute data is fine for strain and zones but too coarse for beat-to-beat HRV during the day.'],
    ['HRV', 'RMSSD from 5-min windows in the main sleep (>3 h). Nightly and deep-sleep values.', 'RMSSD in 5-min windows stepping every 30 s over the night, weighted to slow-wave and late sleep', 'WHOOP 4.0 vs ECG: CCC 0.94, error 8.2% (Dial 2025). Fitbit Versa 4 pilot: about 8% high vs ECG (n=8). No study has worn both on the same people, so no fixed conversion exists.'],
    ['Resting HR', 'Daily value from awake + sleep data', 'Measured during sleep', 'WHOOP 4.0 bias −1.4 bpm. Fitbit Charge 2 −1.1 bpm at rest.'],
    ['Respiratory rate', 'During deep sleep (light-sleep fallback)', 'During sleep', 'Fitbit error ~0.46 breaths/min. WHOOP bias 1.8% vs PSG.'],
    ['Skin temperature', 'Nightly change vs personal baseline. Dedicated sensor on Sense 2, Edge and Pixel Watch; device sensor on Air.', 'Nightly change vs baseline', 'Not independently validated for either.'],
    ['SpO₂', 'Nightly average (red/IR)', 'During sleep', 'Not independently validated for either.'],
    ['Sleep stages', '4 stages', '4 stages', 'Agreement with a sleep lab (κ): Fitbit Sense 0.42, Charge 5 0.41, WHOOP 4.0 0.37 (Schyvens 2025). All under-detect wake (29-52%).'],
    ['Exercise HR', 'Wrist PPG (multipath on Pixel Watch 2+)', 'Wrist/bicep PPG', 'Error: Pixel Watch 3 2.7%, Charge 6 5.5%, Pixel Watch 2 6.7%. No independent WHOOP 4.0/5.0 study.'],
    ['HR zones', 'AZM: fat burn / cardio / peak on heart-rate reserve; cardio and peak count double', '5 zones on % heart-rate reserve; max HR auto-updates', 'Not interchangeable; this app recomputes WHOOP zones from raw HR.'],
    ['VO₂max', 'Cardio Fitness Score from RHR, age, sex and weight, refined by GPS runs', 'Estimated from strain, zones and recovery; needs 14 recoveries in 21 days', 'Neither independently validated.'],
    ['Wear and battery', 'Wrist only; 5-10 days on bands, ~1-1.5 days on Pixel Watch', 'Wrist, bicep or apparel; 4-5 days (4.0), 14+ days (5.0/MG)', ''],
    ['Cost', 'One-off device ($99-$249) plus optional Google Health Premium ($9.99/mo)', 'Membership $199-$359/yr, hardware included', ''],
  ];
  return `${renderSources(c)}
  <h3 class="section-title">Main device: how its data is adapted</h3>
  <div class="grid cols-2">
    <div class="card">
      <h2>Main device</h2>
      <div class="row"><div><div style="font-size:22px;font-weight:800">${esc(dev.name)}</div><div class="tip">${esc([dev.launch && `Launched ${dev.launch}`, dev.batteryDays && `~${dev.batteryDays} day battery`, dev.price].filter(Boolean).join(' · '))}</div></div>
      <button class="btn" data-action="open-settings">Change</button></div>
      <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">${chips}</div>
      <p class="tip"><strong>Tier ${esc(dev.tier)}</strong>: ${esc(TIERS[dev.tier] || '')}</p>
      ${a.adaptation.deviceSince ? `<p class="tip">Using this tracker since ${esc(a.adaptation.deviceSince)}: older nights are rescaled to it.</p>` : ''}
      <p class="tip">Skin temperature: ${dev.skinTemp === 'dedicated' ? 'dedicated sensor' : dev.skinTemp === 'device' ? 'device temperature sensor (relative change only)' : 'nightly variation'} · VO₂max: ${dev.vo2 === 'gps' ? 'refined by GPS runs' : 'demographic estimate (no GPS)'}</p>
      ${dev.notes ? `<p class="tip">${esc(dev.notes)}</p>` : ''}
      ${dev.verified === false ? '<p class="tip">⚠ Some specs for this model come from secondary sources and aren\'t fully verified.</p>' : ''}
    </div>
    <div class="card">
      <h2>How this app adapts your Fitbit data</h2>
      <ul class="list">${adaptationNotes(dev.id).map((n) => `<li style="display:block"><strong>${esc(n.area)}</strong><div class="tip">${esc(n.rule)}</div></li>`).join('')}</ul>
      <p class="tip">Currently: HRV series = <strong>${esc(a.adaptation.hrvSource)}</strong>${a.adaptation.hrvSource === 'deep' ? ` (${Math.round(a.adaptation.deepShare * 100)}% of nights)` : ''} · VO₂max in Body Age: ${a.adaptation.vo2Demographic ? 'excluded (demographic estimate)' : 'run-based values only'} · max HR ${a.maxHr} bpm (${a.adaptation.maxHrSource}).</p>
    </div>
  </div>

  <details class="card fold"><summary><strong>Measurement compared: Fitbit vs a dedicated recovery band</strong></summary><div style="overflow-x:auto;margin-top:10px"><table class="table">
    <thead><tr><th>Signal</th><th>Fitbit / Pixel Watch</th><th>WHOOP (for comparison)</th><th>Accuracy evidence</th></tr></thead>
    <tbody>${rows.map((r) => `<tr><td><strong>${esc(r[0])}</strong></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td class="tip">${esc(r[3])}</td></tr>`).join('')}</tbody>
  </table></div>

  </details>
  <details class="card fold"><summary><strong>Fitbit's own scores compared</strong></summary><div style="overflow-x:auto;margin-top:10px"><table class="table">
    <thead><tr><th>Fitbit / Google Health</th><th>WHOOP</th><th>Difference</th></tr></thead>
    <tbody>${SCORE_MAP.map((r) => `<tr><td>${esc(r.fitbit)}</td><td>${esc(r.whoop)}</td><td class="tip">${esc(r.diff)}</td></tr>`).join('')}</tbody>
  </table>
  <p class="tip">Fitbit's own Readiness, Sleep Score and Cardio Load are not available through the Google Health API, so this app calculates its own scores from the raw signals instead.</p></div>

  </details>
  <details class="card fold"><summary><strong>Device capability table</strong></summary><div style="overflow-x:auto;margin-top:10px"><table class="table">
    <thead><tr><th>Device</th><th>Screen</th><th>GPS</th><th>SpO₂</th><th>Skin temp</th><th>EDA</th><th>ECG</th><th>Battery</th></tr></thead>
    <tbody>${Object.entries(DEVICES).filter(([id]) => id !== 'other').map(([id, d]) => `<tr${id === dev.id ? ' style="background:var(--surface-2)"' : ''}>
      <td><strong>${esc(d.name)}</strong>${d.verified === false ? ' <span class="tip">*</span>' : ''}</td><td>${yes(d.display)}</td><td>${yes(d.gps)}</td><td>${yes(d.spo2)}</td>
      <td>${esc(!d.skinTemp ? '—' : d.skinTemp === 'dedicated' ? 'sensor' : d.skinTemp === 'device' ? 'device' : 'variation')}</td><td>${esc(d.eda || '—')}</td><td>${yes(d.ecg)}</td><td>${d.batteryDays} d</td></tr>`).join('')}
      <tr><td><strong>${esc(WHOOP.name)}</strong></td><td>${yes(false)}</td><td>${yes(false)}</td><td>${yes(true)}</td><td>sensor</td><td>—</td><td>MG only</td><td>4-14+ d</td></tr>
    </tbody>
  </table><p class="tip">* specs from secondary sources, not fully verified. WHOOP: ${esc(WHOOP.sensors)}. ${esc(WHOOP.price)}.</p></div>
  </details>`;
}

// ---------------------------------------------------------------- settings dialog
function openSettings() {
  const s = state.settings;
  const g = state.config;
  const p = profile();
  const form = $('#settings-form');
  const native = platform.isNative;
  form.innerHTML = `
    <div class="row"><h2>Profile & data</h2><button class="icon-btn" value="close" aria-label="Close">✕</button></div>
    <div class="two">
      <label>Age<input type="number" name="age" min="16" max="100" value="${esc(s.age ?? p.age)}"/></label>
      <label>Biological sex <select name="sex"><option value="" ${!p.sex ? 'selected' : ''}>Not set</option><option value="male" ${p.sex === 'male' ? 'selected' : ''}>Male</option><option value="female" ${p.sex === 'female' ? 'selected' : ''}>Female</option></select></label>
      <label>Max heart rate (optional)<input type="number" name="maxHr" min="120" max="230" placeholder="${state.analysis ? state.analysis.maxHr : 'auto'}" value="${esc(s.maxHr ?? '')}"/></label>
      <label>Body fat % (optional)<input type="number" step="0.1" name="bodyFatPct" min="3" max="60" placeholder="from scale" value="${esc(s.bodyFatPct ?? '')}"/></label>
      <label>Main device (device-specific rules)<select name="device"><option value="" ${!s.device ? 'selected' : ''}>Automatic (${esc((DEVICES[p.device] || DEVICES.other).name)})</option>${Object.entries(DEVICES).map(([id, d]) => `<option value="${id}" ${s.device === id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>
      <label>Using this tracker since (optional)<input type="date" name="deviceSince" value="${esc(s.deviceSince || '')}"/></label>
      <label>Usual wake time<input type="time" name="wakeTime" value="${esc(s.wakeTime || '07:00')}"/></label>
      <label>Export intraday times are <select name="hrIsUtc"><option value="1" ${s.hrIsUtc !== false ? 'selected' : ''}>UTC (Fitbit default)</option><option value="0" ${s.hrIsUtc === false ? 'selected' : ''}>Local time</option></select></label>
    </div>
    <p class="tip">Google Health doesn't share biological sex, so set it here. It selects the VO₂max/RHR/lean-mass targets and the strain formula.</p>
    <div class="actions"><button class="btn primary" value="save">Save profile</button></div>
    <hr>
    <strong>Google Health (Fitbit) sync</strong>
    <div class="actions">
      ${g.available
        ? (g.connected
          ? '<button class="btn" value="sync">Sync now</button><button class="btn danger" value="logout">Disconnect</button>'
          : '<button class="btn" value="connect">Connect Google Health</button>')
        : `<span class="tip">${native ? 'Google sign-in is not enabled in this build.' : 'Not configured. Add a Google OAuth client to <code>.env</code> and restart the server (see README).'}</span>`}
    </div>
    <strong>Apple Health</strong>
    <div class="actions">${platform.healthKitSupported() ? `<button class="btn" value="health">${state.sources.healthkit ? 'Re-scan Apple Health' : 'Connect Apple Health'}</button>` : '<span class="tip">Available in the iPhone app.</span>'}
      <button class="btn" value="devices">Devices & sources</button></div>
    ${native ? `<label class="checkline"><input type="checkbox" name="reminders" ${s.reminders ? 'checked' : ''}/> Bedtime and morning reminders</label>` : ''}
    <strong>Files</strong>
    <div class="actions">
      ${native ? '' : '<label class="btn">Import export folder<input type="file" id="import-dir2" webkitdirectory multiple hidden /></label>'}
      <label class="btn">Import files<input type="file" id="import-files" multiple accept=".json,.csv" hidden /></label>
      ${state.dataset ? '<button class="btn" value="export">Export my data</button>' : ''}
      <button class="btn" value="demo">Load demo</button>
      <button class="btn danger" value="clear">Delete all data</button>
    </div>
    <p class="tip"><a href="${APP.privacyUrl}">Privacy policy</a> · <a href="${APP.termsUrl}">Terms</a> · ${esc(APP.name)} ${esc(APP.version)}</p>
    ${state.dataset?.warnings?.length ? `<details><summary class="tip">${state.dataset.warnings.length} import/sync warnings</summary><pre class="tip" style="white-space:pre-wrap">${esc(state.dataset.warnings.join('\n'))}</pre></details>` : ''}
  `;
  $('#settings').showModal();
}

async function onSettingsAction(action) {
  const fd = new FormData($('#settings-form'));
  const native = platform.isNative;
  if (action === 'save') {
    state.settings = {
      ...state.settings,
      age: Number(fd.get('age')) || null,
      sex: fd.get('sex') || null,
      maxHr: Number(fd.get('maxHr')) || null,
      bodyFatPct: fd.get('bodyFatPct') === '' ? null : Number(fd.get('bodyFatPct')),
      wakeTime: fd.get('wakeTime') || '07:00',
      device: fd.get('device') || null,
      deviceSince: fd.get('deviceSince') || ((fd.get('device') && state.analysis && fd.get('device') !== state.analysis.device.id && state.settings.device)
        ? state.analysis.latest.date : state.settings.deviceSince || null),
      hrIsUtc: fd.get('hrIsUtc') !== '0',
      reminders: native ? fd.get('reminders') === 'on' : state.settings.reminders,
    };
    if (state.settings.reminders) await platform.requestNotificationPermission();
    lsSet('settings', state.settings);
    recompute(true);
    render();
    updateReminders();
    toast('Profile saved');
  } else if (action === 'sync') await syncAll();
  else if (action === 'health') await syncHealth();
  else if (action === 'devices') { state.tab = 'devices'; render(); window.scrollTo(0, 0); }
  else if (action === 'connect') await connectGoogle();
  else if (action === 'logout') {
    await platform.disconnect();
    state.config.connected = false;
    render();
    toast('Disconnected and access revoked');
  } else if (action === 'export') exportData();
  else if (action === 'demo') await loadDemo();
  else if (action === 'clear') {
    if (!confirm(`Delete all health data, journal and settings from this device${state.config.connected ? ' and revoke Google access' : ''}? This cannot be undone.`)) return;
    if (state.config.connected) await platform.disconnect();
    await idbDel('dataset');
    await idbDel('sources');
    localStorage.clear();
    state.sources = {};
    state.dataset = null;
    state.analysis = null;
    state.journal = {};
    state.config.connected = false;
    state.settings = { wakeTime: '07:00', onboarded: false };
    state.onboardStep = 0;
    await platform.scheduleReminders({ enabled: false });
    render();
    toast('All data deleted');
  }
}

// ---------------------------------------------------------------- events
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-action],[data-tab],[data-range],[data-journal]');
  if (!t) return;
  if (t.dataset.tab) { platform.tap(); state.tab = t.dataset.tab; render(); window.scrollTo(0, 0); return; }
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
  if (a === 'sync') await syncAll();
  if (a === 'connect-health') await syncHealth();
  if (a === 'remove-source') { if (confirm(`Remove ${GROUP_LABEL[t.dataset.group] || 'this source'} and its data from this device?`)) await removeSource(t.dataset.group); }
  if (a === 'toggle-source') {
    const off = new Set(state.settings.disabledSources || []);
    off.has(t.dataset.id) ? off.delete(t.dataset.id) : off.add(t.dataset.id);
    state.settings.disabledSources = [...off];
    lsSet('settings', state.settings);
    rebuild(true); render();
  }
  if (a === 'connect') await connectGoogle();
  if (a === 'onboard-next') { platform.tap(); state.onboardStep++; render(); window.scrollTo(0, 0); }
  if (a === 'onboard-profile') {
    const f = $('#onboard-form');
    if (!f.reportValidity()) return;
    const fd = new FormData(f);
    state.settings = {
      ...state.settings,
      age: Number(fd.get('age')), sex: fd.get('sex'), wakeTime: fd.get('wakeTime') || '07:00',
      reminders: fd.get('reminders') === 'on', onboarded: true,
    };
    if (state.settings.reminders) await platform.requestNotificationPermission();
    lsSet('settings', state.settings);
    state.onboardStep = 3;
    render();
  }
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
  if (e.target.dataset && e.target.dataset.pref) {
    const prefs = { ...(state.settings.sourcePrefs || {}) };
    if (e.target.value) prefs[e.target.dataset.pref] = e.target.value; else delete prefs[e.target.dataset.pref];
    state.settings.sourcePrefs = prefs;
    lsSet('settings', state.settings);
    rebuild(true);
    render();
    toast('Source updated: scores recalculated');
  }
  if (e.target.id === 'consent') {
    state.settings.consent = e.target.checked;
    lsSet('settings', state.settings);
    $('#consent-next').disabled = !e.target.checked;
  }
  if (e.target.id === 'wake-time') {
    state.settings.wakeTime = e.target.value;
    lsSet('settings', state.settings);
    render();
    updateReminders();
  }
});

// Pull down at the top of the page to sync.
let pullStart = null;
document.addEventListener('touchstart', (e) => { pullStart = window.scrollY <= 0 ? e.touches[0].clientY : null; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (pullStart == null || !canSync() || state.busy) return;
  if (e.changedTouches[0].clientY - pullStart > 110) { platform.tap(); syncAll(); }
  pullStart = null;
}, { passive: true });

document.addEventListener('keydown', (e) => {
  if (!state.analysis || e.target.closest('input,select,textarea')) return;
  if (e.key === 'ArrowLeft' && state.idx > 0) { state.idx--; render(); }
  if (e.key === 'ArrowRight' && state.idx < state.analysis.days.length - 1) { state.idx++; render(); }
});

// ---------------------------------------------------------------- boot
(async function boot() {
  await platform.initNative();
  document.title = APP.name;
  $('#brand-name').textContent = APP.name;
  state.config = await platform.connectionStatus();

  const hash = location.hash;
  if (hash.startsWith('#error=')) {
    const err = decodeURIComponent(hash.slice(7));
    toast(err === 'account_not_linked'
      ? "Your Fitbit account isn't linked to Google Health yet. Open the Google Health app, sign in with Google and migrate, then try again."
      : `Google sign-in failed: ${err}`, 9000);
    history.replaceState(null, '', '/');
  }

  state.sources = (await idbGet('sources')) || {};
  const legacy = await idbGet('dataset'); // pre-multi-device single dataset → migrate to a source group
  if (legacy?.days?.length && !Object.keys(state.sources).length) {
    const group = ['google', 'import', 'demo'].includes(legacy.source) ? legacy.source : 'import';
    state.sources[group] = { label: GROUP_LABEL[group], syncedAt: legacy.syncedAt, profile: legacy.profile, warnings: legacy.warnings,
      items: [{ id: group === 'demo' ? 'demo:charge-6' : group, label: legacy.profile?.deviceName || GROUP_LABEL[group], device: detectDevice(legacy.profile?.deviceName) || 'charge-6', days: legacy.days }] };
    await persistSources();
    await idbDel('dataset');
  }
  if (Object.keys(state.sources).length) {
    if (!state.settings.onboarded) { state.settings.onboarded = true; lsSet('settings', state.settings); }
    rebuild(false);
  }
  render();
  await platform.hideSplash();
  updateReminders();

  if (hash === '#connected') {
    history.replaceState(null, '', '/');
    state.config.connected = true;
    state.settings.onboarded = true;
    lsSet('settings', state.settings);
    await syncGoogle();
  } else if (canSync() && isStale()) {
    syncAll({ quiet: Boolean(state.dataset) });
  }
  platform.onResume(() => { if (canSync() && isStale() && !state.busy) syncAll({ quiet: true }); });
})();
