# Vitalspan: Recovery, Strain & Body Age for Fitbit

An iPhone app (and web app) that turns data from **multiple wearables at once** (Fitbit / Pixel Watch via Google Health, plus Apple Watch, Oura, Garmin, Withings, Polar and others via Apple Health) into daily **Recovery, Strain, Sleep Need, Stress, Health Monitor, Journal** and a research-based **Body Age with Pace of Aging**. Everything runs on the device: no account, no backend, no tracking.

> 📱 **Shipping to the App Store:** see [`RELEASE.md`](RELEASE.md). The iOS project (`ios/`), icon, screenshots, listing text, privacy policy and review notes (`store/`) are ready. What's left is signing in Xcode and Google's OAuth verification.

> ⚠️ **The Fitbit Web API was switched off on 2 Nov 2026.** Vitalspan uses its successor, the **Google Health API v4**. On iPhone, sign-in and sync happen directly between the phone and Google (installed-app OAuth with PKCE, tokens in the Keychain). The optional `server.js` serves the web build.

The research behind every formula is in two reports:
- [`../reports/Fitbit WHOOP style biological age.md`](../reports/Fitbit%20WHOOP%20style%20biological%20age.md): how the reference scores and effective-age method work.
- [`../reports/Fitbit vs WHOOP tracker differences.md`](../reports/Fitbit%20vs%20WHOOP%20tracker%20differences.md): sensors, measurement methods, accuracy and the Fitbit adaptation rules this app implements.

## Quick start

```bash
cd fitbit-healthspan
npm ci
npm test             # 43 tests: scoring, device adaptation, multi-device merge, Apple Health parsing, App Store limits
npm start            # builds www/ and serves the web version at http://localhost:8787
npm run ios:sync && npm run ios:open   # iPhone app in Xcode (macOS)
```

On first launch, onboarding asks for your consent and profile, then lets you connect **Fitbit/Pixel Watch**, **Apple Health**, a **Fitbit export**, or **Try demo**. The demo is two devices (a Fitbit Charge 6 and an Oura Ring) over 210 days.

## Multiple devices
Each connected source (Fitbit via Google, every app/device found in Apple Health, an import) becomes a device under **More → Devices & sources**. `engine/merge.js` combines them:
- **Overnight vitals** (HRV, resting HR, breathing, SpO₂, skin temp): one device per metric, never mixed night-to-night. The default is the device with the best recent coverage, with rings and bands preferred. You can override it per metric.
- **Sleep:** the primary device, with other devices filling the nights it missed (flagged).
- **Heart rate:** the best-covered device, with gaps filled minute-by-minute from the others.
- **Steps:** the highest daily count.
- **Workouts:** de-duplicated by overlap.
- **VO₂max:** measured estimates are preferred over demographic ones.
- **Resting HR** is never re-derived from another device's heart rate.

## Three ways to get your data in

| Option | Setup | Data |
|---|---|---|
| **Google Health API sync** | Google Cloud OAuth client (below) | Everything, including minute-level heart rate, so Stress and accurate Strain work |
| **Import export files** | None. Choose the unzipped export folder | Classic Fitbit export files: `sleep-*.json`, `heart_rate-*.json`, HRV/SpO2/respiratory/temperature CSVs, etc. |
| **Demo** | None | Synthetic |

### Connecting Google Health (Fitbit)

1. **Each user:** install the **Google Health** app, sign in with Google, and finish moving your Fitbit account over. If you skip this, the API answers `ACCOUNT_NOT_LINKED` and the app tells you so.
2. In the [Google Cloud console](https://console.cloud.google.com/):
   - Create a project and **enable the Google Health API**.
   - Set up the **OAuth consent screen** and add yourself (and anyone else, up to 100 people) as **test users**.
   - Add these scopes:
     - `googlehealth.activity_and_fitness.readonly`
     - `googlehealth.health_metrics_and_measurements.readonly`
     - `googlehealth.sleep.readonly`
     - `googlehealth.profile.readonly`
     - `googlehealth.settings.readonly` (optional: lets the app detect which tracker you wear)
   - Under **Credentials → Create OAuth client ID → Web application**, add the redirect URI `http://localhost:8787/auth/callback`.
3. `cp .env.example .env`, fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, then run `npm start`.
4. Open the app, click **Connect**, approve the access request, and the first sync runs (about 200 days, usually 1–2 minutes).

**Limits to know about:**
- While the consent screen is in *Testing* mode, Google refresh tokens **expire after 7 days**, so you'll need to reconnect weekly. Publishing the app removes that limit.
- Going beyond 100 users requires Google's security review.
- Tokens are stored only in `.data/tokens.json` on your machine.
- If Google renames a field, open `GET /api/raw?type=<data-type>` to see the raw payload. The parser in `lib/googleHealth.js` looks fields up by name, so a moved field still parses, but a renamed one needs a code change.

## What you get (WHOOP feature → this app)

| WHOOP | Here | Built from |
|---|---|---|
| **WHOOP Age / Healthspan** | **Body Age**: 9 metrics, each showing ± years and a 30-day trend | sleep hours, sleep consistency, steps, HR-zone 1–3 and 4–5 minutes in workouts, strength time, VO₂max (Cardio Fitness), sleeping RHR, lean mass % |
| **Pace of Aging** (−1× … 3×) | Same scale and bands (Reversing / Slowing / Steady / Accelerated) | last 30 days projected 6 months ahead vs the 6-month Body Age |
| **Recovery** (green / yellow / red) | 0–100%, with what drove it and a warning when vitals are off | deep-sleep HRV, sleeping RHR, sleep performance, breathing rate, skin temp, SpO₂, prior strain |
| **Strain** (0–21) | Day Strain, per-activity strain, HR-zone minutes, **Strain target** for the day | minute-level heart rate, % heart-rate reserve, Banister TRIMP |
| **Sleep Performance / Sleep Need / Sleep Planner** | Need = baseline + strain + debt − naps; score breakdown; bedtime recommendation | sleep stages, efficiency, 4-day consistency, sleep stress |
| **Stress Monitor** (0–3) | 24-hour stress chart, time calm / alert / highly activated | heart rate vs your 14-day baseline, with workouts and walking excluded |
| **Health Monitor** | HRV, RHR, respiratory rate, SpO₂ and skin temp vs your normal range, plus the 7-day HRV trend | 30-day mean ± 2 SD; HRV4Training 60-day band |
| **Journal + Behaviour Impact** | 12 behaviours. Shows the effect on next-day recovery once there are ≥ 5 yes and ≥ 5 no answers in 90 days | your answers × recovery |
| Trends | 30/90/180-day charts for 10 metrics | — |

Fitbit already provides HRV, SpO₂, skin temperature, breathing rate, VO₂max, sleep stages and minute-level heart rate. The app adds the WHOOP-style models on top. Fitbit doesn't share biological sex, so set it in **Settings** (along with an optional max HR or body-fat %).

## Fitbit vs WHOOP: what differs and how the app adapts

The **Fitbit vs WHOOP** tab shows this for your own tracker. In short:

| | Fitbit / Pixel Watch | WHOOP 4.0 / 5.0 / MG |
|---|---|---|
| Hardware | 11 configurations in 3 tiers: **A** Pixel Watch 2–5 and Sense 2 (all sensors, continuous EDA, ECG); **B** Edge, Charge 6, Versa 4 (GPS); **C** Air, Inspire 3, Luxe (no GPS) | One screenless optical stack (5 LEDs, 4 photodiodes); 5.0/MG sample at a reported ~26 Hz; MG adds ECG |
| HRV | RMSSD over 5-min windows in the main sleep; nightly and **deep-sleep** values | RMSSD over 5-min windows stepping every 30 s, weighted to slow-wave and late sleep |
| Resting HR | Daily value, may use awake data | During sleep |
| HR sampling | 1 s in exercise, about every 5–15 s at rest | Continuous |
| Sleep staging vs lab (κ) | Sense 0.42, Charge 5 0.41 | WHOOP 4.0 0.37 |
| Own scores | Readiness, Sleep Score, Cardio/Target Load, Stress Mgmt, Cardio Fitness. **None are in the API**, and there's no biological age | Recovery, Strain, Sleep Performance/Need, Stress Monitor, Healthspan |
| Cost | Device $99–$249, plus optional Premium $9.99/mo | $199–$359/yr membership |

No study has worn both brands on the same people at the same time, so **no fixed Fitbit↔WHOOP conversion exists**. The app instead applies the report's rules:

- **HRV:** deep-sleep RMSSD is preferred. If it's missing on >20% of nights, the whole series switches to whole-night RMSSD; the two are never mixed.
- **Personal baselines:** every score compares you with your own robust 30-night baseline, so device offsets cancel out.
- **Resting HR:** taken from heart rate during sleep (5th percentile). Fitbit's daily RHR is the fallback, flagged when Fitbit computed it from awake data only.
- **Zones:** recomputed from raw HR using heart-rate reserve. Fitbit's Active Zone Minutes are never used for WHOOP-style metrics.
- **Sampling gaps:** gaps of up to 5 min are bridged; longer gaps count as not worn.
- **VO₂max:** only run-based (GPS) estimates count toward Body Age. Demographic Cardio Fitness estimates re-count resting HR and age, so they're excluded. On a Tier C device (no GPS), Body Age runs without VO₂max.
- **Biological sex:** Google doesn't share it. Body Age stays locked until you set it, and Strain uses averaged coefficients in the meantime.
- **Switching trackers:** set "Using this tracker since" in Settings. Once 7 nights exist on the new tracker, older nights are rescaled to it by the ratio of median HRV and RHR, and scores are flagged for 14 nights.
- **Confidence:** each score is rated High, Medium or Low with reason codes such as `NO_STAGES`, `LOW_HR_COVERAGE`, `HRV_WHOLE_NIGHT` and `DEVICE_CHANGED`. A Low-confidence Recovery is shown grey.

## How the scores work

Each formula below is tagged **[OFFICIAL]** (WHOOP published it), **[LIT]** (taken from the cited studies) or **[RECON]** (our reconstruction, fitted to WHOOP's published reference points). WHOOP has never published its actual weights.

- **Body Age** [OFFICIAL structure]:
  - Body Age = age + Σ 0.57 · Rᵢ, where each Rᵢ = 10·ln(hazard ratio) for one metric vs its guideline target, using 6-month means.
  - Targets come from the white paper. Examples: 7 h sleep, 70% consistency, 8,000 steps (5,600 at older ages), 100 min/week in zones 1–3, 10 min/week in zones 4–5, 40 min/week of strength, an age- and sex-specific VO₂max table, and RHR 60 (men) / 64 (women).
  - The 0.57 factor [RECON] was fitted so WHOOP's four published 30-year-old reference cases come out at **+5.9 / −1.2 / +7.6 / −1.4 years**, against WHOOP's own ≈ +6 / −1.6 / +7.5 / −1.6. A unit test checks this.
- **Pace of Aging**: clamp((Body Age projected from the last 30 days + 0.5 y − current Body Age) / 0.5, −1, 3). Unchanged habits give exactly 1.0×.
- **Recovery** [RECON]:
  - Z = 0.55·z(ln HRV) + 0.25·z(−RHR) + 0.20·z(sleep perf) − penalties. Each z is a robust z-score against your previous 30 nights.
  - Recovery = 100 / (1 + e^−(1.06·Z/s + 0.44)).
  - Calibrated to about 15% red days, 40% green days and a mean near 58, which matches what open reconstructions infer for WHOOP. The tests check this.
- **Strain** [LIT + RECON]:
  - Load = Σ per-minute Banister weight on %HRR.
  - b = 6.4·ln(1 + Load/20.5); Strain = 21·b / (b¹² + 21¹²)^(1/12).
  - Fitted to WHOOP's anchors: 1 h walk ≈ 6, 1 h run ≈ 12, marathon ≈ 20, 24 h at max heart rate = 21.
- **Sleep** [RECON values on the OFFICIAL structure]:
  - Baseline need = median sleep on nights after low-strain days, between 7 and 9 h.
  - Need adds 5 min per strain point above 10.
  - Sleep debt carries over: D = clamp(0.794·D + shortfall, 0, 120 min).
  - Performance = 55% sufficiency + 20% efficiency + 15% consistency + 10% sleep stress.

## Limitations (please read)

- **These are estimates, not WHOOP's algorithms and not medical advice.** Only the WHOOP Age structure, its targets and the score bands are official.
- **Fitbit and WHOOP sensors measure things differently.** Three known gaps:
  - Fitbit's HRV is deep-sleep RMSSD, not WHOOP's slow-wave-weighted value.
  - Resting heart rate here is taken as the 5th percentile of heart rate during sleep.
  - Zone minutes are recomputed from raw heart rate using heart-rate reserve.
  - Expect the same trends as WHOOP, not identical numbers.
- **Google Health API field names haven't been tested against a live account.** They come from Google's docs and examples. The parser looks fields up by name and the payload tests pass, but check `/api/raw` if a metric shows "no data".
- **Export file layouts vary.** The post-migration Google Takeout layout isn't documented. The importer reads the classic Fitbit export file names. Intraday times are assumed to be UTC; switch this in Settings if your times look shifted.

## Project layout

```
public/app.config.js    app name, bundle ID, version, Google iOS client ID (one place to rebrand)
public/platform.js      native (Capacitor) vs web: Google sign-in, Keychain, sync, notifications, haptics
public/lib/googleHealth.js  Google Health API v4 client + tolerant parser (WebCrypto PKCE; runs on iPhone and Node)
ios/                    Xcode project (Capacitor 8, Swift Package Manager)
scripts/                build (esbuild → www/), configure-ios, store-assets, flatten
store/                  App Store listing, review notes, icon, screenshots
server.js               optional web server: static www/, OAuth for the web build, /api/sync, /api/raw
public/engine/          scoring engine (pure ES modules, shared by browser and tests)
  healthspan.js  recovery.js  strain.js  sleep.js  stress.js  monitor.js  journal.js  zones.js  index.js
  devices.js     per-device capability profiles, tiers, Fitbit↔WHOOP score map, adaptation notes
  confidence.js  per-score confidence flags (High / Medium / Low)
  merge.js       multi-device merge with per-metric provenance
public/adapters/        demo.js (synthetic, incl. two-device demo), takeout.js (export importer), healthkit.js (Apple Health)
public/app.js, ui/      dashboard (vanilla JS + SVG charts)
test/                   node:test suites (engine acceptance tests + adapter fixtures)
```
