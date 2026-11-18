# Fitbit Web API → Google Health API: developer notes for a WHOOP-style web app (as of 18 Nov 2026)

> **Headline finding (changes everything below):** The legacy Fitbit Web API (`api.fitbit.com`, `dev.fitbit.com` app registration, Fitbit OAuth) **is no longer a viable target**. Google ended support on **30 Sep 2026** and scheduled the API *and Fitbit OAuth endpoints* to be turned off on **2 Nov 2026**. The replacement is the **Google Health API v4** (`https://health.googleapis.com`), using **Google Cloud projects + Google OAuth 2.0**, new scopes, new data-type names, new JSON shapes, and new rate limits. All endpoint/field detail below is for the Google Health API unless marked "legacy".
>
> Research method note: `dev.fitbit.com`, `developers.google.com` and `dev.to` were not reachable from the session's direct fetcher; pages were read via a proxy fetcher (Apify web-fetch) on 18 Nov 2026. `dev.fitbit.com` itself was never read, so legacy-Fitbit specifics are lightly sourced (see Gaps). Perplexity was unavailable (403 billing error).

## 1. Status of the Fitbit Web API in 2025–2026: deprecation, shutdown, Google account migration, can new apps register?

### Takeaway
The Fitbit Web API is shut down (support ended 30 Sep 2026; turn-off of API + Fitbit OAuth scheduled for 2 Nov 2026, with community reports of HTTP 410 Gone after that). New and existing apps must use the Google Health API, which requires a Google Cloud project, Google OAuth consent, re-consent from every existing user (tokens do not transfer), and users whose Fitbit account has been migrated to a Google Account and linked to the Google Health app.

### Cited Findings
- Official banner on every Google Health API page: "On **September 30, 2026**, support for the legacy Fitbit Web API ended. On **November 2, 2026**, the legacy Fitbit Web API and Fitbit OAuth endpoints will be turned off and will no longer function or sync data to or from Fitbit users. To continue accessing data for your users after this date, migrate to the Google Health API." — [Google Health API: API specifications (updated 2026-10-29)](https://developers.google.com/health/migration/api-specifications); same banner on [Migration overview](https://developers.google.com/health/migration)
- A developer post dated 5 Nov 2026 states the Fitbit Web API "and its OAuth endpoints were scheduled to be turned off on 2 November 2026. Apps that still call it stop receiving Fitbit and Pixel Watch data." — [dev.to: "The Fitbit Web API was switched off on 2 November"](https://dev.to/msavas2544/the-fitbit-web-api-was-switched-off-on-2-november-heres-a-python-path-to-the-google-health-api-38kg)
- A separate community post is titled "Fitbit Web API returns 410 Gone" (title only seen in search results; not opened). — [dev.to (antivex)](https://dev.to/antivex/fitbit-web-api-returns-410-gone-how-to-keep-sleep-hrv-and-weight-flowing-into-intervalsicu-11la)
- Date conflict: a search-engine summary claimed Google's spec page gave **30 Oct 2026** as turn-off and that "dev.fitbit.com still shows October 30"; the live Google page fetched on 18 Nov 2026 says **2 Nov 2026**. — [search-result summary referencing openwearables/sahha guides](https://openwearables.io/blog/fitbit-web-api-shutdown-2026-migration-guide); contradicted by [Google API specifications page](https://developers.google.com/health/migration/api-specifications). Treat 2 Nov 2026 (Google's current page) as authoritative.
- Google Health API "utilizes a new console for registering your apps, Google OAuth 2.0, new data types, new endpoint schema, and a new response format." — [Migration overview](https://developers.google.com/health/migration)
- "Because of the switch to a new OAuth library, existing access and refresh tokens cannot be transferred, requiring users to re-consent." — [Migration overview](https://developers.google.com/health/migration)
- User ID change: legacy Fitbit IDs are 6-char alphanumeric (e.g. `A1B2C3`); Google Health uses `healthUserId` (up to 63 chars). `GET https://health.googleapis.com/v4/users/me/identity` returns both `legacyUserId` and `healthUserId`. — [Migration overview](https://developers.google.com/health/migration); [Endpoints](https://developers.google.com/health/endpoints)
- A user "must sign in to the Google Health mobile app to link Google Health to their Google Account before your app can sync data"; otherwise data calls return HTTP 400 `FAILED_PRECONDITION`, reason `ACCOUNT_NOT_LINKED`, with `metadata.redirect_uri: https://fitbit.google.com/auth/signup`. — [Migration overview](https://developers.google.com/health/migration); [Setup](https://developers.google.com/health/setup)
- Consumer-side deadlines (secondary source, citing Google support): "May 19, 2026: after this date you can no longer sign in to Fitbit with a Fitbit account"; "July 15, 2026: Google began processing data deletions for accounts that never migrated." The Fitbit app/product is now called **Google Health** (in Takeout as well). — [takeoutday.org Fitbit export guide (updated 28 Sep 2026)](https://takeoutday.org/guides/fitbit-data-export)
- Backfill: if a user didn't re-authenticate before turn-down, data is still retained if they keep syncing to the Google Health app; after re-auth you can backfill history via the Google Health API. — [Migration overview](https://developers.google.com/health/migration)
- Health Connect is positioned for on-device Android apps; Google Health API for cloud integrations (search summary of Google/third-party guides). — [Google API specifications search context](https://developers.google.com/health/migration/api-specifications); [Thryve blog](https://www.thryve.health/blog/fitbit-api-deprecation)
- New devices appear in compatibility lists (e.g. "Fitbit Air", "Fitbit Edge", Pixel Watch 4/5), i.e. the Google Health API is the only path for current hardware. — [Google Health API data types](https://developers.google.com/health/data-types)

### Inferences
- "Can new apps still register at dev.fitbit.com?" is effectively moot: even if the registration page still loads, the API and Fitbit OAuth endpoints are switched off. A new WHOOP-style app should be built only on `health.googleapis.com`.
- Any tutorial/library built on `api.fitbit.com` (python-fitbit, `/1/user/-/...` paths, `dailyRmssd`, `vo2Max` range strings) is now historical. A compatibility shim exists (`google-health` PyPI package's `fitbit_compat`) but it is a single-developer community project.
- Onboarding UX must include a pre-step: "install Google Health app, sign in with Google, migrate Fitbit account", then OAuth, then call `users/me/identity` to verify linkage.

### Gaps
- Could not read `dev.fitbit.com` directly (host blocked) to confirm whether app registration is closed or shows a shutdown banner.
- Did not open the "410 Gone" post; the exact post-shutdown HTTP behaviour of `api.fitbit.com` is from its title only.

## 2. OAuth 2.0 flow, app types, scopes, token lifetimes, refresh, access requirements (verification / user caps)

### Takeaway
Use standard Google OAuth 2.0 (Authorization Code, `access_type=offline` for refresh tokens; PKCE supported by Google OAuth and used by community clients). There is no Fitbit-style "Personal/Server/Client" app type and no special intraday approval; instead, unverified apps are capped at 100 test users, and >100 users requires Google's third-party security review. Access tokens last ~1 hour; refresh tokens expire after 7 days while the consent screen is in "Testing", and are long-lived once "In production".

### Cited Findings
- Setup: create a Google Cloud project, enable "Google Health API" (`health.googleapis.com`), create an OAuth 2.0 Client ID; Google's quick-setup tells you to select **"Web Server"** for "Where are you calling from?" and supply an Authorized redirect URI. — [Set up Google Cloud and OAuth](https://developers.google.com/health/setup)
- "The Google Health API doesn't provide a separate sandbox or staging environment"; use separate Cloud projects for dev/staging/prod. Google provides no mock data; generate your own by wearing a device, MobileTrack, manual logs, or API writes. — [Setup](https://developers.google.com/health/setup)
- "Newly created OAuth clients are in an unverified state with a cap of **100 users** for both testing and production purposes"; each user must be added as a Test user (Publishing status "Testing", User type "External"). "Supporting more than 100 users with the Google Health API requires completion of a **third party security review**." — [Setup](https://developers.google.com/health/setup)
- Token refresh: POST `https://oauth2.googleapis.com/token` with `grant_type=refresh_token`; sample response shows `"expires_in": 3599` (≈1 h access token) and `refresh_token_expires_in`. — [Setup](https://developers.google.com/health/setup)
- "Testing Mode: ... refresh tokens issued are time-based and **expire after 7 days**." "Published Mode: ... refresh tokens generally don't expire unless they are revoked or remain unused for a prolonged period (typically six months)." — [Setup](https://developers.google.com/health/setup)
- Google recommends refreshing on demand, not via batch cron jobs. — [Setup](https://developers.google.com/health/setup)
- Authorization URL example: `https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&response_type=code&access_type=offline&scope=https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly%20https://www.googleapis.com/auth/googlehealth.sleep.readonly&prompt=consent` — [Setup](https://developers.google.com/health/setup)
- OAuth token-grant rate limit: if you expect >10,000 sign-ups/re-auths in a 24 h sliding window, request a higher quota. — [Setup](https://developers.google.com/health/setup); [Rate limits](https://developers.google.com/health/rate-limits)
- Scopes all start `https://www.googleapis.com/auth/googlehealth.`; available: `.activity_and_fitness.readonly|writeonly`, `.ecg.readonly`, `.health_metrics_and_measurements.readonly|writeonly`, `.irn.readonly`, `.location.readonly`, `.logged_symptoms.writeonly`, `.mindfulness.writeonly`, `.nutrition.readonly|writeonly`, `.profile.readonly|writeonly`, `.reproductive_health.writeonly`, `.settings.readonly|writeonly`, `.sleep.readonly|writeonly`. — [Scopes](https://developers.google.com/health/scopes)
- Fitbit→Google scope map: `activity`→`.activity_and_fitness.*`; `cardio_fitness`→`.activity_and_fitness.*`; `heartrate`, `oxygen_saturation`, `respiratory_rate`, `temperature`, `weight`, `blood_glucose`→`.health_metrics_and_measurements.*`; `sleep`→`.sleep.*`; `profile`→`.profile.*`; `electrocardiogram`→`.ecg.readonly`; `irregular_rhythm_notifications`→`.irn.readonly`; `location`→`.location.readonly`; `nutrition`→`.nutrition.*`; `settings`→`.settings.*`. — [API specifications](https://developers.google.com/health/migration/api-specifications)
- Users can grant scopes granularly; apps must handle partial and zero consent gracefully. The token response's `scope` field lists granted scopes. — [Scopes](https://developers.google.com/health/scopes); [Migration overview](https://developers.google.com/health/migration)
- The community Python client advertises "OAuth 2.0 with PKCE, refresh-token rotation". — [dev.to google-health post](https://dev.to/msavas2544/the-fitbit-web-api-was-switched-off-on-2-november-heres-a-python-path-to-the-google-health-api-38kg)
- Legacy (historical): Fitbit "Personal" app type could access only the developer's own account data including intraday, without the Intraday Request form. — [search summary of Fitbit dev docs / community](https://dev.fitbit.com/build/reference/web-api/developer-guide/application-design/)
- Optional: enable Google's RISC (Cross-Account Protection) API to receive token-revocation/account events. — [Setup](https://developers.google.com/health/setup)

### Inferences
- Minimal read scope set for a WHOOP-style app: `.activity_and_fitness.readonly`, `.health_metrics_and_measurements.readonly`, `.sleep.readonly`, `.profile.readonly` (+ `.ecg.readonly`/`.irn.readonly` only if needed). HRV, RHR, SpO2, respiratory rate, skin temp and weight are all under `health_metrics_and_measurements` (inferred from data-type table scopes; HRV/RHR/temp rows truncated in my extract but the scope-mapping table places `heartrate`/`temperature` there).
- For a personal/hobby app (≤100 users, e.g. just yourself) you can stay in "Testing" indefinitely, but must re-consent every 7 days because refresh tokens expire. Publishing to "In production" without verification still keeps the 100-user cap; the security review is the gate to scale. Health scopes are likely "restricted/sensitive" in Google's verification taxonomy, which typically means an annual third-party assessment (cost/time) — not confirmed on fetched pages.
- Intraday data is no longer gated by app type: heart-rate at 1-second storage resolution etc. is available via `list` to any authorized client.

### Gaps
- The Google Health docs did not explicitly document PKCE parameters or a "public client" option; PKCE support comes from general Google OAuth (not re-verified here) and community libraries.
- Exact security-review program name (e.g. CASA tier), cost, and duration were not found on fetched pages; the setup page links to the [OAuth App Verification Help Center](https://support.google.com/cloud/answer/13463073) (not fetched).
- Legacy Fitbit token lifetimes (8 h access token, single-use refresh tokens) could not be verified from dev.fitbit.com in this session.

## 3. CORS: can a pure browser SPA call the API directly?

### Takeaway
Not documented explicitly. Google's docs steer you to a **Web Server** OAuth client (confidential client with secret) and server-side refresh; a browser-only SPA can at best obtain short-lived access tokens via Google Identity Services and would lose refresh tokens. Recommended architecture: thin backend (token exchange, refresh, webhook receiver, storage) + SPA front end.

### Cited Findings
- No source found that states whether `health.googleapis.com` returns CORS headers. Google's general docs say Google APIs support CORS; the Google Health client-libraries page lists a JavaScript client (gapi + Google Identity Services, discovery doc at `health.googleapis.com/$discovery/rest`). — [search summary incl. Google Health client libraries](https://developers.google.com/health/libraries); [google-api-javascript-client CORS doc](https://github.com/FredericRezeau/google-api-javascript-client/blob/master/docs/cors.md)
- Setup instructs choosing "Web Server" client type and downloading a client secret. — [Setup](https://developers.google.com/health/setup)
- For mobile/desktop, "always use system browsers ... never use embedded WebViews". — [Setup](https://developers.google.com/health/setup)
- Webhooks: subscriptions are created via `projects.subscribers.subscriptions.create`; most key data types have webhook support. — [API specifications](https://developers.google.com/health/migration/api-specifications); [Data types](https://developers.google.com/health/data-types)

### Inferences
- Because Google discovery-based APIs generally support CORS and a JS client is offered, direct browser calls with a bearer token will very likely work, but refresh tokens are not issued to browser token-model clients, so a pure SPA would need the user to re-consent/re-grant frequently. Webhooks (push on sync) also require a public HTTPS server endpoint. Both point to needing a backend.
- Legacy note: whether `api.fitbit.com` supported CORS for "Client" apps is now irrelevant.

### Gaps
- Not empirically tested (would require a token). Verify with a test `fetch` from your origin and inspect `Access-Control-Allow-Origin`.

## 4. Endpoints, data types, JSON fields, units and granularity for WHOOP-style metrics

### Takeaway
Everything is accessed through one uniform resource: `users/{me|id}/dataTypes/{data-type}/dataPoints` with methods `list` (raw/intraday, GET), `reconcile` (deduplicated stream, GET), `rollUp` (physical-time buckets, POST), `dailyRollUp` (civil-day buckets, POST), `get`, `create`, `patch`, `batchDelete`, `exportExerciseTcx`. Units are SI-ish and explicit in field names (grams, millimeters, Celsius, kcal, ms). Many int64 values are returned as JSON **strings**.

### Cited Findings
**Endpoint grammar**
- Base URL `https://health.googleapis.com`; user id may be `me`. Example: `GET https://health.googleapis.com/v4/users/me/profile`. — [API specifications](https://developers.google.com/health/migration/api-specifications)
- Mapping: single-day Fitbit "summary" → `POST .../dataPoints:dailyRollUp` with `windowSizeDays: 1`; Fitbit intraday → `list`; time series → `rollUp`/`dailyRollUp`; log list → `list`; profile → `users.getProfile` (+ `users.getSettings` for units/timezones); user id → `users.getIdentity`; devices → `users.pairedDevices`. — [API specifications](https://developers.google.com/health/migration/api-specifications)
- `list` example: `GET /v4/users/me/dataTypes/steps/dataPoints?filter=steps.interval.civil_start_time >= "2026-03-04T00:00:00"`; sample types filter on e.g. `body_fat.sample_time.physical_time >= "2026-03-01T00:00:00Z"`; responses include `dataPoints[]` and `nextPageToken`. — [Endpoints](https://developers.google.com/health/endpoints)
- `rollUp` body: `{"range":{"startTime":"...Z","endTime":"...Z"},"windowSize":"3600s","dataSourceFamily":"users/me/dataSourceFamilies/google-wearables"}` → `rollupDataPoints[]` e.g. `steps.countSum`. `dailyRollUp` body uses civil `range.start/end` `{date:{year,month,day},time:{...}}` and `windowSizeDays`. — [Endpoints](https://developers.google.com/health/endpoints)
- `dataSourceFamily` values: `all-sources` (default), `google-wearables` (device-recorded only, excludes manual & phone), `google-sources`. — [Endpoints](https://developers.google.com/health/endpoints)
- Every point carries physical UTC time plus UTC offset and output-only civil time; `dailyRollUp` stitches days across DST/travel. — [Data types](https://developers.google.com/health/data-types); [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- `dataSource` gives `recordingMethod`, `device.displayName` (e.g. "Charge 6"), `platform` (`FITBIT`, `HEALTH_CONNECT`, `HEALTH_KIT`, `FIT`, `FITBIT_WEB_API`, `GOOGLE_WEB_API`, ...). — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints); [Endpoints](https://developers.google.com/health/endpoints)

**HRV** (legacy `/1/user/-/hrv/...` `dailyRmssd`/`deepRmssd` → new types)
- `daily-heart-rate-variability` (Daily record; replaces "HRV summary"): `date`, `averageHeartRateVariabilityMilliseconds` (RMSSD), `deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds` (deep-sleep RMSSD), `nonRemHeartRateBeatsPerMinute` (string int64), `entropy` (Shannon entropy of beat intervals). — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints); [mapping](https://developers.google.com/health/migration/api-specifications)
- `heart-rate-variability` (Sample; replaces "HRV Intraday"): `sampleTime`, `rootMeanSquareOfSuccessiveDifferencesMilliseconds` (range 1–200), `standardDeviationMilliseconds`, `metadata.highFrequencyPower` (0.15–0.4 Hz), `metadata.lowFrequencyPower` (0.04–0.15 Hz). — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)

**Resting HR, HR, zones**
- `daily-resting-heart-rate`: `date`, `beatsPerMinute` (string int64), `dailyRestingHeartRateMetadata.calculationMethod` ∈ {`WITH_SLEEP`, `ONLY_WITH_AWAKE_DATA`}. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- `heart-rate` (Sample, **storage resolution 1 second**): `sampleTime{physicalTime, utcOffset, civilTime}`, `beatsPerMinute` (1–300), `metadata.motionContext` (`ACTIVE`/`SEDENTARY`), `metadata.sensorLocation` (`WRIST`, `CHEST`, ...). — [Data types](https://developers.google.com/health/data-types); [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- `daily-heart-rate-zones`: `heartRateZones[]{heartRateZoneType ∈ LIGHT|MODERATE|VIGOROUS|PEAK, minBeatsPerMinute, maxBeatsPerMinute}`. `time-in-heart-rate-zone` (Interval, 1-min) and `calories-in-heart-rate-zone` (rollup only) also exist. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints); [Data types](https://developers.google.com/health/data-types)

**Sleep** (legacy v1.2 → `sleep`, Session type)
- Fields: `interval{startTime,endTime,...}`, `type` (`CLASSIC` or `STAGES`), `stages[]{startTime,endTime,type}` with types `AWAKE, LIGHT, DEEP, REM` (stages) or `ASLEEP, RESTLESS, AWAKE` (classic), `outOfBedSegments[]`, `shortAwakenings[]`, `metadata{stagesStatus, processed, nap, manuallyEdited, mainSleep, externalId}`, `summary{minutesInSleepPeriod, minutesAsleep, minutesAwake, minutesToFallAsleep, minutesAfterWakeUp, stagesSummary[]{type, minutes, count}}`. `mainSleep` = longest staged session in a day. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- `stagesStatus` explains missing stages (e.g. `REJECTED_NAP` for <3 h, `REJECTED_COVERAGE`, `SUCCEEDED`). — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- Example reconciled sleep response: `minutesInSleepPeriod "464"`, `minutesAsleep "407"`, stages LIGHT 198 / DEEP 114 / REM 94 / AWAKE 56 min; note this example shows `"metadata": {"main": true}` whereas the schema field is `mainSleep`. — [Endpoints](https://developers.google.com/health/endpoints)
- Sleep and exercise `list` page size default and max = **25** sessions/page. — [Data types](https://developers.google.com/health/data-types)

**SpO2, breathing rate, skin temperature**
- `daily-oxygen-saturation`: `averagePercentage`, `lowerBoundPercentage`, `upperBoundPercentage`, `standardDeviationPercentage` (vs past 7–30 days); computed from validated sleep measurements. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints); [API specifications](https://developers.google.com/health/migration/api-specifications)
- `oxygen-saturation` (Sample, 1-min): `percentage`. Stricter filtering than legacy (drops motion/low-confidence minutes, ±3 min around invalid readings, stretches <4 min) so expect fewer points and gaps. — [API specifications](https://developers.google.com/health/migration/api-specifications)
- `daily-respiratory-rate`: `date`, `breathsPerMinute`. `respiratory-rate-sleep-summary`: `fullSleepStats`, `deepSleepStats`, `lightSleepStats`, `remSleepStats`, each `{breathsPerMinute, standardDeviation, signalToNoise}`. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- `daily-sleep-temperature-derivations` (replaces "Skin temperature"): `nightlyTemperatureCelsius` (mean skin temp during sleep — absolute, not relative), `baselineTemperatureCelsius` (30-day median), `relativeNightlyStddev30dCelsius`. New `skin-temperature-sensors` (v4beta) only on Fitbit Edge / Pixel Watch 4–5. `core-body-temperature` also exists. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints); [Data types](https://developers.google.com/health/data-types)

**Cardio fitness / VO2 max**
- `daily-vo2-max`: `vo2Max` (number, ml/kg/min, 0–100), `cardioFitnessLevel` ∈ {POOR, FAIR, AVERAGE, GOOD, VERY_GOOD, EXCELLENT}, `estimated` (bool), `vo2MaxCovariance`. `vo2-max` (Sample) has `measurementMethod` (e.g. `FITBIT_RUN`, `GOOGLE_DEMOGRAPHIC`); `run-vo2-max` has `runVo2Max`. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)

**Activity: AZM, steps, calories, active minutes**
- `active-zone-minutes` (Interval, 1-min): `heartRateZone` ∈ {FAT_BURN, CARDIO, PEAK}, `activeZoneMinutes` (1 for fat burn, 2 for cardio/peak per minute). — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- `steps` (Interval, 1-min): `count` (string int64). `distance`: `millimeters`. `floors`: `count`. `altitude`: `gainMillimeters`. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- Calories: `total-calories` (BMR + active; read-only derived, requires interval start-time filter), `active-energy-burned` (activity-only, excludes basal), `basal-energy-burned`. — [API specifications](https://developers.google.com/health/migration/api-specifications); [Data types](https://developers.google.com/health/data-types)
- `active-minutes`: `activeMinutesByActivityLevel[]{activityLevel ∈ LIGHT|MODERATE|VIGOROUS, activeMinutes}`; `activity-level` per-interval `SEDENTARY|LIGHTLY_ACTIVE|MODERATELY_ACTIVE|VERY_ACTIVE` with MET thresholds (sedentary ≤1.5 METs; very active ≥6.0 METs or ≥5.0 METs with ≥150 steps/min); active minutes require ≥10-min streaks. Sedentary = 1440 − sleep − light − moderate − very active. — [API specifications](https://developers.google.com/health/migration/api-specifications); [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)

**Exercise / workouts (incl. weight training)**
- `exercise` (Session): `interval`, `exerciseType` enum, `displayName`, `notes`, `splits[]`, `splitSummaries[]`, `exerciseEvents[]` (START/STOP/PAUSE/...), `exerciseMetadata{hasGps, poolLengthMillimeters}`, `metricsSummary{caloriesKcal, distanceMillimeters, steps, averageHeartRateBeatsPerMinute, averageSpeedMillimetersPerSecond, averagePaceSecondsPerMeter, elevationGainMillimeters, activeZoneMinutes, runVo2Max, totalSwimLengths, heartRateZoneDurations{lightTime, moderateTime, vigorousTime, peakTime}, mobilityMetrics{...}}`. TCX export via `exportExerciseTcx`. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- Strength-relevant `exerciseType` values: `STRENGTH_TRAINING`, `WEIGHTLIFTING`, `WEIGHTS`, `FREE_WEIGHTS`, `WEIGHT_MACHINES`, `FUNCTIONAL_STRENGTH_TRAINING`, `POWERLIFTING`, `BODY_WEIGHT`, `CALISTHENICS`, `CIRCUIT_TRAINING`, `CROSSFIT`, `HIIT`, `RESISTANCE_BANDS`, `CORE_TRAINING`, `TRX`. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)
- `list` vs `reconcile`: `list` can return overlapping duplicate sessions from multiple devices; `reconcile` returns the authoritative one. — [Endpoints](https://developers.google.com/health/endpoints)

**Body & profile**
- `weight`: `weightGrams` (+ `notes`); `body-fat`: `percentage`; `height`: `heightMillimeters`. No BMI or BMR data type — compute client-side. — [REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints); [API specifications](https://developers.google.com/health/migration/api-specifications)
- `getProfile` "is limited to metrics such as **age** and membership start date"; for birthday use the People API with `user.birthday.read` + `userinfo.profile` scopes. — [User profile information](https://developers.google.com/health/profile)
- Biological sex: "the Google Health API does not expose this field" — collect it yourself. — [API specifications (BMR section)](https://developers.google.com/health/migration/api-specifications)
- `users.pairedDevices` returns `deviceVersion`, `lastSyncTime`, `batteryLevel`, `features[]` (needs settings scope per setup note). — [Endpoints](https://developers.google.com/health/endpoints); [Setup](https://developers.google.com/health/setup)

**ECG / IRN**
- `electrocardiogram` (Session, `.ecg.readonly`) and `irregular-rhythm-notification` (Session, `.irn.readonly`) are available. — [Data types](https://developers.google.com/health/data-types); [Scopes](https://developers.google.com/health/scopes)

**Data freshness**
- Data is available only after device sync to the Google Health app (auto-sync ~every 15 min when the app is open/backgrounded with Bluetooth; MobileTrack hourly). Devices never talk to third parties directly. — [Data types](https://developers.google.com/health/data-types)

### Inferences
- WHOOP-style "Recovery" inputs map to: `daily-heart-rate-variability.averageHeartRateVariabilityMilliseconds` (+ deep-sleep RMSSD), `daily-resting-heart-rate.beatsPerMinute`, `daily-respiratory-rate`, `daily-sleep-temperature-derivations` (relative temp = nightly − baseline), `daily-oxygen-saturation`, and `sleep.summary`. "Strain" can be built from 1-sec `heart-rate` + `daily-heart-rate-zones` + `exercise.metricsSummary`. "Biological age" inputs: `daily-vo2-max.vo2Max`, RHR, HRV, weight/body fat, age from `getProfile`, sex user-supplied.
- Legacy sleep `efficiency` and `timeInBed` are not present by name; approximate `timeInBed ≈ minutesInSleepPeriod` (+ latency/after-wake minutes) and `efficiency ≈ minutesAsleep / minutesInSleepPeriod`. Fitbit's proprietary sleep efficiency formula may differ.
- Parse int64 fields (`beatsPerMinute`, `count`, `minutesAsleep`, etc.) from strings.
- HRV intraday is now `heart-rate-variability` samples with HF/LF power — richer than the legacy 5-minute RMSSD intraday.

### Gaps
- Did not extract exact field names/units for `total-calories`, `active-energy-burned`, `basal-energy-burned` (likely kcal; unverified), nor the `getProfile` JSON schema.
- Full scope column for HRV/RHR/temperature rows was truncated in my extract; scope inferred from the Fitbit→Google scope-mapping table.
- Fitbit "Sleep Score" and "Daily Readiness Score" do not appear in the Google Health API data-type list — appear unavailable via API (absence observed; not explicitly stated).

## 5. Range limits, pagination, and rate limits

### Takeaway
Legacy limits (150 req/hour/user; HRV 30-day ranges; sleep 100-day ranges) no longer apply. Google Health API: 300 requests/minute per user, 120k/min and 86.4M/day per project; rollups capped at 14 days (heart-rate, total-calories, active-minutes, calories-in-HR-zone) or 90 days (all other types); `list` is paginated (max 10,000 points/page; 25 sessions/page for sleep & exercise); historical depth unlimited.

### Cited Findings
- Default limits: per project 86.4M requests/day (~1,000 QPS sustained); per project 120,000/min (~2,000 QPS burst); **per user 300 requests/minute (5 QPS)**; unverified apps "Max 250 QPS total (capped at 100 users @ 2.5 QPS per user)". Exceeding returns `429 Too Many Requests`; quota increases via Cloud Console. — [Quotas and Rate Limits](https://developers.google.com/health/rate-limits)
- Rollup/dailyRollUp max range: **14 days** for `calories-in-heart-rate-zone`, `heart-rate`, `active-minutes`, `total-calories`; **90 days** for all other types. `rollUp` `windowSize` ≥ `"1s"` and should be ≥ storage resolution (e.g. `"60s"` for steps). — [Data types](https://developers.google.com/health/data-types)
- "You can query a user's data as far back as it has been recorded; the API imposes no limitations ... on the amount of historical data"; page size max 10,000 for most types; **25** for `exercise` and `sleep`; follow `nextPageToken`. — [Endpoints](https://developers.google.com/health/endpoints); [Data types](https://developers.google.com/health/data-types)
- Guidance: hot-load last 7–14 days, background cold-load history; exponential backoff on 429/504. — [Endpoints](https://developers.google.com/health/endpoints)
- Community library notes "Roll-ups are capped at 14 or 90 days" and each data type uses a different AIP-160 filter field (e.g. `steps.interval.start_time` vs `weight.sample_time.physical_time`). — [dev.to google-health](https://dev.to/msavas2544/the-fitbit-web-api-was-switched-off-on-2-november-heres-a-python-path-to-the-google-health-api-38kg)
- Legacy (historical): 150 API requests per hour per authorized user, resetting near the top of the hour. — [Fitbit community forum](https://community.fitbit.com/t5/Web-API-Development/API-requests-gt-150-per-hour/td-p/4124735); [Fitbit application design doc (search snippet)](https://dev.fitbit.com/build/reference/web-api/developer-guide/application-design/)

### Inferences
- A 1-year backfill of daily metrics ≈ 5 dailyRollUp calls per data type (90-day chunks), well within 300/min/user; 1-second heart-rate history is the heavy part (≈86,400 points/day → ~9 pages/day at 10k/page).

### Gaps
- Legacy per-endpoint limits (HRV 30 days, sleep 100 days, SpO2/BR/temp 30 days) were not re-verified from dev.fitbit.com in this session; they are moot post-shutdown.
- Whether `list` has a maximum filter time span (beyond pagination) was not stated.

## 6. Alternative: Fitbit/Google Health data export (Takeout) for offline import

### Takeaway
After migration, Fitbit data is exported via Google Takeout under the product name **"Google Health"** (not "Fitbit") as a ZIP of many JSON files; a legacy fitbit.com "Data Export" page offered CSV/JSON for unmigrated accounts. Folder naming is reported inconsistently across sources, so an importer should discover files by pattern rather than hard-code paths. GPS/TCX only via in-app export (or the API's `exportExerciseTcx`).

### Cited Findings
- Takeout route: takeout.google.com → Deselect all → select **Google Health** → ZIP. "Google Takeout gives you JSON only, inside a ZIP"; the fitbit.com selection export offered CSV or JSON (reportedly ≤31 days per request, unconfirmed). — [takeoutday.org](https://takeoutday.org/guides/fitbit-data-export)
- Reported archive layout (secondary source): `Sleep/` (one JSON per night; `levels.data[]` entries of `dateTime`, `level` ∈ wake/light/deep/rem, `seconds`; plus `summary`), `Heart Rate/` (intraday, ~every 5 s when active), `Physical Activity/`, `Daily Activity Summary/`, `HRV/` (nightly rmssd, low, high), `SpO2/`, `Weight/`, `Foods/`, `User/`. — [takeoutday.org](https://takeoutday.org/guides/fitbit-data-export)
- Conflicting reports: users of older Takeouts found files under `Takeout/Fitbit/Global Export Data/` (e.g. `sleep-*.json`, `resting_heart_rate-*.json`), with ~20k files and heart-rate data exceeding 12 million records; one report says Takeout output does not match the old Fitbit export. — [Garmin forum thread](https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/391568/export-from-fitbit-using-google-take-out-and-import-to-garmin); [Fitbit community feedback thread](https://community.fitbit.com/t5/Product-Feedback/Able-to-select-which-data-to-export-and-date-range-after-Google-migration/idi-p/5483105/page/3)
- Takeout offers no date-range or data-type filtering for Fitbit data (user reports). — [Fitbit community feedback thread](https://community.fitbit.com/t5/Product-Feedback/Able-to-select-which-data-to-export-and-date-range-after-Google-migration/idi-p/5483105/page/2)
- GPS routes: neither Takeout nor fitbit.com export gives TCX; use Google Health app → Fitness → activity → More → Export. — [takeoutday.org](https://takeoutday.org/guides/fitbit-data-export)

### Inferences
- An "upload your Takeout ZIP" import path is a good zero-OAuth fallback for a hobby app (no 100-user cap, no security review), using client-side unzip + JSON parsing; expect large files and schema variance between export vintages.

### Gaps
- No official Google documentation of the Google Health Takeout file schema was found; exact filenames for HRV, Sleep Score, skin temperature and SpO2 (e.g. legacy CSVs like "Daily Heart Rate Variability Summary") could not be confirmed. Inspect a real export before building the importer.
