# Translating WHOOP's scores onto Google's Fitbit fleet

WHOOP sells one sensor stack in three versions. Google sells at least eleven different sensor configurations behind one app. That gap, more than any secret algorithm, is what a WHOOP-style app built on Fitbit data has to engineer around. WHOOP 4.0, 5.0 and MG share a screenless pod with 5 LEDs and 4 photodiodes. It records continuously, at a reported ~26 Hz on 5.0/MG, and takes every recovery vital during sleep. The models differ mainly in battery (4–5 days vs 14+ days) and in the MG's FDA-cleared ECG. Google's range runs from the screenless $99 Fitbit Air (no GPS, no ECG app, no EDA scan) to the Pixel Watch 5 (multipath PPG, continuous EDA, ECG, far-field skin temperature, ~30–40 h battery). Both brands call their nightly HRV "RMSSD", but the numbers are not interchangeable. Fitbit reports a main-sleep value plus a separate deep-sleep value, while WHOOP uses a whole-night average weighted toward slow-wave and late sleep. **No study has measured both brands on the same people at the same time.** The independent accuracy evidence is thin and mostly predates current hardware:

- **HRV:** WHOOP 4.0 agrees with ECG at CCC 0.94 and MAPE ~8%. The only Fitbit HRV study is an 8-person Versa 4 pilot that read ~8% high.
- **Sleep staging:** in the one head-to-head PSG study, Fitbit Sense and Charge 5 staged sleep slightly better than WHOOP 4.0 (kappa 0.42/0.41 vs 0.37).
- **SpO2 and skin temperature:** neither brand has independent validation.

Fitbit's scores map onto WHOOP's concepts: Daily Readiness to Recovery, Cardio Load/Target Load to Strain/Strain Target, Stress Management to Stress Monitor, Cardio Fitness to VO2max. They do not map onto WHOOP's scales. Google has no biological-age score. Sleep Score lacks WHOOP's dynamic Sleep Need. Readiness and Sleep Score are also not exposed by the Google Health API v4, which replaced the Fitbit Web API on 2 November 2026. A WHOOP-style app therefore has to recompute every score from raw fields. The implementation rules that follow from all of this:

- Use deep-sleep RMSSD and a sleeping resting heart rate derived from raw HR.
- Z-score each input against a baseline kept per user and per device.
- Never apply a fixed cross-brand offset.
- Recompute zones and strain from raw heart rate with time-weighted integration.
- Use only VO2max values that came from a GPS-tracked run.
- Attach a confidence flag to every score that names any missing inputs.

**How to read the labels.** Most facts below were gathered from search-engine excerpts of the cited pages, not full-page reads, because the research sandbox blocked many hosts. Each claim in the matrix and rules is therefore tagged:

| Tag | Meaning |
|---|---|
| **[V]** | Verified: stated by the vendor's own documentation or spec page, or by a peer-reviewed paper |
| **[R]** | Reported: from press, reviewers or third-party explainers, not vendor-confirmed |
| **[U]** | Unverified: background knowledge or inference with no source retrieved; check before relying on it |
| **[D]** | Design: a rule or reconstruction proposed by this report |

## WHOOP ships one sensor stack; Google ships eleven configurations

### WHOOP 4.0, 5.0 and MG share one optical design

WHOOP's current optical layout dates from the **4.0 (September 2021)**: **5 LEDs (3 green, 1 red, 1 infrared) and 4 photodiodes**. The red and IR LEDs enabled SpO2, and the same generation added a skin-temperature sensor. WHOOP's own page credits later models to that foundation ([WHOOP Locker](https://www.whoop.com/kr/en/thelocker/whoop-proven-most-accurate-wearable-in-heart-rate-heart-rate-variability-measurements); [Wearable Technologies](https://wearable-technologies.com/news/the-new-whoop-4-0-comes-with-pulse-oximeter-and-skin-temperature-sensor)).

**WHOOP 5.0 and MG went on sale 8 May 2025.** Changes from 4.0:

- About 7% smaller.
- **14+ day battery** with a wireless PowerPack, against 4–5 days for 4.0 ([WHOOP Press Center](https://www.whoop.com/us/en/press-center/whoop-unveils-5.0-MG/); [CNBC](https://www.cnbc.com/2025/05/08/whoop-wearables-whoop-50-mg-price.html)).
- Sampling reported at **~26 Hz, against ~5 Hz on 4.0**. This is a WHOOP claim relayed by reviewers, not a published spec ([the5krunner](https://the5krunner.com/2025/06/16/whoop-4-0-vs-whoop-5-0-sensor-architecture-changes-detailed-technical-content/)). Claims of 100 Hz were not supported by any source found.

The MG uses the 5.0 platform plus ECG electrodes. Its **Heart Screener**, a single-lead ECG, is reported as **FDA-cleared under 510(k) K243236** for AFib screening ([MedGrade](https://medgrade.org/reviews/whoop-mg-review/)). Its **Blood Pressure Insights** feature estimates BP from PPG after cuff calibration and is **not cleared**. The FDA sent WHOOP a warning letter over it on 14 July 2025 ([FDA warning letter](https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/whoop-inc-709755-07142025)).

Other platform facts:

- No WHOOP model has a screen.
- The pod can be worn on the wrist or, with "Any-Wear" apparel, on the bicep, torso, waist or calf ([DC Rainmaker](https://www.dcrainmaker.com/2021/09/updated-announced-changed.html)).
- No new WHOOP hardware appeared in 2026. The notable 2026 change was a **February 2026 heart-rate signal-processing update** ([WHOOP 2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/)).

### Google's lineup spans three device generations

Google's 2026 lineup has three generations under one app. The app itself was renamed **Google Health** in May 2026 ([Android Central](https://www.androidcentral.com/wearables/fitbit/the-old-fitbit-app-is-becoming-google-health)).

**1. Pixel Watch 2–5** carry multipath optical HR, continuous EDA (cEDA), ECG and a dedicated skin-temperature sensor. Google says the multipath sensor gives "up to 40% more accurate" HR in vigorous activity ([Pixel Watch Help](https://support.google.com/googlepixelwatch/answer/12759285?hl=en)). Since the Pixel Watch 2, HR comes from on-device deep learning over multipath PPG ([arXiv](https://arxiv.org/pdf/2606.21436)). The Pixel Watch 4 and 5 moved to a far-field skin-temperature sensor ([Android Central](https://www.androidcentral.com/wearables/google-pixel-watch-5)).

**2. The 2026 bands, Fitbit Air and Fitbit Edge.**

- **Fitbit Air** was announced on 7 May 2026 and is explicitly positioned against WHOOP ([TechCrunch](https://techcrunch.com/2026/05/07/google-unveils-whoop-like-screenless-fitbit-air/)). It is a 5.2 g screenless pebble with PPG, red/IR SpO2, a "device temperature sensor", an accelerometer and a gyroscope. It has no GPS, no ECG app and no EDA scan ([Google Store](https://store.google.com/us/product/google_fitbit_air_specs?hl=en-US); [Welltory](https://welltory.com/blog/google-fitbit-air)).
- **Fitbit Edge** was announced on 12 October 2026 at $179.99 and is framed as the Charge 6's replacement ([9to5Google](https://9to5google.com/2026/10/12/google-fitbit-edge-announcement/); [TechRepublic](https://www.techrepublic.com/article/news-google-fitbit-edge-replaces-charge-6/)). It adds ECG, GPS with Galileo, an altimeter, a 1.34" screen and a user-replaceable 65 mAh battery ([Google Store](https://store.google.com/product/google_fitbit_edge_specs?hl=en-US)). It **drops the Charge 6's palm-on-band EDA scan** ([Fitcoin](https://www.fitcoin.co/vs/fitbit-edge-vs-fitbit-charge-6)).

**3. The 2021–2023 Fitbit OS devices:** Luxe, Inspire 3, Charge 6, Versa 4 and Sense 2. They still sync and are still listed as Readiness-capable ([Google Health Help](https://support.google.com/googlehealth/answer/14236710?hl=en-AO)). Charge 6, Inspire 3, Versa 4 and Sense 2 were still on sale in August 2026 ([Gadgets & Wearables](https://gadgetsandwearables.com/2026/08/14/fitbit-deals-amazon/)).

### Per-device capability matrix

In the matrix, **Y** means present, **N** absent, **?** unknown. Each cell carries its source tag. The trailing `*` on launch years and batteries marks [U] background facts. The "temp-sensor datatype" column refers to the separate `skin-temperature-sensors` v4beta data type in the Google Health API, which Google's docs list only for Edge and Pixel Watch 4–5 ([Google Health data types](https://developers.google.com/health/data-types)).

| Device | Launch | Screen | Optical HR | SpO2 | Skin temp | EDA | ECG app | Built-in GPS | Rated battery | Readiness / Cardio Load | Temp-sensor datatype |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Fitbit Air** | May 2026 [R] | None [V] | PPG [V] | Y, region-limited [V] | Relative only [R] | N [R] | N; background AFib (FDA) only [R] | N [R] | Up to 7 d [V]; ~15% left after a week [R] | Y; did not populate at launch [R] | N [V] |
| **Fitbit Edge** | Oct 2026 [V] | 1.34" [R] | PPG [V] | Y [V] | Y [R] | N scan; background stress conflicting [R] | Y [V] | Y + Galileo [V] | Up to 7 d; ~2 d always-on display [R] | Y [U] | Y [V] |
| **Charge 6** | 2023* | 1.04" AMOLED [R] | PPG | Y [R] | Variation [R] | Palm scan [R] | Y [R] | Y [R] | 7 d* | Y [V] / Y [R] | N |
| **Inspire 3** | 2022* | Colour | PPG | Y [U] | Variation [U] | N [U] | N [U] | N; phone GPS [U] | ~10 d* | Y [V] / Y [R] | N |
| **Luxe** | 2021* | Colour | PPG | Y [U] | Variation [U] | N [U] | N [U] | N [U] | ~5 d* | Y [V] / Y [U] | N |
| **Versa 4** | 2022* | AMOLED | PPG | Y [U] | Variation [U] | N [U] | N [U] | Y [U] | 6+ d* | Y [V] / Y [R] | N |
| **Sense 2** | 2022* | AMOLED | PPG | Y [U] | Dedicated [U] | cEDA [R] | Y [U] | Y [U] | 6+ d* | Y [V] / Y [U] | N |
| **Pixel Watch 2** | 2023* | AMOLED | Multipath [V] | Y [R] | Dedicated [V] | cEDA [R] | Y [R] | Y | ~24 h* | Y [V] / Y [R] | N |
| **Pixel Watch 3** | 2024* | AMOLED | Multipath [V] | Y | Dedicated [V] | cEDA | Y | Y | ~24 h* | Y [V] / on-device [V] | N |
| **Pixel Watch 4** | 2025* | AMOLED | Multipath [V] | Y [R] | Far-field [R] | cEDA [R] | Y [R] | Y | 30/40 h* | Y [V] / on-device [V] | Y [V] |
| **Pixel Watch 5** | Aug 2026 [R] | AMOLED | Multipath [R] | Y [R] | Far-field [R] | cEDA [R] | Y [R] | Y [R] | ~30/40 h [R]; replaceable [R] | Y [U] | Y [V] |
| **WHOOP 4.0** | Sep 2021 [R] | None [R] | 3G/1R/1IR LEDs, 4 PDs [V] | Y, sleep only [V] | Y, vs baseline [V] | N [U] | N | N [U] | 4–5 d [R] | Recovery/Strain (native) | n/a |
| **WHOOP 5.0** | May 2025 [V] | None | Same optics [R]; ~26 Hz [R] | Y, sleep only [V] | Y [V] | N [U] | N | N [U] | 14+ d [V] | native | n/a |
| **WHOOP MG** | May 2025 [V] | None | Same optics as 5.0 [R] | Y [V] | Y [V] | N [U] | Y, FDA-cleared spot ECG [R] | N [U] | 14+ d [V] | native + BP Insights (not cleared) [V] | n/a |

Device-exclusive Google features also exist:

- **Loss of Pulse**: Pixel Watch 3 and later, region-limited ([Gadgets & Wearables](https://gadgetsandwearables.com/technical-specs/google-pixel-watch-4/)).
- **Blood Pressure Trends** and **Insulin Resistance Trends**: Pixel Watch 5 only. Data collection began in September 2026 and the trends are Premium-tied ([How-To Geek](https://www.howtogeek.com/pixel-watch-5-brings-passive-blood-pressure-tracking-and-gemini-intelligence/); [TheStreet](https://www.thestreet.com/investing/google-gives-fitbit-a-major-health-upgrade-with-one-catch)).

Neither feature is an input to any WHOOP-style score, so an app can ignore both.

Several facts remain unknown:

- LED counts and wavelengths for any Google device.
- Whether Air and Edge use multipath optics.
- The Pixel Watch 5's US price. Snippets conflict between $299.99 deals and an implausible $649.

### Battery, wear location and price separate the two business models

Battery and wear location cause data gaps.

- **Pixel Watches** last roughly a day or a day and a half, so many owners charge overnight and lose sleep data. Every recovery input is sleep-derived.
- **Fitbit bands** last about 7 days, and **WHOOP 5.0/MG** last 14+ days, so overnight gaps are rarer on both.
- **Fitbit Air** needs more frequent charging when SpO2 is enabled ([Google Store](https://store.google.com/us/product/google_fitbit_air_specs?hl=en-US)).
- **WHOOP's bicep and apparel placements** have no Google counterpart. Every Air source describes wrist wear only ([Android Central review](https://www.androidcentral.com/wearables/fitbit/fitbit-air-review)).

Pricing follows two different models:

| | WHOOP | Google |
|---|---|---|
| Hardware | Included in membership | One-off: Air $99–99.99, Edge $179.99, Charge 6 $159 list |
| Subscription tiers | **One $199/yr** (5.0: sleep, strain, recovery); **Peak $239/yr** (5.0 + Healthspan/WHOOP Age, Health Monitor); **Life $359/yr** (MG + ECG, BP Insights) ([Trusted Reviews](https://www.trustedreviews.com/versus/whoop-life-vs-peak-vs-one); [CNBC](https://www.cnbc.com/2025/05/08/whoop-wearables-whoop-50-mg-price.html)) | **Google Health Premium**: $9.99/mo; $99.99/yr per [Android Authority](https://www.androidauthority.com/google-health-premium-price-inclusions-features-3664507/), $99/yr per [TechCrunch](https://techcrunch.com/2026/05/07/googles-9-99-per-month-ai-health-coach-launches-may-19/) |
| Core scores without paying | None: subscription required | Free app; Readiness went free in Sept 2024 ([9to5Google](https://9to5google.com/2024/09/11/fitbit-free-readiness-score/)) |
| AI coach | WHOOP Coach [U] | Gemini **Google Health Coach**, Premium-only. Also bundled with Google AI Pro/Ultra in 30+ countries ([Android Authority](https://www.androidauthority.com/google-health-app-coach-rebrand-3664205/)) |
| Bundles and add-ons | Advanced Labs sold without membership from 18 Aug 2026 ([WHOOP press](https://www.whoop.com/us/en/press-center/whoop-makes-advanced-labs-available-without-a-wearable-membership/)) | Air includes a 3-month Premium trial |

Sources conflict on whether WHOOP's Stress Monitor sits in One or only in Peak and Life.

**Year-one cost is a wash.** An Air plus a year of Premium costs about the same as WHOOP One. Google's free tier, though, keeps most core scores. A third-party WHOOP-style app is therefore competing with Google's paid Gemini coach, not with Google's free Readiness number.

## Both brands say "RMSSD" but measure different parts of the night

The method differences matter more than the sensor differences, because they decide whether a Fitbit number can stand in for a WHOOP number at all.

| Metric | Fitbit / Google method | WHOOP method |
|---|---|---|
| **HRV** | RMSSD from optical beat intervals [V] ([Google Health Help](https://support.google.com/fitbit/answer/14237938?hl=en)) in 5-min windows overnight, shown as a nightly aggregate ([Versa 4 study](https://www.researchgate.net/publication/397730635_Agreement_between_Fitbit_Versa_4_and_a_reference_standard_on_time-domain_nocturnal_heart_rate_variability_A_pilot_study)). Uses the longest sleep >3 h [R] ([Engadget](https://www.engadget.com/2300292/what-fitbit-heart-rate-variability-tells-you/)). The API returns both a whole-sleep average and a **separate deep-sleep RMSSD**, plus intraday HRV samples with LF/HF power [V] ([REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints)) | RMSSD in overlapping 5-min windows stepped every 30 s across the whole sleep. Wake is removed, and the weighted average gives more weight to slow-wave and later-night windows [V] ([WHOOP staff](https://community.whoop.com/t/hrv-extreme-spikes/6472/31); [WHOOP Recovery support](https://support.whoop.com/s/article/WHOOP-Recovery?language=en_US)). Older material described a single reading in the last slow-wave sleep (SWS) episode |
| **Resting HR** | Daily value; algorithm undisclosed. API flag `calculationMethod` = `WITH_SLEEP` or `ONLY_WITH_AWAKE_DATA` [V] | Measured during sleep "when your body is fully at rest" [V] ([Health Monitor](https://www.whoop.com/us/en/thelocker/health-monitor-feature/)). Whether it is a minimum or a mean is unpublished |
| **Respiratory rate** | Daily value plus per-stage statistics (full/deep/light/REM, each with SD and signal-to-noise) [V]. Computed in deep sleep, falling back to light sleep [U] | Breaths/min during sleep [V]. Algorithm unpublished |
| **Skin temperature** | API: absolute nightly mean, a 30-day median baseline, and the nightly SD over 30 days [V]. The app shows variation only; Air is relative-only [R] ([ennap](https://ennap.com/blogs/articles/google-fitbit-air-specs)) | Nightly, against a personal baseline, never absolute [V] ([WHOOP skin temp](https://www.whoop.com/us/en/thelocker/how-whoop-tracks-skin-temperature/)) |
| **SpO2** | Nightly average with bounds, from validated sleep minutes, plus 1-min samples. Filtering is stricter than in the legacy API, so expect gaps [V] ([API specifications](https://developers.google.com/health/migration/api-specifications)) | Sleep only, non-continuous [V] |
| **Sleep staging** | Awake/light/deep/REM, or a "classic" asleep/restless/awake fallback. A `stagesStatus` field explains why stages are missing, and sessions under 3 h are rejected for staging [V] | Wake/light/SWS/REM [V] ([Miller 2022](https://www.mdpi.com/1424-8220/22/16/6317)) |
| **Continuous HR** | API stores HR at **1-s resolution** [V]. In practice samples arrive about every 1 s during exercise and about 5–15 s otherwise [R] ([Fitbit Community](https://community.fitbit.com/t5/SDK-Development/Heart-Rate-Sensor-Frequency/td-p/4053856?nobounce); [developer report](https://community.fitbit.com/t5/Web-API-Development/About-heart-rate-intraday-with-1-seconds-scale/m-p/3419570)) | ~26 Hz on 5.0/MG, ~5 Hz on 4.0, 24/7 [R]. Updated algorithm Feb 2026 [V] |
| **HR zones** | AZM gives 1×/min in fat burn and 2×/min in cardio or peak, with a 150/week default goal [V] ([Google Help](https://support.google.com/fitbit/answer/14236509?hl=en)). Zone cut-offs are personalised and conflicting (heart-rate reserve, HRR, vs %max) [R]. API zones: LIGHT/MODERATE/VIGOROUS/PEAK with bpm bounds [V] | 5 zones on % of HRR (Karvonen). Zone 5 = 90–100%. Max HR starts age-estimated and rises when exceeded [V] ([WHOOP HRR](https://www.whoop.com/us/en/thelocker/why-whoop-uses-heart-rate-reserve-not-max-heart-rate/)) |
| **VO2max** | Cardio Fitness Score from RHR, age, sex and weight, sharpened by GPS runs [R] ([Lifestack](https://lifestack.ai/blog/fitbit-vo2-max)). 6 age/sex levels [V] ([Google Help](https://support.google.com/fitbit/answer/14237924?hl=en)). API exposes `measurementMethod` (`FITBIT_RUN`, `GOOGLE_DEMOGRAPHIC`), an `estimated` flag and a covariance [V] | Passive estimate from strain, zones and recovery; needs 14 recoveries in 21 days. WHOOP claims ±3.3–3.7 mL/kg/min vs lab [V claim] ([WHOOP](https://www.whoop.com/us/en/thelocker/estimate-your-vo-max-with-whoop-/)) |

**HRV windowing.** RMSSD is typically highest in deep sleep, and higher in late-night than early slow-wave sleep. A WHOOP value weighted toward late SWS should therefore sit at or above Fitbit's whole-sleep average and closer to Fitbit's deep-sleep RMSSD. That is a physiological inference, not a measured offset. Its implication is direct: **map WHOOP HRV to Fitbit deep-sleep RMSSD, never to the whole-sleep average, and compare only in personal-baseline space.**

**Resting heart rate.** WHOOP's is sleep-only. Fitbit's daily value may be computed purely from awake data on some days, which the API tells you through `calculationMethod`.

**Heart-rate sampling.** WHOOP-like dense sampling is not available. Fitbit's "1-second" stream is irregular, so it cannot be used to compute RMSSD. It is adequate for strain only if gaps are integrated by time, not counted by sample.

## Accuracy evidence is thin, mostly pre-2025, and never simultaneous

The validation literature cannot settle "which is more accurate", for two reasons:

- **No study wore both brands at once.**
- **Almost nothing covers current hardware.** WHOOP 5.0/MG, Fitbit Air and Edge, and Pixel Watch 4/5 have no independent HR, HRV or sleep validation.

What exists points to rough parity, with each brand ahead in different places.

| Measure (reference) | WHOOP | Fitbit / Pixel |
|---|---|---|
| Nightly HRV vs ECG | **4.0**: CCC 0.94, MAPE 8.17 ± 10.49%, mean bias −0.78 ms, absolute error 4.17 ms (Dial 2025, n=13, 536 nights) ([PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/)). **3.0**: ~4.5 ms underestimate, ICC 0.99 (Miller 2022) ([MDPI](https://www.mdpi.com/1424-8220/22/16/6317)). **2.0**: ln RMSSD bias 1.66 ± 1.80% ([PMC8160717](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8160717/)) | **Versa 4** pilot (n=8, Firstbeat ECG): Fitbit ~8% higher, "acceptable" Bland-Altman agreement ([SAGE](https://doi.org/10.1177/20552076251394960)). No Charge 6, Sense 2 or Pixel Watch HRV validation found |
| Nocturnal RHR vs ECG | **4.0**: CCC 0.91, MAPE 3.0%, bias −1.41 bpm (Dial 2025) ([PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/)). **2.0**: bias −0.17% ([PMC7849816](https://pmc.ncbi.nlm.nih.gov/articles/PMC7849816/)) | Charge 2 at rest: bias −1.1 bpm, LoA −5.6 to +3.4 ([ResearchGate](https://www.researchgate.net/publication/354845629_A_Validation_Study_Fitbit_Charge_2_Heart_Rate_Measurement_at_Rest_and_During_Cognitive-Emotional_Stressors)). No current-device RHR study |
| Respiratory rate vs PSG | **2.0**: bias 1.8%, precision 6.7% ([PMC7849816](https://pmc.ncbi.nlm.nih.gov/articles/PMC7849816/)) | HR-derived respiratory rate: MAE 0.46 br/min, MAPE 3% ([npj Digit Med](https://www.nature.com/articles/s41746-021-00493-6)). That Fitbit authored this study is unconfirmed [U] |
| 4-stage sleep vs PSG | **4.0**: kappa 0.37 ([Schyvens 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12038347/)). **3.0**: 60% agreement, kappa 0.44; total sleep time (TST) −12.2 min ([MDPI](https://www.mdpi.com/1424-8220/22/16/6317)) | **Sense** kappa 0.42, **Charge 5** 0.41 (same Schyvens study). Staging Fitbits show no significant TST bias in a meta-analysis ([Haghayegh 2019](https://www.jmir.org/2019/11/e16273)). Fitbit underestimates REM ([Chinoy 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8343587)) |
| Wake detection | All six devices in Schyvens: wake specificity 29–52% | Same |
| Exercise HR vs ECG/chest strap | No independent exercise validation found ([WeGuide](https://www.weguide.health/blog/whoop-clinical-research)) | **Pixel Watch 3**: MAPE 2.73%, bias −2.4 bpm, LoA −24 to +20 ([PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0356808)). **Charge 6**: MAPE 5.5%, CCC 0.93. **Pixel Watch 2**: MAPE 6.7%, CCC 0.87 ([JMIR Form Res 2026](https://pmc.ncbi.nlm.nih.gov/articles/PMC12912460/)) |
| SpO2, skin temperature | No independent validation | No independent validation |
| VO2max | Only the company claim of ±3.3–3.7 mL/kg/min | Pixel Watch 3 lab study exists (n=34), but its VO2max error was not retrievable ([PubMed](https://pubmed.ncbi.nlm.nih.gov/42743109/)) |

**Conflicts of interest.** WHOOP's strongest numbers come from WHOOP-affiliated work: Bellenger and Miller had a WHOOP-sponsored co-author, and Berryhill was WHOOP-run. The often-quoted 1.66% HRV bias is a **WHOOP 2.0** figure. The most independent test, Dial 2025, found WHOOP 4.0 HRV error comparable to Oura's but RHR error significantly worse ([PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/)).

**Window mismatch.** A published letter argued that Dial 2025 was not like-for-like. It compared WHOOP's SWS-weighted value against an all-night ECG average. The authors replied that undisclosed proprietary windows make matching impossible ([letter](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12701519/); [reply](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12706116/)). That exchange is the best evidence that **window definition, not sensor error, dominates cross-brand HRV differences.**

**Fitbit's newest bands.** The Edge's HR was "OK (though not great)" per DC Rainmaker ([DC Rainmaker](https://www.dcrainmaker.com/2026/10/fitbit-edge-depth-review-worth-the-upgrade.html)). The Air's workout HR has "wide error and coarse sampling" per the5krunner ([the5krunner](https://the5krunner.com/2026/05/07/fitbit-air-opinion-review-buyers-guide/)). These are reviewer opinions, but they argue for flagging high-intensity strain from bands as lower confidence than from Pixel Watches.

**Practical noise floors** follow from WHOOP 4.0's ±4–6 ms absolute HRV error and both brands' kappa of about 0.4:

- Night-to-night HRV changes under about 5–8% are noise on either brand.
- Per-stage minutes are not interchangeable on any individual night.
- Total sleep time is the most comparable sleep metric.
- Wake after sleep onset is the least reliable.

## Fitbit's scores match WHOOP's concepts but not their scales

Every WHOOP score has a Fitbit cousin except Healthspan. The cousins differ in range, cut-points, inputs and API availability.

| WHOOP score | Closest Google score | Key differences |
|---|---|---|
| **Recovery** 0–100%; red ≤33, yellow 34–66, green ≥67. Inputs: HRV vs 30-day baseline, RHR, respiratory rate, sleep, skin temp, SpO2, menstrual phase. Greyed out for 4 days ([WHOOP 101](https://developer.whoop.com/docs/whoop-101/); [WHOOP Basics](https://support.whoop.com/s/article/WHOOP-Basics?language=en_US)) | **Daily Readiness** 1–100; Low 1–29, Moderate 30–64, High 65–100. Inputs: HRV (vs past month), RHR, recent sleep. A 2024 change replaced the activity input with RHR. First score after 4 days; ~2 weeks for a good baseline ([Google Health Help](https://support.google.com/googlehealth/answer/14236710); [Fitbit Community](https://community.fitbit.com/t5/The-Pulse-Fitbit-Community-Blog/Interpret-your-Daily-Readiness-score-in-the-Fitbit-app/ba-p/5681401)) | Top band starts at 65 vs 67. Readiness omits respiratory rate, temperature and SpO2. **Not in the API data-type list** [V by absence] |
| **Sleep Performance**: sufficiency vs a dynamic **Sleep Need** (baseline + strain + debt − naps), plus consistency, efficiency and sleep stress | **Sleep Score** 0–100; Excellent 90+, Good 80–89, Fair 60–79, Poor <60. Legacy weights: duration ~50, deep+REM ~25, restoration ~25 ([Android Authority](https://www.androidauthority.com/fitbit-sleep-score-1111682/)) | Fitbit scores absolute duration and depth and has **no load-adjusted need**. Sleep was redesigned in April 2026 [R]. **Not in API** [V by absence] |
| **Strain** 0–21, logarithmic, HRR-based. Strain Target set from Recovery | **Cardio Load** (unitless TRIMP, resets daily) and **Target Load**, built from goal, acute:chronic ratio and Readiness, after 7 days of wear ([Google Help](https://support.google.com/fitbit/answer/15402655)) | Open-ended linear-ish scale vs compressed 0–21. Since app version 5.09, third-party workouts also earn Cardio Load ([9to5Google](https://9to5google.com/2026/09/25/google-health-5-09-release-notes/)). API exposure unknown [U] |
| HR zones 1–5 inside Strain | **Active Zone Minutes** | No WHOOP equivalent to AZM's weighted minutes. Zone definitions differ |
| **Stress Monitor**: real-time 0–3 from HR+HRV vs a 14-day baseline, motion-gated ([WHOOP](https://www.whoop.com/us/en/thelocker/introducing-stress-monitor-a-new-way-to-monitor-manage-stress/)) | **Stress Management Score**, daily 1–100: Responsiveness 30, Exertion Balance 40, Sleep Patterns 30. Plus **Body Response** cEDA alerts on Sense 2 and Pixel Watch ([Fitcoin](https://www.fitcoin.co/articles/fitbit-stress-management-score-explained)) | Daily summary vs live gauge. Body Responses are the closer analogue. A May 2026 rename to "Resilience" is single-source [R] |
| **Health Monitor** | **Health Metrics dashboard** | Same five vitals against personal ranges. Details unverified on both sides |
| **VO2max** estimate | **Cardio Fitness Score** | Different estimators. Treat both as trend-only |
| **Healthspan**: WHOOP Age + Pace of Aging, 9 metrics, 6-month window, weekly ([WHOOP](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)) | **None found** | Google's 2026 health additions (BP and Insulin Resistance Trends) are trends, not an age score |
| WHOOP Coach [U] | **Google Health Coach** (Gemini, Premium, GA May 2026) ([Droid Life](https://www.droid-life.com/2026/05/07/google-health-app-update-fitbit-coach-premium/)) | Google bundles conversational coaching. A third-party app has to differentiate on WHOOP constructs instead |

Three consequences follow for the app design.

**First, relabelling Fitbit scores is impossible through the API.** Readiness and Sleep Score do not appear among the Google Health API's data types, so the app must recompute them. That is an advantage in disguise: the app controls the baseline window, the cut-points and the inputs. It can, for example, add respiratory rate back into Recovery, which WHOOP uses and Fitbit Readiness dropped.

**Second, Sleep Need is the largest conceptual gap.** Fitbit has nothing that raises tonight's target after a hard day or a short night. The app has to build it from staged sleep and its own strain.

**Third, biological age is pure white space on Google's side.** That makes a WHOOP-Age-style score the clearest differentiator. It is also the score most sensitive to measurement semantics: %HRR zones counted only inside workouts, sleeping vs all-day RHR, and VO2max provenance.

## Fitbit adaptation rules: recompute everything, per device, with flags

### Data source and ingestion

**Use only the Google Health API v4.** Google ended support for the legacy Fitbit Web API on 30 September 2026 and turned it off, along with Fitbit OAuth, on 2 November 2026 ([API specifications](https://developers.google.com/health/migration/api-specifications)). [V]

**Setup and access limits:**

- New OAuth clients are unverified and **capped at 100 users**. Going past 100 requires a third-party security review.
- Refresh tokens **expire after 7 days in Testing** mode ([Setup](https://developers.google.com/health/setup)). [V]
- Read scopes: `googlehealth.activity_and_fitness.readonly`, `googlehealth.health_metrics_and_measurements.readonly`, `googlehealth.sleep.readonly` and `googlehealth.profile.readonly` ([Scopes](https://developers.google.com/health/scopes)).
- Users can grant scopes piecemeal, so every score must degrade gracefully. [V]

**Reading data:**

- Read daily types with `dailyRollUp`, in chunks of at most 90 days. Heart-rate rollups are limited to 14 days. Read sleep and exercise with `reconcile` to remove cross-device duplicates. Read intraday HR with paginated `list` calls ([Endpoints](https://developers.google.com/health/endpoints); [Data types](https://developers.google.com/health/data-types)). [V]
- Set `dataSourceFamily = google-wearables` so phone and manual entries are excluded. [V] This also keeps out third-party workouts that Google Health now imports. [D]

### Capability detection: detect from data, not from the device name

Capabilities differ within families and by region. SpO2 on the Air, for example, is not offered everywhere. So capability must be detected per user, per night. [D]

**Sources to combine:**

- `users.pairedDevices` gives `deviceVersion`, `features[]` and `lastSyncTime`. [V]
- `dataSource.device.displayName` on each data point, for example "Charge 6". [V]
- A rolling 14-night presence check for each data type. [D]

A capability is "present" when its data type returned values on at least 10 of the last 14 valid nights. [D]

| Tier [D] | Devices | Present | Absent or limited | Scores fully supported |
|---|---|---|---|---|
| **A: full** | Pixel Watch 2–5, Sense 2 | Multipath HR (Pixel only), deep-sleep RMSSD, RR, SpO2, dedicated skin temp, cEDA, ECG, GPS | Nightly charging gaps on Pixel Watch | All five; Strain highest-confidence |
| **B: GPS band/watch** | Edge, Charge 6, Versa 4 | HRV, RR, SpO2, skin-temp variation, GPS | cEDA (Charge 6 has a palm scan only; Edge none) | All five; Stress runs on HR/HRV only |
| **C: no GPS** | Air, Inspire 3, Luxe | HRV, RR, RHR, SpO2 (region), relative temp | GPS, so no run-based VO2max; ECG; EDA | Recovery, Strain, Sleep, Stress; Age with VO2max term disabled |

### WHOOP input to Fitbit field

| WHOOP input | Primary Google Health v4 field | Fallback | Transform and rule | Tag |
|---|---|---|---|---|
| Nightly HRV | `daily-heart-rate-variability.deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds` | `averageHeartRateVariabilityMilliseconds` | ln(RMSSD). Never mix the deep and whole-sleep series in one baseline: if deep is missing on >20% of baseline nights, switch the whole baseline to the whole-sleep series | Field [V]; mapping [D] |
| Sleeping RHR | 5th percentile of `heart-rate` samples inside the main sleep interval | `daily-resting-heart-rate.beatsPerMinute` when `calculationMethod = WITH_SLEEP` | If the value is `ONLY_WITH_AWAKE_DATA`, use it but raise the `RHR_AWAKE_ONLY` flag | Fields [V]; percentile [D] |
| Respiratory rate | `respiratory-rate-sleep-summary.fullSleepStats.breathsPerMinute` | `daily-respiratory-rate.breathsPerMinute` | Discard the night if `signalToNoise` falls in the user's bottom 10% | Fields [V]; threshold [D] |
| Skin temperature | `daily-sleep-temperature-derivations`: ΔT = `nightlyTemperatureCelsius − baselineTemperatureCelsius` | None | Scale by `relativeNightlyStddev30dCelsius` (floor 0.1 °C) | [V]/[D] |
| SpO2 | `daily-oxygen-saturation.averagePercentage` | None | Penalty only on downward deviation. Expect gaps from stricter filtering | [V]/[D] |
| Sleep timing and stages | `sleep` via `reconcile`: `metadata.mainSleep`, `nap`, `stagesStatus`, `stages[]`, `summary.*` | `CLASSIC` sessions (no stages) | Efficiency = minutesAsleep / time in bed, because no efficiency field exists | [V]/[D] |
| Intraday HR (Strain, Stress, zones) | `heart-rate` samples, `metadata.motionContext` | None | Time-weighted integration (see below) | [V]/[D] |
| HR zones | Recompute WHOOP %HRR zones from raw HR | — | **Never use** `daily-heart-rate-zones`, AZM or `heartRateZoneDurations` for WHOOP-style metrics | [D] |
| Workouts and strength time | `exercise` via `reconcile`: `exerciseType`, `interval` | — | Map strength enums such as `STRENGTH_TRAINING`, `WEIGHTLIFTING` and `HIIT` | [V] |
| Steps | `steps` `dailyRollUp` `countSum` | — | Exclude non-wear days (<10 h of HR coverage) | [V]/[D] |
| VO2max | `vo2-max` samples with `measurementMethod`, plus `daily-vo2-max.vo2Max` and `estimated` | `run-vo2-max.runVo2Max` | See the VO2max rules below | [V]/[D] |
| Lean mass % | 100 − `body-fat.percentage` | Manual entry | Optional; no effect if absent, as in WHOOP | [V]/[D] |
| Age / sex | `getProfile` age / **sex not exposed** | Onboarding form | Sex is required for TRIMP, VO2max and RHR targets | [V] |
| Menstrual phase | **Not readable** (the reproductive-health scope is write-only) | User-entered | Omit from Recovery unless the user enters it | [V] |

### Per-user calibration rules

| Rule | Specification | Tag |
|---|---|---|
| Baseline estimator | Robust median and 1.4826·MAD over the **previous 30 valid nights, excluding tonight**. SD floors: ln-HRV 0.05, RHR 1 bpm, RR 0.3 br/min, SpO2 0.5 pt | [D], following WHOOP's 30-day HRV baseline [V] |
| Stress baseline | 14 days | [V] window |
| Trend overlay | 7-day ln-RMSSD mean vs a 60-day normal range, HRV4Training-style ([HRV4Training](https://www.hrv4training.com/pro--teams-guide.html)) | [D] |
| Warm-up | No Recovery before 4 valid nights; "calibrating" until 14. Target load and strain normalisation after 7 days. Sleep Need baseline after 14 qualifying nights. Age unlocks at ≥21 valid nights in 31 days; "calibrating" until 90 days | 4-day, 7-day, 21/31 and 90-day gates [V]; 14 [D] |
| Device change | When `displayName` changes, open a **new baseline segment**. For the first 14 nights on the new device, rescale old-segment ln-HRV and RHR by the ratio of medians (new vs old) once ≥7 new nights exist. Flag `DEVICE_CHANGED` until 14 nights | [D]. Justified by Versa 4 reading ~8% high vs ECG and Pixel's different optics [V] |
| Cross-brand import (WHOOP history) | No fixed offset. If ≥14 nights of overlapping wear exist, fit a per-user linear map on ln-RMSSD and on RHR. Otherwise start a fresh baseline | [D]; no literature offset exists [V] |
| HRmax | Start at max(Gellish 192 − 0.007·age², observed). Raise to the 99.5th percentile of exercise HR over 90 days. Allow manual override | Gellish [V via WHOOP support]; percentile [D] |
| Exclusions | Nights flagged as illness or travel never enter baselines | [D] |

### Missing sensors and capabilities

| Missing | Affected WHOOP-style score | Rule | Tag |
|---|---|---|---|
| SpO2 (region-locked Air, Luxe, filtered nights) | Recovery | Drop the SpO2 penalty term. It is a one-sided penalty, so no reweighting is needed. Flag `NO_SPO2` (minor) | [D] |
| Skin temperature | Recovery, illness hint | Drop the temperature penalty. Illness detection then relies on RR+RHR. Flag `NO_TEMP` (minor) | [D] |
| Deep-sleep RMSSD | Recovery | Fall back to whole-sleep RMSSD with its own baseline segment. Flag `HRV_WHOLE_NIGHT` (minor) | [D] |
| Staged sleep (`CLASSIC` or `REJECTED_*`) | Sleep, Recovery | Sleep Performance from duration and efficiency only; consistency is still valid. Flag `NO_STAGES` (major) | [V] fields / [D] |
| EDA (all except Sense 2 / Pixel) | Stress | No change. WHOOP's Stress Monitor is HR+HRV+motion only, and Fitbit raw EDA is not among the API data types seen [U]. Optionally show Body Responses where available | [D] |
| GPS (Air, Inspire 3, Luxe) | VO2max, Age | Run-based VO2max will not exist; disable the VO2max term (see below) | [D] |
| ECG | None | ECG is not a WHOOP score input. Ignore | [V] |
| Biological sex | Strain, Age | Block Age. Use the averaged TRIMP coefficient for Strain and flag it | [D] |

### Sampling gaps and data quality

| Situation | Rule | Tag |
|---|---|---|
| Irregular intraday HR (~1 s in exercise, 5–15 s otherwise) | Each sample covers min(gap to next, 60 s). Gaps >5 min count as missing. Never compute RMSSD from intraday HR | [R] cadence / [D] |
| Low daily coverage | A day is valid at ≥10 h of HR coverage. Below 16 h, display Strain as a lower bound and flag `LOW_HR_COVERAGE` | [D] |
| Exercise windows | Integrate strain zones only inside `exercise` intervals for the Age zone metrics, which is how WHOOP counts them. Day Strain uses the whole cycle | [V]/[D] |
| Valid night | Main sleep ≥3 h, `stagesStatus = SUCCEEDED`, and both HRV and RHR present | [V] fields / [D] |
| Pixel Watch nightly charging | A missing night is skipped, not imputed. After 2+ consecutive misses, show Recovery as unavailable | [D] |
| Sync latency | Data appears only after the phone app syncs (~every 15 min). Compute Recovery once the main sleep is processed, and re-score if late HRV arrives | [V] sync / [D] |
| Manual sleep edits | `metadata.manuallyEdited = true`: use, but flag `SLEEP_EDITED` | [V]/[D] |
| Early Air firmware | Readiness, Cardio Load and AZM failed to populate at launch, and HR had lock-on problems ([DC Rainmaker](https://www.dcrainmaker.com/2026/05/fitbit-review-vs-whoop.html)). Apply the same quality gates; none of these Fitbit scores are needed | [R]/[D] |

### VO2max estimate types

Fitbit's Cardio Fitness Score is built partly from RHR, age, sex and weight ([Lifestack](https://lifestack.ai/blog/fitbit-vo2-max)). A non-run estimate is therefore largely circular inside a biological-age model that already counts RHR and age.

| `measurementMethod` / source | Meaning | Use in Age | Use in display | Tag |
|---|---|---|---|---|
| `FITBIT_RUN`, `run-vo2-max`, `exercise.metricsSummary.runVo2Max` | Estimated from a GPS-tracked run | **Yes**: 180-day mean of run estimates. Mark stale after 60 days with no run | Yes | Fields [V]; rule [D] |
| `GOOGLE_DEMOGRAPHIC` | Derived from profile data | **No.** Disable the VO2max term, as WHOOP does for missing lean mass, and flag `VO2_DEMOGRAPHIC` | Yes, labelled "estimate" | [V]/[D] |
| Other or unknown enum values (for example a resting-HR-based estimate) | Unconfirmed | No, until confirmed against real data | Yes | [U] |
| `estimated = true` with high `vo2MaxCovariance` | Low-precision estimate | Down-weight, or require ≥3 values in the window | Yes | [D] |

All wrist VO2max estimates are trend-only. Comparable devices show errors of roughly 5–15% [R]. Never convert between WHOOP and Fitbit VO2max beyond a per-user offset.

### Confidence flags

Each score carries a confidence level and its reason codes. [D]

| Code | Severity | Raised when |
|---|---|---|
| `CALIBRATING` | Major | Inside the warm-up gates above |
| `DEVICE_CHANGED` | Major | Fewer than 14 nights on a new device |
| `NO_STAGES` | Major | Sleep is `CLASSIC` or stages were rejected |
| `LOW_HR_COVERAGE` | Major | Less than 16 h of HR in the cycle (Strain) or a sleep HR gap over 20% (RHR) |
| `HRV_WHOLE_NIGHT` | Minor | Deep-sleep RMSSD is missing |
| `RHR_AWAKE_ONLY` | Minor | `calculationMethod = ONLY_WITH_AWAKE_DATA` |
| `NO_SPO2` / `NO_TEMP` | Minor | The input is absent tonight |
| `VO2_DEMOGRAPHIC` / `VO2_STALE` | Minor (Age) | No run-based VO2max in the window |
| `SLEEP_EDITED` | Minor | Sleep was edited manually |
| `BAND_HIGH_INTENSITY` | Minor (Strain) | A Tier B/C band recorded more than 20 min above 80% HRR, given the weak band HR accuracy at intensity |

The combination rule: **High** = no flags. **Medium** = 1–2 minor flags. **Low** = any major flag or 3+ minor flags. A Low Recovery is shown greyed, never coloured.

### Score recipes (condensed)

Every constant below is a reconstruction [D]. WHOOP has never published its weights. The **bands and windows are WHOOP's own [V]**.

```
RECOVERY  z_HRV=(lnRMSSD_deep−med)/sd ; z_RHR=−(RHR_sleep−med)/sd ; z_SP=(SleepPerf−85)/12
          pen_RR, pen_T, pen_O2 = min(1, 0.5·max(0, |z|−1.5))  (one-sided where physiological; drop if input absent)
          Z = 0.55·z_HRV + 0.25·z_RHR + 0.20·z_SP − pens ; Z* = Z / SD90(Z)
          Recovery = 100/(1+exp(−(1.06·Z*+0.44)))     → ~15% red, ~40% green at Z*~N(0,1)
          bands red 0–33 / yellow 34–66 / green 67–100 [V]
STRAIN    x = clamp((HR−RHR)/(HRmax−RHR),0,1); w = 0 if x<0.20 else x·0.64·e^(1.92x) (M) | x·0.86·e^(1.67x) (F)
          Load = Σ w·Δt_min (time-weighted, gap rules above); b = 6.4·ln(1+Load/20.5)
          Strain = 21·b/(b^12+21^12)^(1/12) ; bands 0–9 / 10–13 / 14–17 / 18–21 [V]
SLEEP     Need = Baseline(28-night low-strain median, 7–9 h) + 5 min·max(0,Strain−10) + Debt − naps
          SleepPerf = 0.55·Sufficiency + 0.20·Efficiency' + 0.15·Consistency' + 0.10·Stress' ; bands ≥85 / 70–85 / <70 [V]
STRESS    0–3 = motion_gate·[w·HR_score + (1−w)·HRV_score], 14-day baseline [V form]; w=1 when no HRV sample ≤5 min
AGE       age + 0.57·Σ R_i over 9 WHOOP metrics (180-day means), with zones from raw %HRR inside exercise,
          sleeping RHR, run-only VO2max; Pace = clamp((Age(age+0.5, 30-day means) − Age_now)/0.5, −1, 3)
```

The Strain constants were fitted to WHOOP's published anchors: a 1-hour walk is about 6.5, a 1-hour run about 12, a marathon about 20.4. The Age shrinkage factor of 0.57 reproduces WHOOP's four published 30-year-old reference cases within about 0.4 years. Both come from the earlier reconstruction in this research series.

A build is acceptable when it passes these checks [D]:

1. Over 90 days, Recovery is about 15% red and 40% green.
2. Swapping deep-sleep for whole-sleep RMSSD moves fewer than 10% of days across a colour band.
3. Moving the same user from a Charge 6 to a Pixel Watch shifts no more than 1 in 5 Recovery colours during the 14-night re-baseline.
4. Age changes by less than 0.5 years when demographic VO2max is toggled in or out. If it changes more, the VO2max term is double-counting RHR.

## Conclusion

The real divide between WHOOP and Fitbit is not sensor quality. The thin evidence suggests rough parity: WHOOP is slightly better on nocturnal HRV, Fitbit slightly better on sleep staging, and both are unproven on SpO2 and temperature. The divide is that WHOOP controls one measurement definition end to end, while Google's fleet produces the "same" metric under different optics, windows and charging habits. A WHOOP-style app on Fitbit data therefore succeeds or fails on bookkeeping more than modelling: baselines segmented by device, VO2max provenance, and RHR definition. The baseline-space design that this requires (per-user z-scores, no fixed offsets) also makes the app robust to the next Google device.

Two things change the build plan. First, because Google's API exposes raw nightly fields but not its own scores, a third-party app's Recovery is a derived score, not a relabelled Readiness number. It can legitimately include respiratory rate, temperature and SpO2 that Fitbit's Readiness omits, which brings it closer to WHOOP's input set than Google's own score. Second, the cheapest Google device, the $99 Fitbit Air, is the one least able to support a WHOOP-Age-style score. Without GPS it never produces a run-based VO2max, so the Age model must run on eight metrics and say so. Shipping an honest "VO2max not measured" flag is better than letting a demographic estimate quietly double-count resting heart rate.
