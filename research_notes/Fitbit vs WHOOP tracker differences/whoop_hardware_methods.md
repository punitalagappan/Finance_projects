# WHOOP Hardware (4.0, 5.0, MG) and Measurement Methodology (as of Nov 2026)

> Research method note: all findings below come from web-search result snippets and summaries. In this session, direct page fetches of whoop.com, support.whoop.com, pubmed.ncbi.nlm.nih.gov, the5krunner.com and pipedot.org were blocked by the network sandbox, and the Perplexity tool was unavailable (no API credits). So numbers attributed to primary sources were seen through search excerpts, not read in full. Items marked **[OFFICIAL]** are WHOOP's own claims. Items marked **[INDEPENDENT]** are peer-reviewed or third-party measurements. Items marked **[SECONDARY]** come from blogs or reviews.

## 1. Sensors per model (PPG LEDs and photodiodes, sampling rate, IMU, temperature, SpO2, ECG, BP, battery, wear locations, display)

### Takeaway
WHOOP 4.0 introduced the current optical layout: 5 LEDs (3 green, 1 red, 1 IR) and 4 photodiodes. Teardown-based and review sources say WHOOP 5.0 and MG keep a similar optical array. The MG differs mainly by adding ECG electrodes for a single-lead ECG. The 5.0 and MG raise sampling to about 26 Hz (vs. a reported ~5 Hz on 4.0), are about 7% smaller, and claim 14+ days of battery (vs. 4-5 days on 4.0). No WHOOP model has a screen.

### Cited Findings
**WHOOP 4.0 (Sept 2021)**
- Optical sensor: 5 LEDs (3 green, 1 red, 1 infrared), up from 2 green LEDs on 3.0. Sources disagree on photodiodes: one says 4 photodiodes vs. 1 previously, another says 3.0 also had 4 photodiodes. [SECONDARY] — [Wearable Technologies](https://wearable-technologies.com/news/the-new-whoop-4-0-comes-with-pulse-oximeter-and-skin-temperature-sensor); [DC Rainmaker 4.0 announcement](https://www.dcrainmaker.com/2021/09/updated-announced-changed.html); [Gadgets & Wearables](https://gadgetsandwearables.com/2021/09/08/whoop-band-4/)
- WHOOP's own page credits the 5-LED / 4-photodiode configuration to the 4.0 sensor and says later models were built on that foundation. [OFFICIAL] — [WHOOP Locker: most accurate wearable HR/HRV](https://www.whoop.com/kr/en/thelocker/whoop-proven-most-accurate-wearable-in-heart-rate-heart-rate-variability-measurements)
- Red and IR LEDs enable blood-oxygen (SpO2) measurement. 4.0 also added a skin temperature sensor. [SECONDARY] — [Wearable Technologies](https://wearable-technologies.com/news/the-new-whoop-4-0-comes-with-pulse-oximeter-and-skin-temperature-sensor); [WHOOP Locker: how WHOOP tracks skin temperature](https://www.whoop.com/us/en/thelocker/how-whoop-tracks-skin-temperature/)
- "WHOOP Body" apparel with "Any-Wear" technology lets the 4.0 pod collect data off the wrist: torso, waist, calf (bicep band also sold). [SECONDARY] — [DC Rainmaker](https://www.dcrainmaker.com/2021/09/updated-announced-changed.html); [Gadgets & Wearables](https://gadgetsandwearables.com/2021/09/08/whoop-band-4/)
- 4.0 battery: about 4-5 days. [SECONDARY] — [CNBC May 2025](https://www.cnbc.com/2025/05/08/whoop-wearables-whoop-50-mg-price.html)

**WHOOP 5.0 and WHOOP MG (launched May 8, 2025)**
- Both went on sale May 8, 2025. 14+ day battery with a new wireless PowerPack. About 7% smaller than prior hardware. [OFFICIAL] — [WHOOP Press Center](https://www.whoop.com/us/en/press-center/whoop-unveils-5.0-MG/); [BusinessWire release](https://secure.businesswire.com/news/home/20250508546933/en/WHOOP-Unveils-WHOOP-5.0-and-WHOOP-MG-Powerful-New-Devices-with-Breakthrough-Health-and-Longevity-Features)
- CNBC: 14 days is about triple the 4-5 days of WHOOP 4.0. Real-world review reports range from 10-14 days. [SECONDARY] — [CNBC](https://www.cnbc.com/2025/05/08/whoop-wearables-whoop-50-mg-price.html); [WHOOP 5.0 vs 4.0 comparison](https://www.longevitybenchmark.com/wearables/whoop-5-vs-whoop-4/)
- **Sampling rate:** Several sources say 5.0/MG sample about 26 times per second (26 Hz), vs. about 5 Hz on 4.0. They describe this as a WHOOP claim covering heart rate, motion and temperature sensing. [OFFICIAL claim, reported secondhand] — [the5krunner sensor architecture](https://the5krunner.com/2025/06/16/whoop-4-0-vs-whoop-5-0-sensor-architecture-changes-detailed-technical-content/); [Practical Biohacker review](https://practicalbiohacker.com/review-of-whoop-5-0-better-battery-more-data/)
- A teardown-based article (the5krunner) lists about 26 Hz PPG and says the sensor can also run at 4 Hz and 52 Hz for other data. It cites FCC ID 2AJ2X-WS50 and *infers* (not confirmed) that the AFE is the Maxim/ADI MAX86171. [SECONDARY, inference] — [the5krunner](https://the5krunner.com/2025/06/16/whoop-4-0-vs-whoop-5-0-sensor-architecture-changes-detailed-technical-content/)
- **Conflicts on sampling:** T3 describes "26x faster" sampling than the prior generation, with no absolute rate. That wording likely garbles "26 times per second." One review site claims "100 Hz, always on" with no source. I found no source confirming 100+ Hz. — [T3](https://www.t3.com/active/fitness-trackers/whoop-5-0-wants-to-tell-you-your-true-age-and-how-to-reverse-it); [istanbul2023.org review](https://www.istanbul2023.org/whoop-review/)
- **5.0 vs. MG hardware:** Most sources say the two share the same form factor and optical/sensor platform. The MG adds conductive ECG electrodes (reported as integrated in the clasp) for a single-lead ECG. One review claims the MG has a "more sensitive medical-grade sensor," which contradicts the shared-sensor reports and is unverified. [SECONDARY] — [Vora 5.0 vs MG](https://askvora.com/blog/whoop-5-vs-whoop-mg); [WearableXP 5.0 vs MG](https://wearablexp.com/smart-wearables/whoop-5-0-vs-whoop-mg/); [the5krunner](https://the5krunner.com/2025/06/16/whoop-4-0-vs-whoop-5-0-sensor-architecture-changes-detailed-technical-content/)
- **ECG (Heart Screener, MG only):** FDA-cleared over-the-counter ECG software feature, reported as 510(k) K243236, cleared April 4, 2025. It is an on-demand, spot-check single-lead ECG cleared for AFib screening in adults 22+ without a pacemaker. [INDEPENDENT/regulatory, reported secondhand] — [MedGrade WHOOP MG review](https://medgrade.org/reviews/whoop-mg-review/); [WeGuide clinical research evaluation](https://www.weguide.health/blog/whoop-clinical-research)
- **Blood Pressure Insights (BPI):** It estimates systolic/diastolic ranges from PPG and is calibrated with cuff readings. It is not FDA-cleared. The FDA issued a warning letter to WHOOP on July 14, 2025, saying BPI was marketed without clearance because BP estimates are tied to diagnosing hypo/hypertension. WHOOP publicly said the FDA was "overstepping its authority" and kept the feature live. One review says the FDA later closed out the warning after WHOOP modified the feature and labeling. This could not be confirmed on fda.gov. — [FDA warning letter](https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/whoop-inc-709755-07142025); [CNBC](https://www.cnbc.com/2025/07/15/whoop-fda-blood-pressure-feature-wearables.html); [Men's Fitness](https://www.mensfitness.com/news/whoop-mg-fda); [PMC commentary "WHOOP, There It Is"](https://pmc.ncbi.nlm.nih.gov/articles/PMC12822547/); [MDDI](https://www.mddionline.com/wearable-medical-devices/to-be-or-not-to-be-a-medical-device-fda-vs-whoop)
- No new WHOOP hardware was found for 2026. The lineup is still 5.0 and MG, with 4.0 still supported. [SECONDARY] — [WHOOP 2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/); [Wikipedia: Whoop (company)](https://en.wikipedia.org/wiki/Whoop_(company))
- WHOOP is a screenless wearable. [SECONDARY] — [TechFitnessLab: What is WHOOP](https://techfitnesslab.com/what-is-whoop/)

### Inferences
- PPG optics have been essentially stable since 4.0 (3G/1R/1IR, 4 PDs). The 5.0/MG generational change is mainly sampling rate, power/battery, size and the MG's ECG electrodes, not a new optical layout.
- The "26x per second" wording is best read as ~26 Hz PPG sampling. Claims of 100+ Hz are unsupported. Developers should not assume beat-to-beat RR intervals at ECG-like temporal resolution. WHOOP likely interpolates or fits PPG peaks for HRV.
- Because WHOOP is screenless and bicep/apparel wear is supported, the pod can sit on body sites (upper arm, torso) where PPG signal quality during exercise can differ from wrist-worn Fitbit devices.

### Gaps
- No official WHOOP spec sheet confirming 5.0/MG LED or photodiode counts, IMU type (accelerometer vs. accelerometer + gyroscope, axes, range), or temperature sensor type was retrievable. The AFE chip identity is inference.
- Exact 4.0 sampling rate (~5 Hz reported) is from secondary sources only.
- No confirmation from fda.gov of a BPI warning-letter closeout.

## 2. How WHOOP measures HRV, RHR, respiratory rate, skin temp, SpO2, sleep staging and continuous HR

### Takeaway
WHOOP derives almost all recovery metrics from the sleep period. HRV is RMSSD computed in rolling 5-minute windows across the whole night (wake removed), then weighted toward slow-wave sleep and later sleep. RHR, respiratory rate, SpO2 and skin temperature are also sleep-period measurements. Skin temp is reported as deviation from a personal baseline. HR is sampled continuously 24/7.

### Cited Findings
- **HRV metric:** RMSSD (strictly, pulse-rate variability from PPG). The WHOOP developer API exposes it as `hrv_rmssd_milli`. [OFFICIAL/INDEPENDENT] — [PMC9505647 (WHOOP-linked paper)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9505647); [Gneta HRV comparison](https://www.gneta.app/blog/hrv-on-the-wrist-compared)
- **Current HRV windowing (WHOOP staff forum reply):** HRV is computed in overlapping 5-minute windows that step every 30 seconds across the entire sleep. Wake periods are removed and a weighted average of the remaining windows is taken. Windows during likely slow-wave sleep and windows later in the night get higher weight. [OFFICIAL, via WHOOP community staff] — [WHOOP Community: HRV extreme spikes](https://community.whoop.com/t/hrv-extreme-spikes/6472/31)
- **Older/marketing description:** "a dynamic average during sleep… weighted towards your last slow wave sleep stage each night." [OFFICIAL, quoted secondhand] — [Lifestack: WHOOP HRV](https://lifestack.ai/blog/whoop-hrv); [WHOOP Locker: HRV](https://www.whoop.com/the-locker/heart-rate-variability-hrv/)
- WHOOP staff acknowledged outlier HRV spikes and said they were looking at better filtering for the Recovery calculation. — [WHOOP Community](https://community.whoop.com/t/hrv-extreme-spikes/6472/31)
- **Recovery inputs:** One third-party source says Recovery compares nightly ln(RMSSD) against a ~14-day baseline. The log transform and 14-day length are NOT confirmed by WHOOP documentation in these results. [SECONDARY] — [Lifestack](https://lifestack.ai/blog/whoop-hrv); [WHOOP Locker: How Recovery works](https://www.whoop.com/us/en/thelocker/how-does-whoop-recovery-work-101/)
- **RHR:** Measured during sleep "when your body is fully at rest." **Respiratory rate:** breaths per minute during sleep. **SpO2:** measured only during sleep and non-continuously. **Skin temperature:** measured nightly and reported relative to a personal baseline built from prior sleeps, not as an absolute "normal." All four appear each morning in the Health Monitor. [OFFICIAL] — [WHOOP Locker: Health Monitor](https://www.whoop.com/us/en/thelocker/health-monitor-feature/); [WHOOP Locker: skin temperature](https://www.whoop.com/us/en/thelocker/how-whoop-tracks-skin-temperature/); [WHOOP Locker: vital signs](https://www.whoop.com/us/en/thelocker/what-your-normal-vital-signs-mean/)
- **Sleep staging:** 4 states (wake, light, slow-wave/deep, REM), validated against PSG in Miller 2022 using a multi-state categorization of wake/light/deep/REM. See section 5 for numbers. [INDEPENDENT] — [Miller et al. 2022, Sensors](https://www.mdpi.com/1424-8220/22/16/6317)
- **Continuous HR / algorithm:** In February 2026 WHOOP rolled out a new signal-processing algorithm that it says improves HR tracking across a range of conditions. the5krunner called it WHOOP's "biggest heart rate algorithm update yet." [OFFICIAL] — [WHOOP 2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/); [the5krunner Feb 2026](https://the5krunner.com/2026/02/28/whoop-heart-rate-accuracy-update/); [WHOOP Locker: how WHOOP measures heart rate](https://www.whoop.com/us/en/thelocker/a-look-behind-the-data-how-whoop-measures-heart-rate/)
- Third-party evaluation: nocturnal HR is strong, HRV and respiratory rate are good, sleep-stage discrimination is weak, and SpO2, skin temp and BP are effectively unproven independently. [SECONDARY] — [WeGuide](https://www.weguide.health/blog/whoop-clinical-research)

### Inferences
- The key methodological difference for a developer: WHOOP's nightly HRV is a **whole-night, stage-weighted RMSSD**, not a single window or a fixed deep-sleep segment. Values are not directly interchangeable with other vendors' nightly HRV even when both are labelled "RMSSD."
- WHOOP's ~26 Hz 24/7 sampling with no published idle-mode reduction is its marketing contrast to devices that duty-cycle PPG when idle. No WHOOP source in these results explicitly states "no reduced idle sampling," so treat it as implied, not documented.

### Gaps
- Whether RHR is the lowest value, the average over sleep, or the average over SWS was not found in retrievable sources (support.whoop.com was unreachable).
- Exact HRV weighting coefficients and the Recovery baseline window are not published.
- No official description of the respiratory-rate algorithm (e.g., PPG-derived respiratory modulation vs. accelerometer) was found.
- SpO2 sampling cadence during sleep is not specified.

## 3. WHOOP 5.0 / MG features (2025-2026) and subscription tiers and prices

### Takeaway
Since May 2025, WHOOP sells memberships in three tiers: One ($199/yr, 5.0), Peak ($239/yr, 5.0), and Life ($359/yr, MG). Peak adds Healthspan/WHOOP Age and stress features. Life adds the ECG Heart Screener and Blood Pressure Insights. Advanced Labs (Quest blood testing) launched afterward and, as of August 2026, is sold without a membership.

### Cited Findings
- Tier prices: WHOOP One $199/yr, Peak $239/yr, Life $359/yr. One and Peak ship with 5.0, Life ships with MG. Man of Many lists Peak at $199, which conflicts with the other sources. [SECONDARY] — [TrackerVS pricing](https://trackervs.pages.dev/pricing/whoop-pricing/); [Frontdesk Review (June 2026)](https://frontdeskreview.com/software/fitness-apps/whoop/); [CNBC](https://www.cnbc.com/2025/05/08/whoop-wearables-whoop-50-mg-price.html); [Man of Many](https://manofmany.com/tech/whoop-peak-membership-robinhood-platinum-card)
- Black Friday 2026: Peak 2-year $399 (vs. $478). — [Cybernews](https://cybernews.com/health-tech/whoop-early-black-friday-deals-2026-save-up-to-119-on-memberships/); [Wareable](https://www.wareable.com/deals/whoop-black-friday-deals)
- Launch features: Healthspan with WHOOP Age, Blood Pressure Insights, ECG Heart Screener (MG only), and women's Hormonal Insights. [OFFICIAL] — [WHOOP Press Center](https://www.whoop.com/us/en/press-center/whoop-unveils-5.0-MG/); [Forbes](https://www.forbes.com/sites/johnwerner/2025/05/08/the-all-new-whoop-the-worlds-most-powerful-health-wearable/); [TechTimes](https://www.techtimes.com/articles/310275/20250508/whoop-launches-50-whoop-mg-wearables-ecg-blood-pressure-monitoring-longevity-tracking.htm)
- **Healthspan / WHOOP Age:** Nine sleep, strain and fitness metrics are turned into a WHOOP Age (based on ~6 months of data) and a weekly Pace of Aging. Advanced Labs biomarkers do NOT affect WHOOP Age. Third-party guides say Pace of Aging compares 30-day averages with the 6-month baseline and updates weekly (Sundays). A critique notes that hazard-ratio-based age adjustments are published without confidence intervals. [OFFICIAL + SECONDARY] — [WHOOP Locker: Healthspan 9 metrics](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/); [Healthspan white paper](https://www.whoop.com/us/en/thelocker/Healthspan-Data-Meets-Longevity/); [Medium critique](https://medium.com/@cailbhe/is-whoop-really-able-to-measure-your-healthspan-728b88e69175)
- Upgrade backlash: members were initially told to pay $49 (5.0) or $79 (MG) or extend 12 months. WHOOP reversed this on May 10, 2025. — [Wikipedia](https://en.wikipedia.org/wiki/Whoop_(company))
- **Advanced Labs (2026):** It is powered in the US by Quest Diagnostics. In March 2026 WHOOP added a Women's Health biomarker panel and cycle-phase-specific reference ranges (Estradiol, LH, FSH) for Menstrual Cycle Insights users. Around April 2026 it added five specialized panels (heart, athletic performance, metabolic, women's, men's). On August 18, 2026 it began selling Advanced Labs without a wearable membership and added GRAIL Galleri multi-cancer test. Testing is reported at about $150 in the US. Healthspan pillars now display associated lab biomarkers. — [WHOOP press: Labs without membership](https://www.whoop.com/us/en/press-center/whoop-makes-advanced-labs-available-without-a-wearable-membership/); [WHOOP press: broadens Advanced Labs](https://www.whoop.com/us/en/press-center/whoop-broadens-whoop-advanced-labs-offering/); [Gadgets & Wearables Aug 2026](https://gadgetsandwearables.com/2026/08/18/whoop-advanced-labs-no-membership/); [WHOOP 2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/)
- May 8, 2026: WHOOP announced on-demand clinician access and new AI features. — [BusinessWire May 2026](https://www.businesswire.com/news/home/20260508464188/en/WHOOP-Expands-Health-Platform-with-On-Demand-Clinician-Access-and-New-AI-Features)

### Inferences
- The tier split mostly gates software/analytics (Healthspan in Peak) and MG-only hardware features (ECG, BPI in Life). One and Peak use identical 5.0 hardware.

### Gaps
- The individual nine Healthspan metrics were not listed in retrievable snippets (WHOOP's Locker page has them).
- Hormonal Insights methodology (which signals are used, e.g., skin temp/RHR/HRV across cycle phases) was not found in detail.
- A search result title referenced a cheaper WHOOP subscription using old 4.0 hardware (pipedot), but the page could not be read and no official confirmation was found.

## 4. Strain, HR zones and VO2max estimation

### Takeaway
WHOOP sets five HR zones as percentages of **heart rate reserve** (max HR minus resting HR), not % of max HR. Max HR starts from an age-based estimate and auto-updates when a higher HR is observed, or can be entered manually. Strain is a 0-21 scale of cardiovascular load. VO2max is estimated passively from strain, HR-zone and recovery data, requiring 14 recoveries in the last 21 days.

### Cited Findings
- Zones use the heart-rate-reserve (Karvonen) method incorporating max and current resting HR. The starting max HR is age-estimated and refined from workout data. If a higher HR is recorded during an activity, max HR auto-updates. Users can override it manually. WHOOP notes 220-minus-age can be off by 10-20 bpm. Zone 5 = 90-100% intensity. [OFFICIAL] — [WHOOP: Why WHOOP uses HRR](https://www.whoop.com/us/en/thelocker/why-whoop-uses-heart-rate-reserve-not-max-heart-rate/); [WHOOP: More personalized HR zones](https://www.whoop.com/us/en/thelocker/more-personalized-heart-rate-zones-with-whoop/); [WHOOP: target HR zone](https://www.whoop.com/us/en/thelocker/what-is-my-target-heart-rate-zone-how-to-measure-it/)
- Strain is a 0-21 scale. One third-party summary gives Zone 5 as 80-100% HRR, which conflicts with WHOOP's 90-100%. [SECONDARY] — [Ubie Health](https://ubiehealth.com/doctors-note/whoop-strain-score-tracking-measurement-insight-57101q7)
- VO2max: computed in the background from daily strain, HR zones and recovery data. Requires at least 14 recoveries in the last 21 days. WHOOP claims estimates fall within 3.3-3.7 mL/kg/min of lab-measured values (company claim, not independently verified). [OFFICIAL] — [WHOOP Locker: VO2 max estimate](https://www.whoop.com/us/en/thelocker/estimate-your-vo-max-with-whoop-/)

### Inferences
- Because zones are HRR-based and depend on nightly RHR, the same absolute HR can map to different zones on different days. Fitbit's zone method should be checked by the Fitbit researcher for comparison.
- Strain's 0-21 scale is reported as logarithmic in common descriptions, but no source retrieved here confirmed the exact transform.

### Gaps
- Exact Strain formula (TRIMP-style integration, log scaling, muscular-strain component) is unpublished.
- The specific age formula WHOOP uses for initial max HR (220-age vs. Tanaka) was not found.

## 5. Published validation numbers

### Takeaway
Independent PSG/ECG studies (mostly on older 2.0/3.0 hardware, often WHOOP-funded or with WHOOP-affiliated authors) show very good nocturnal HR agreement, small HRV underestimation, and only moderate sleep-staging agreement (~60%, kappa 0.44). The often-quoted "1.66% HRV bias" comes from a WHOOP 2.0 study. The first independent multi-device study of WHOOP 4.0 (Dial et al. 2025) found HRV MAPE about 8% and called WHOOP's RHR agreement "moderate."

### Cited Findings
- **Bellenger et al. 2021, Sensors 21:3571 (WHOOP 2.0 vs ECG):** ln(RMSSD) bias 1.66 ± 1.80%, LoA ±5.93% (best with a 200 ms filter / WHOOP proprietary filter). HR agreement was acceptable. HRV bias/LoA approached or exceeded the smallest worthwhile change. Co-author Miller's position was WHOOP-sponsored. [INDEPENDENT, WHOOP-affiliated] — [PMC8160717](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8160717/); [Correction](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9031712/)
- **Miller, Sargent & Roach 2022, Sensors 22(16):6317 (6 devices incl. WHOOP 3.0, n=53, vs PSG/ECG):** HRV underestimated by 4.5 ms (absolute bias 4.7 ms, ICC 0.99, LoA −2.9 to 12.3 ms). HR underestimated by ~0.3 bpm (ICC 0.99). TST underestimated by 12.2 min (absolute bias 30.3 min, LoA ±61.2 min). Two-state sleep/wake 86% agreement (κ=0.44). Four-state (wake/light/deep/REM) 60% agreement (κ=0.44), vs. Oura 61% (κ=0.43) and Polar 51% (κ=0.28). No device was adequate for specific stages. A preprint version reported 89%/κ 0.49, so cite the published values. [INDEPENDENT] — [MDPI](https://www.mdpi.com/1424-8220/22/16/6317); [PMC9412437](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9412437/); [ResearchGate](https://www.researchgate.net/publication/362863530_A_Validation_of_Six_Wearable_Devices_for_Estimating_Sleep_Heart_Rate_and_Heart_Rate_Variability_in_Healthy_Adults); [Science Behind Wearables summary](https://thesciencebehindwearables.substack.com/p/how-well-can-your-wearable-track-263)
- **Berryhill et al. 2020, J Clin Sleep Med 16(5):775-783 (WHOOP 2.0 vs PSG, n≈32, NCT03692195):** HR bias −0.17%, precision 1.5%. Respiratory rate bias 1.8%, precision 6.7% (vs ECG and inductance plethysmography). WHOOP's own podcast describes the results as "within one unit of truth," which is company framing. [INDEPENDENT, WHOOP-involved] — [PMC7849816](https://pmc.ncbi.nlm.nih.gov/articles/PMC7849816/); [JCSM](https://link.springer.com/article/10.5664/jcsm.8356); [WHOOP podcast 62](https://www.whoop.com/us/en/thelocker/podcast-62-whoop-sleep-validation-study/)
- **Dial et al. 2025, Physiological Reports (5 wearables incl. WHOOP 4.0 vs ECG, 536 nights):** WHOOP HRV CCC 0.94, MAPE 8.17 ± 10.49%. RHR agreement was "moderate." Oura performed best on both. [INDEPENDENT] — [PMC12367097 / phy2.70527](https://pmc.ncbi.nlm.nih.gov/articles/PMC12367097/table/phy270527-tbl-0003); [Citedrive](https://www.citedrive.com/en/discovery/validation-of-nocturnal-resting-heart-rate-and-heart-rate-variability-in-consumer-wearables/)
- 2025 Sleep Advances study of six wrist sleep trackers vs PSG for staging exists. WHOOP-specific numbers were not extracted. — [Sleep Advances zpaf021](https://academic.oup.com/sleepadvances/article/6/2/zpaf021/8090472)
- A 2024 systematic review (medRxiv) of WHOOP accuracy found similar trends for sleep/wake/staging vs PSG. — [medRxiv 2024.01.04.24300784](https://www.medrxiv.org/content/10.1101/2024.01.04.24300784v1.full)
- WHOOP's own marketing ("most accurate wearable for HR/HRV") republishes the Miller 2022 figures. [OFFICIAL framing] — [WHOOP Locker](https://www.whoop.com/us/en/thelocker/whoop-proven-most-accurate-wearable-in-heart-rate-heart-rate-variability-measurements/); [WHOOP sleep accuracy page](https://www.whoop.com/us/en/thelocker/how-well-whoop-measures-sleep/)

### Inferences
- Most strong WHOOP validation numbers predate the 5.0/MG hardware and the Feb 2026 algorithm update. No independent validation of 5.0/MG HR/HRV/sleep was found.
- The 1.66% figure is a WHOOP 2.0 ln(RMSSD) bias and should not be cited as a current-hardware accuracy figure. The independent WHOOP 4.0 study shows larger error (MAPE ~8%), though the metrics differ and are not directly comparable.
- Conflicts of interest are common (WHOOP-sponsored authors in Bellenger/Miller, WHOOP-run Berryhill). Dial et al. 2025 is the most independent multi-device comparison.

### Gaps
- No independent validation of WHOOP SpO2, skin temperature, Blood Pressure Insights, or VO2max estimates was found.
- No published accuracy data were found for the MG ECG AFib classifier (sensitivity/specificity from the 510(k)).
- No independent validation was found of the 5.0/MG ~26 Hz sensor or the Feb 2026 HR algorithm.
