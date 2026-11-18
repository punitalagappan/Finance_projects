// Platform layer: the same UI runs as a native iOS app (Capacitor) or in a browser (with server.js).
//
// Native iOS: everything happens on the phone. Google sign-in uses the installed-app OAuth flow
// (PKCE + reversed-client-ID redirect, no client secret), tokens live in the iOS Keychain
// (not synced to iCloud), and the app calls the Google Health API directly. No developer server
// ever sees health data.
// Web: OAuth and sync are brokered by server.js (tokens stay on that machine).

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import * as gh from './lib/googleHealth.js';
import { APP, iosRedirect } from './app.config.js';

export const isNative = Capacitor.isNativePlatform();
const TOKEN_KEY = 'google_tokens';

// ---------------------------------------------------------------- app chrome
export async function initNative() {
  if (!isNative) return;
  document.documentElement.classList.add('native');
  try { await SecureStorage.setSynchronize(false); } catch { /* keep tokens device-only */ }
  try { await StatusBar.setStyle({ style: Style.Dark }); } catch { /* ignore */ }
}

export async function hideSplash() {
  if (isNative) try { await SplashScreen.hide(); } catch { /* ignore */ }
}

export function tap() {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export function onResume(cb) {
  if (isNative) App.addListener('resume', cb);
  else document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') cb(); });
}

// ---------------------------------------------------------------- tokens (native)
async function loadTokens() {
  try { return (await SecureStorage.get(TOKEN_KEY)) || null; } catch { return null; }
}
async function saveTokens(t) { await SecureStorage.set(TOKEN_KEY, t, false, false); }
async function clearTokens() { try { await SecureStorage.remove(TOKEN_KEY, false); } catch { /* ignore */ } }

async function nativeAccessToken() {
  let t = await loadTokens();
  if (!t) throw Object.assign(new Error('Not connected to Google Health'), { status: 401 });
  if (gh.isExpired(t)) {
    try {
      t = await gh.refresh({ clientId: APP.googleIosClientId, tokens: t });
      await saveTokens(t);
    } catch (e) {
      await clearTokens();
      throw Object.assign(new Error(`Session expired. Please reconnect (${e.message}).`), { status: 401 });
    }
  }
  return t.access_token;
}

// ---------------------------------------------------------------- connection API used by the UI
export async function connectionStatus() {
  if (isNative) return { available: Boolean(APP.googleIosClientId), connected: Boolean(await loadTokens()) };
  try {
    const r = await fetch('/api/config');
    if (!r.ok) throw new Error();
    const c = await r.json();
    return { available: c.googleConfigured, connected: c.connected };
  } catch {
    return { available: false, connected: false };
  }
}

/** Starts Google sign-in. Native: resolves once tokens are stored. Web: navigates away. */
export async function connect() {
  if (!isNative) { location.href = '/auth/login'; return new Promise(() => {}); }
  const redirect = iosRedirect();
  if (!redirect) throw new Error('Google sign-in is not configured in this build.');
  const { verifier, challenge } = await gh.pkcePair();
  const state = gh.randomString(16);

  return new Promise(async (resolve, reject) => {
    let settled = false;
    const done = async (fn, arg) => {
      if (settled) return;
      settled = true;
      await urlHandle.remove();
      await closeHandle.remove();
      fn(arg);
    };
    const urlHandle = await App.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith(redirect.scheme)) return;
      Browser.close().catch(() => {});
      try {
        const params = new URLSearchParams(url.split('?')[1] || '');
        if (params.get('error')) throw new Error(params.get('error') === 'access_denied' ? 'Access was not granted.' : params.get('error'));
        if (params.get('state') !== state) throw new Error('Sign-in state mismatch. Please try again.');
        const tokens = await gh.exchangeCode({ clientId: APP.googleIosClientId, redirectUri: redirect.uri, code: params.get('code'), verifier });
        await saveTokens(tokens);
        const client = new gh.Client(nativeAccessToken);
        try {
          await client.call('/identity');
        } catch (e) {
          if (/ACCOUNT_NOT_LINKED/.test(`${e.reason} ${e.message}`)) throw new Error('account_not_linked');
          throw e;
        }
        done(resolve);
      } catch (e) {
        done(reject, e);
      }
    });
    const closeHandle = await Browser.addListener('browserFinished', () => {
      setTimeout(() => done(reject, new Error('Sign-in was cancelled.')), 800);
    });
    await Browser.open({ url: gh.authUrl({ clientId: APP.googleIosClientId, redirectUri: redirect.uri, state, challenge }), presentationStyle: 'popover' });
  });
}

export async function disconnect() {
  if (isNative) {
    const t = await loadTokens();
    if (t?.access_token) gh.revoke(t.refresh_token || t.access_token);
    await clearTokens();
    return;
  }
  await fetch('/auth/logout', { method: 'POST' }).catch(() => {});
}

/** Pull the last `days` of data. Returns { days, profile, warnings }. */
export async function sync({ days = 200, onStep } = {}) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (isNative) return gh.syncDays(new gh.Client(nativeAccessToken), { days, tz, onStep });
  const res = await fetch(`/api/sync?days=${days}&tz=${encodeURIComponent(tz)}`);
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.error || res.statusText), { status: res.status });
  return json;
}

// ---------------------------------------------------------------- reminders (native local notifications)
const REMINDER_IDS = [101, 102];
const hm = (s) => s.split(':').map(Number);

export async function notificationsSupported() { return isNative; }

export async function requestNotificationPermission() {
  if (!isNative) return false;
  const p = await LocalNotifications.requestPermissions();
  return p.display === 'granted';
}

/**
 * Daily reminders: wind-down 30 min before the recommended bedtime, and a morning check-in after waking.
 * Re-scheduled every time the app computes a new bedtime.
 */
export async function scheduleReminders({ enabled, bedtime, wakeTime, needText }) {
  if (!isNative) return;
  try {
    await LocalNotifications.cancel({ notifications: REMINDER_IDS.map((id) => ({ id })) });
    if (!enabled) return;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    const [bh, bm] = hm(bedtime);
    const wind = (((bh * 60 + bm - 30) % 1440) + 1440) % 1440;
    const [wh, wm] = hm(wakeTime);
    const morning = (wh * 60 + wm + 20) % 1440;
    await LocalNotifications.schedule({
      notifications: [
        { id: 101, title: 'Time to wind down', body: `Aim to be in bed by ${bedtime}${needText ? ` · tonight's sleep need ${needText}` : ''}.`, schedule: { on: { hour: Math.floor(wind / 60), minute: wind % 60 }, allowWhileIdle: true } },
        { id: 102, title: 'Your Recovery is ready', body: 'Sync to see how ready you are today and your strain target.', schedule: { on: { hour: Math.floor(morning / 60), minute: morning % 60 }, allowWhileIdle: true } },
      ],
    });
  } catch (e) {
    console.warn('Could not schedule reminders', e);
  }
}
