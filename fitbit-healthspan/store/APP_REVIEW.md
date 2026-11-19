# App Store Connect answers & App Review notes

Copy these into App Store Connect. The listing text (name, subtitle, promo, keywords, description, What's New) is in [`listing.json`](listing.json), and a test checks it against Apple's character limits. Screenshots are in [`screenshots/6.9in/`](screenshots/6.9in) (1320×2868, iPhone 6.9"; Apple scales them for smaller iPhones). The app is iPhone-only, so no iPad screenshots are needed.

## App Information
| Field | Value |
|---|---|
| Name | Vitalspan: Recovery Coach |
| Subtitle | Recovery, Strain & Body Age |
| Bundle ID | `com.vitalspan.app` (change in `public/app.config.js` + `capacitor.config.json`) |
| Primary category | Health & Fitness |
| Secondary category | Lifestyle |
| Price | Free (no in-app purchases in v1) |
| Content rights | Does not contain third-party content |

## App Privacy ("nutrition label")
- **Data collection: "No, we do not collect data from this app."**
  - Apple defines "collect" as transmitting data off the device so that you or a partner can access it. Vitalspan downloads the user's own data from Google straight to the phone, processes it on the device, and never sends it to any server we run.
  - The app has no analytics, crash-reporting or advertising SDKs.
- **Tracking: No.**
- **Privacy manifest:** `ios/App/App/PrivacyInfo.xcprivacy` declares no tracking, no collected data types, and the required reasons for UserDefaults (CA92.1) and file timestamps (C617.1).
- **HealthKit:** reading Apple Health happens entirely on the device and nothing is transmitted, so the answer stays "Data Not Collected". The privacy policy has a dedicated Apple Health section (required by Guideline 5.1.3).

## Age rating questionnaire
- Medical/treatment or health & wellness information: **Yes, infrequent/mild**. The app gives general wellness information and is not a diagnosis.
- Everything else: **None**.
- The Terms say the app is intended for adults (18+).

## Export compliance
`ITSAppUsesNonExemptEncryption = NO` is already in Info.plist. The app uses only standard HTTPS and the iOS Keychain.

## Notes for App Review (paste into "Notes")
> Vitalspan is a wellness app that reads the user's own Fitbit / Pixel Watch data through the Google Health API (read-only OAuth) and calculates Recovery, Strain, Sleep, Stress and a research-based Body Age **entirely on the device**. There is no account and no backend.
>
> **To review without a Fitbit device:** launch the app → **Get started** → tick the agreement → enter any age and sex → **Continue** → **Try demo**. Every screen then has 210 days of realistic sample data. Use the bottom tabs (Today, Body Age, Sleep, Strain, More) and More → Stress, Health Monitor, Trends, Journal, Your tracker, Settings.
>
> **Multiple devices:** the demo contains two devices (a Fitbit Charge 6 and an Oura Ring reading through Apple Health). More → **Devices & sources** shows how each metric is assigned to a device and lets you change it.
>
> **Apple Health (HealthKit):** More → Devices & sources → Apple Health → **Connect** shows the standard Health permission sheet (read-only; the app never writes). On a test device with any Apple Health data (for example steps from the iPhone, or sample data added in the Health app), the app lists each contributing app/device and merges them. HealthKit data is used only for in-app features, never for advertising, never shared and never stored in iCloud (Guidelines 2.5.1 and 5.1.3).
>
> **Connecting Fitbit** requires a Google account linked to a Fitbit or Pixel Watch in the Google Health app. ⟨Optional: "A demo Google account with sample data is: …"⟩
>
> **Medical claims:** the app is not a medical device and says so during onboarding, in the footer of every screen and in the Terms. It does not diagnose, treat or prevent disease. The method behind every score is explained in the app, with study citations (Guideline 1.4.1).
>
> **Health data (5.1.3):** health data is never used for advertising or shared, is not stored in iCloud, and Google tokens are kept in the device Keychain with iCloud sync disabled. Settings → Delete all data erases everything and revokes Google access.
>
> **Native functionality (4.2):** Apple Health integration, local bedtime and morning notifications, Keychain storage, haptics, native sign-in sheet, and full offline use after sync.
>
> **Third-party names:** Fitbit, Pixel Watch, Oura, Garmin and others are mentioned only to describe compatibility. The app is independent and says so in-app.

## Pre-submission checklist (Apple)
- [ ] Apple Developer Program membership ($99/yr). Create the App ID `com.vitalspan.app` **with the HealthKit capability** and the app record in App Store Connect.
- [ ] Host `privacy.html`, `terms.html` and `support.html` (copied to `www/` at build time) on your domain, and put the URLs in `listing.json` and App Store Connect.
- [ ] Replace `support@example.com` in `public/app.config.js`.
- [ ] Check that the name "Vitalspan" is free on the App Store and as a trademark in your markets; change `APP.name` if not.
- [ ] In Xcode, set your Team for signing.
- [ ] Archive, upload to TestFlight, test on a real device, then submit.
