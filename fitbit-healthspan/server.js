// Zero-dependency server: serves the app and brokers Google Health API OAuth + data sync.
// Tokens stay on this machine (.data/tokens.json); the browser never sees them.

import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as gh from './lib/googleHealth.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DATA = path.join(ROOT, '.data');
const TOKENS = path.join(DATA, 'tokens.json');

// Minimal .env loader (KEY=value lines).
if (existsSync(path.join(ROOT, '.env'))) {
  for (const line of readFileSync(path.join(ROOT, '.env'), 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`;
const configured = Boolean(CLIENT_ID && CLIENT_SECRET);

const pending = new Map(); // state → PKCE verifier
let tokens = null;
try { tokens = JSON.parse(readFileSync(TOKENS, 'utf8')); } catch { /* not connected yet */ }

async function saveTokens(t) {
  tokens = t;
  await fs.mkdir(DATA, { recursive: true });
  await fs.writeFile(TOKENS, JSON.stringify(t, null, 2), { mode: 0o600 });
}

async function accessToken() {
  if (!tokens) throw Object.assign(new Error('Not connected to Google Health'), { status: 401 });
  if (gh.isExpired(tokens)) {
    try {
      await saveTokens(await gh.refresh({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, tokens }));
    } catch (e) {
      // Refresh tokens expire after 7 days while the OAuth app is in "Testing" mode.
      tokens = null;
      await fs.rm(TOKENS, { force: true });
      throw Object.assign(new Error(`Session expired, please reconnect (${e.message})`), { status: 401 });
    }
  }
  return tokens.access_token;
}

const client = new gh.Client(accessToken);

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

function send(res, status, body, headers = {}) {
  const isObj = typeof body === 'object' && !Buffer.isBuffer(body);
  res.writeHead(status, { 'content-type': isObj ? 'application/json' : 'text/plain; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(isObj ? JSON.stringify(body) : body);
}

async function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  try {
    const data = await fs.readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(data);
  } catch {
    send(res, 404, 'Not found');
  }
}

const routes = {
  'GET /api/config': () => ({ googleConfigured: configured, connected: Boolean(tokens), redirectUri: REDIRECT_URI }),

  'GET /auth/login': (req, res) => {
    if (!configured) return send(res, 400, 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env first (see README).');
    const state = crypto.randomBytes(16).toString('hex');
    const { verifier, challenge } = gh.pkcePair();
    pending.set(state, verifier);
    setTimeout(() => pending.delete(state), 10 * 60 * 1000).unref();
    res.writeHead(302, { location: gh.authUrl({ clientId: CLIENT_ID, redirectUri: REDIRECT_URI, state, challenge }) });
    res.end();
  },

  'GET /auth/callback': async (req, res, url) => {
    const state = url.searchParams.get('state');
    const verifier = pending.get(state);
    pending.delete(state);
    if (url.searchParams.get('error')) return redirect(res, `/#error=${encodeURIComponent(url.searchParams.get('error'))}`);
    if (!verifier) return redirect(res, '/#error=invalid_state');
    try {
      const t = await gh.exchangeCode({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, redirectUri: REDIRECT_URI, code: url.searchParams.get('code'), verifier });
      await saveTokens(t);
      try {
        await client.call('/identity');
      } catch (e) {
        if (e.reason === 'ACCOUNT_NOT_LINKED' || /ACCOUNT_NOT_LINKED/.test(e.message)) return redirect(res, '/#error=account_not_linked');
        throw e;
      }
      redirect(res, '/#connected');
    } catch (e) {
      redirect(res, `/#error=${encodeURIComponent(e.message)}`);
    }
  },

  'POST /auth/logout': async () => {
    if (tokens?.access_token) fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, { method: 'POST' }).catch(() => {});
    tokens = null;
    await fs.rm(TOKENS, { force: true });
    return { ok: true };
  },

  'GET /api/sync': async (req, res, url) => {
    const days = Math.min(400, Math.max(14, Number(url.searchParams.get('days') || 180)));
    const tz = url.searchParams.get('tz') || 'UTC';
    const started = Date.now();
    const result = await gh.syncDays(client, { days, tz, onStep: (s) => console.log(`[sync] ${s}`) });
    console.log(`[sync] ${result.days.length} days in ${((Date.now() - started) / 1000).toFixed(1)} s, ${result.warnings.length} warnings`);
    return result;
  },

  // Debug helper: inspect raw API payloads for one data type (useful if Google changes field names).
  'GET /api/raw': async (req, res, url) => {
    const type = url.searchParams.get('type') || 'daily-resting-heart-rate';
    const json = await client.call(`/dataTypes/${type}/dataPoints`, { query: { pageSize: Number(url.searchParams.get('n') || 3) } });
    return json;
  },
};

function redirect(res, location) {
  res.writeHead(302, { location });
  res.end();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const handler = routes[`${req.method} ${url.pathname}`];
  if (!handler) return req.method === 'GET' ? serveStatic(req, res, url.pathname) : send(res, 404, 'Not found');
  try {
    const out = await handler(req, res, url);
    if (out !== undefined && !res.headersSent) send(res, 200, out);
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, e.status || 500, { error: e.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Healthspan running at http://localhost:${PORT}`);
  console.log(configured ? `Google Health OAuth ready (redirect URI: ${REDIRECT_URI})` : 'Google Health not configured: demo + Takeout import still work. See README to connect.');
});
