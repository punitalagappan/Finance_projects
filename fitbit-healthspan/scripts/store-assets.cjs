// Generates App Store assets from the real app (demo data):
//   store/icon-1024.png, ios AppIcon + Splash, store/screenshots/6.9in/*.jpg (1320×2868, iPhone 16/17 Pro Max)
// Requires: `npm run build`, a running `node server.js` on PORT (default 8787) and Playwright with Chromium.
// Afterwards run `python3 scripts/flatten.py` to strip alpha channels (Apple rejects icons with alpha).
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const BASE = `http://localhost:${process.env.PORT || 8787}`;
const OUT = path.join(ROOT, 'store');
const SHOTS = path.join(OUT, 'screenshots', '6.9in');
fs.mkdirSync(SHOTS, { recursive: true });

const ICON_SVG = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#151b23"/><stop offset="1" stop-color="#07090c"/></linearGradient>
    <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36d6c3"/><stop offset="1" stop-color="#2bd47d"/></linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="512" r="300" fill="none" stroke="#232a33" stroke-width="72"/>
  <path d="M512 212a300 300 0 0 1 289 381" fill="none" stroke="url(#arc)" stroke-width="72" stroke-linecap="round"/>
  <path d="M322 530h96l52-120 84 230 50-110h98" fill="none" stroke="#eef3f7" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const CAPTIONS = [
  { file: '1-today', tab: 'today', title: 'Know how ready you are', sub: 'Recovery, Sleep and Strain every morning' },
  { file: '2-body-age', tab: 'healthspan', title: 'Your Body Age', sub: 'Nine research-backed habits, plus your Pace of Aging' },
  { file: '3-sleep', tab: 'sleep', title: 'Sleep need that adapts', sub: 'Personal sleep need, consistency and a bedtime planner' },
  { file: '4-strain', tab: 'strain', title: 'Train at the right strain', sub: 'Heart-rate-reserve load on a 0–21 scale with a daily target', prev: 1 },
  { file: '5-health', tab: 'health', title: "Spot when something's off", sub: 'Overnight vitals against your personal normal range' },
  { file: '6-journal', tab: 'journal', title: 'See what moves your recovery', sub: 'Log habits and get personal impact insights' },
];

(async () => {
  const browser = await chromium.launch();

  // ---- icon + splash
  const ip = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await ip.setContent(`<html><body style="margin:0">${ICON_SVG(1024)}</body></html>`);
  await ip.screenshot({ path: path.join(OUT, 'icon-1024.png'), clip: { x: 0, y: 0, width: 1024, height: 1024 } });
  await ip.setViewportSize({ width: 2732, height: 2732 });
  await ip.setContent(`<html><body style="margin:0;background:#0b0d10;display:grid;place-items:center;height:2732px">
    <div style="width:560px;height:560px;border-radius:120px;overflow:hidden">${ICON_SVG(560)}</div></body></html>`);
  await ip.screenshot({ path: path.join(OUT, 'splash-2732.png') });

  // ---- raw app screenshots at 1320×2868
  const ctx = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => {
    localStorage.setItem('settings', JSON.stringify({ age: 34, sex: 'male', device: 'charge-6', wakeTime: '07:00', onboarded: true, consent: true }));
  });
  const p = await ctx.newPage();
  await p.goto(BASE);
  await p.click('[data-action="demo"]');
  await p.waitForTimeout(1200);
  await p.addStyleTag({ content: '.toast{display:none!important}' });
  const raw = {};
  for (const c of CAPTIONS) {
    await p.click(`[data-tab="${c.tab}"] >> nth=0`, { force: true }).catch(async () => { await p.evaluate((t) => document.querySelector(`[data-tab="${t}"]`).click(), c.tab); });
    if (c.prev) for (let i = 0; i < c.prev; i++) await p.click('[data-action="prev-day"]');
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(300);
    raw[c.file] = (await p.screenshot({ type: 'jpeg', quality: 92 })).toString('base64');
    if (c.prev) for (let i = 0; i < c.prev; i++) await p.click('[data-action="next-day"]');
  }

  // ---- captioned marketing frames
  const mp = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3 });
  for (const c of CAPTIONS) {
    await mp.setContent(`<html><head><style>
      body{margin:0;width:440px;height:956px;background:radial-gradient(120% 70% at 50% 0%,#17312a 0%,#0b0d10 60%);font-family:-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;color:#eef3f7;overflow:hidden}
      h1{font-size:34px;line-height:1.1;margin:58px 28px 10px;text-align:center;letter-spacing:-0.02em}
      p{font-size:16px;color:#9aa6b2;margin:0 34px;text-align:center;line-height:1.35}
      .phone{position:absolute;left:50%;top:205px;transform:translateX(-50%);width:356px;height:774px;border-radius:44px;overflow:hidden;border:7px solid #232a33;box-shadow:0 30px 80px rgba(0,0,0,.6)}
      .phone img{width:100%;display:block}
    </style></head><body><h1>${c.title}</h1><p>${c.sub}</p><div class="phone"><img src="data:image/jpeg;base64,${raw[c.file]}"/></div></body></html>`);
    await mp.waitForTimeout(150);
    await mp.screenshot({ path: path.join(SHOTS, `${c.file}.jpg`), type: 'jpeg', quality: 92 });
  }
  await browser.close();
  console.log(`Wrote icon, splash and ${CAPTIONS.length} screenshots to ${path.relative(ROOT, OUT)}/`);
})();
