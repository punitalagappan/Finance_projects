# Releasing Vitalspan to the App Store

Everything that can be prepared without your Mac and your accounts is already done: the iOS project, signing-ready settings, privacy manifest, icon, splash, screenshots, store text, privacy policy and terms. What's left needs **your Mac with Xcode**, **an Apple Developer account** and **a Google Cloud project**.

> **Biggest dependency: Google.** Health data comes through the Google Health API, which uses sensitive health scopes. Until Google verifies your OAuth app, sign-in is limited to **100 test users**, and their sign-ins expire every **7 days**. That is fine for TestFlight. A public App Store launch needs Google's OAuth verification, which likely includes a third-party security assessment (CASA) because these are health scopes. Start that process early: it typically takes weeks. Demo mode and file import work without any of this, so App Review can still use the app.

## 1. One-time setup (≈1 hour)

**On your Mac**
1. Install Xcode 16 or later, Node 18 or later, and Git.
2. `git clone` this repo, then run `cd fitbit-healthspan && npm ci`.

**Google Cloud** ([console.cloud.google.com](https://console.cloud.google.com))
1. Create a project and enable the **Google Health API**.
2. On the **OAuth consent screen**:
   - Set the app name, logo (`store/icon-1024.png`), support email, and your homepage / privacy-policy / terms URLs (hosted copies of `www/*.html`).
   - Add these scopes:
     - `googlehealth.activity_and_fitness.readonly`
     - `…health_metrics_and_measurements.readonly`
     - `…sleep.readonly`
     - `…profile.readonly`
     - optionally `…settings.readonly` (lets the app detect the device)
   - Add your testers' Google accounts under **Test users**.
3. Under **Credentials → Create OAuth client ID → iOS**, enter bundle ID `com.vitalspan.app`. Copy the client ID.
4. Paste the client ID into `public/app.config.js` → `googleIosClientId`.

**Apple** ([developer.apple.com](https://developer.apple.com))
1. Enrol in the Apple Developer Program.
2. Register the App ID `com.vitalspan.app`. No special capabilities are needed; local notifications don't require the Push capability.
3. In App Store Connect, create the app with the name and SKU, and fill in the fields from [`store/APP_REVIEW.md`](store/APP_REVIEW.md) and [`store/listing.json`](store/listing.json).

**Branding (optional)**
- To rename the app, edit `APP` in `public/app.config.js` and `appId`/`appName` in `capacitor.config.json`.
- Then run `npm run ios:sync` and `npm run store:assets` to regenerate everything.

## 2. Build
```bash
npm test             # 27 tests: scoring acceptance checks, Fitbit adaptation rules, store limits
npm run ios:sync     # bundles the web app → www/, applies Info.plist/pbxproj settings, copies into Xcode
npm run ios:open     # opens Xcode
```
In Xcode:
- Select the **App** target → **Signing & Capabilities** → choose your Team.
- Run on a real iPhone. Check that the onboarding, demo, **Connect** (the Google sheet should return to the app), sync, notifications and **Delete all data** all work.

## 3. TestFlight → App Store
1. In Xcode, choose **Product → Archive → Distribute App → App Store Connect**.
2. In App Store Connect → TestFlight, add internal testers (who must also be Google OAuth test users). Collect a week of real-device data.
3. When Google verification is approved, publish the OAuth app "In production" so sign-ins stop expiring after 7 days.
4. Upload the screenshots in `store/screenshots/6.9in/` and paste the App Review notes, then **Submit for Review**.

## 4. Every update
```bash
# bump APP.version in public/app.config.js (and the build number in Xcode)
npm test && npm run ios:sync && npm run store:assets   # store:assets needs Playwright + a running `node server.js`
```

## What's in the box
| Area | Where |
|---|---|
| Scoring engine (shared, tested) | `public/engine/` |
| On-device Google Health client (PKCE, no secret, no server) | `public/lib/googleHealth.js`, `public/platform.js` |
| Native shell (Capacitor 8, Swift Package Manager) | `ios/`, `capacitor.config.json` |
| Release settings (URL scheme, iPhone-only, portrait, encryption flag, privacy manifest) | `scripts/configure-ios.mjs` |
| Icon / splash / screenshots generator | `scripts/store-assets.cjs`, `scripts/flatten.py` |
| Privacy policy, terms, support | `public/privacy.html`, `terms.html`, `support.html` |
| Store listing + review notes | `store/` |

## Known limits before launch
- **Device testing:** the Google sign-in round trip and on-device sync have not been run on a physical iPhone. This environment has no Mac, so do that in step 2.
- **Google Health API field names** come from Google's docs. Check them against a real account (on the web build, `GET /api/raw?type=…` shows raw payloads).
- **Android** isn't included. Google requires a different sign-in method for Android apps, so it's a separate piece of work. The scoring engine and UI are ready for it.
- **No background refresh:** the app syncs when opened or brought back to the foreground, or when you pull down to refresh. The morning notification prompts users to open it.
