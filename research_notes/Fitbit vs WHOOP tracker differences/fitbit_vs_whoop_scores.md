# Fitbit / Google health scores and coaching vs WHOOP equivalents (as of November 2026)

> **Method and reliability note (read first).** In this research session, WebFetch could not reach support.google.com, community.fitbit.com, androidauthority.com, androidcentral.com or sensai.fit (DNS blocked in the sandbox). So these findings rest on search-engine snippets and summaries of those pages, not full-page reads. They also draw on a few third-party explainers. Items marked **[training-data, unverified]** come from the researcher's prior knowledge (cutoff mid-2026) and no source was retrieved for them in this session. Verify those items before treating them as fact. Google renamed the Fitbit app to **Google Health** on 2026-05-19, and Fitbit Premium became **Google Health Premium**. Help-center URLs now appear under both `support.google.com/fitbit/...` and `support.google.com/googlehealth/...`, so some feature names may have shifted.

## Q1. Daily Readiness Score (Fitbit) vs Recovery (WHOOP)

### Takeaway
Fitbit Daily Readiness runs from 1 to 100 and has three bands: Low 1–29, Moderate 30–64, High 65–100. It compares HRV, resting heart rate and recent sleep against a personal baseline. It needs 4 days of wear before the first score, and about 2 weeks for a good baseline. WHOOP Recovery runs from 0 to 100% and has three colour bands: red ≤33, yellow 34–66, green ≥67. It uses HRV (RMSSD in deep sleep), RHR, sleep and respiratory rate against a rolling baseline. Conceptually the two map almost one-to-one. The band cut points differ: Fitbit's top band starts at 65, WHOOP's at 67.

### Cited Findings
- **Fitbit bands:** Low readiness 1–29, Moderate 30–64, High 65–100, per a current Google support page version (snippet). — [Google Health Help: Daily Readiness](https://support.google.com/googlehealth/answer/14236710); [Fitbit Help mirror](https://support.google.com/fitbit/answer/14236710)
- **Labels changed over time.** The 2021 launch-era review called a score of 90 "Excellent readiness". Current sources use "High" instead of "Excellent". A query range of "30–69" for Moderate did not match any source found. — [DC Rainmaker, Fitbit Readiness review (Nov 2021)](https://dcrainmaker.com/2021/11/fitbit-readiness-review.html); [Google Health Help](https://support.google.com/googlehealth/answer/14236710)
- **Current inputs:** HRV, recent sleep and resting heart rate. A 2024 update replaced the original "activity" (fitness-fatigue) component with RHR. The Fitbit Community blog says "The 'activity' component of the score is replaced with 'resting heart rate'." HRV is measured against the past month. — [Fitbit Community blog: Interpret your Daily Readiness score](https://community.fitbit.com/t5/The-Pulse-Fitbit-Community-Blog/Interpret-your-Daily-Readiness-score-in-the-Fitbit-app/ba-p/5681401)
- **Original (2021) inputs:** activity (fitness fatigue), sleep and HRV, compared with a personal baseline. — [Fitbit Daily Readiness technology page](https://www.fitbit.com/global/us/technology/daily-readiness-score); [9to5Google, 2021 launch](https://9to5google.com/2021/08/25/fitbit-daily-readiness-score/)
- **Calibration:** you must wear the device for 4 days before the first score. Fitbit advises at least 2 weeks of consistent wear for a more accurate baseline. — [Google Health Help](https://support.google.com/googlehealth/answer/14236710)
- **Paywall change in 2024:** Readiness was originally a Premium feature. 9to5Google reported in Sept 2024 that it became free, alongside the Pixel Watch 3 / readiness revamp. The snippet did not show whether this covered all devices or only Pixel Watch 3. — [9to5Google, "Fitbit free readiness score" (2024-09-11)](https://9to5google.com/2024/09/11/fitbit-free-readiness-score/)
- **Readiness feeds Target Load.** Low readiness lowers the daily cardio target. — [Google Fitbit Help: Cardio load](https://support.google.com/fitbit/answer/15402655)
- **WHOOP Recovery bands:** green ≥67%, yellow 34–66%, red ≤33%. Sources differ on the endpoints (1–99 vs 0–100). — [Fitcoin, WHOOP Recovery explained (2026)](https://www.fitcoin.co/articles/whoop-recovery-score-explained); [Longevity Benchmark](https://www.longevitybenchmark.com/sleep/whoop-recovery-score-explained/)
- **WHOOP Recovery inputs:** HRV (heavily weighted; RMSSD measured during deep sleep), RHR, sleep and respiratory rate, each against the user's own rolling baseline. — [WHOOPal, Recovery](https://whoopal.com/whoop-recovery); [Fitcoin](https://www.fitcoin.co/articles/whoop-recovery-score-explained)

### Inferences
- **Mapping:** Fitbit Readiness maps to WHOOP Recovery. To show WHOOP-style colour bands from Fitbit data, either relabel Fitbit's bands (1–29 red, 30–64 yellow, 65–100 green) or compute your own score from raw HRV/RHR data.
- **Missing input:** Fitbit Readiness (post-2024) does not list respiratory rate as an input. WHOOP Recovery does. A WHOOP-style app on Fitbit data could add breathing rate to the score.
- **Load source:** Fitbit removed activity from Readiness. WHOOP's model also keeps prior-day strain out of Recovery and shows it through Sleep Need instead. In both systems, training load affects the next day indirectly rather than through the readiness score itself.

### Gaps
- Fitbit's exact baseline windows were not confirmed. The sources give only "HRV over the past month" and "4 days to first score, 2 weeks for accuracy". The weighting formula is not public.
- WHOOP's exact baseline window (often quoted as ~30 days) and calibration period (often quoted as ~4 days) were not confirmed by any retrieved source. **[training-data, unverified]**
- Not confirmed: whether the free Readiness of Sept 2024 now applies to all Fitbit devices in the Google Health app.

## Q2. Sleep Score, Sleep Profile, sleep schedule and smart wake (Fitbit) vs Sleep Performance / Sleep Need (WHOOP)

### Takeaway
Fitbit Sleep Score runs from 0 to 100. Its legacy split is duration about 50 points, quality (deep + REM) about 25 and restoration (sleeping HR and restlessness) about 25. Bands are Excellent 90–100, Good 80–89, Fair 60–79 and Poor <60. It describes how well you slept, not how much sleep you need. WHOOP Sleep Performance is a percentage of an individually calculated Sleep Need, adjusted for strain, sleep debt and naps, combined with consistency, efficiency and sleep stress. The big conceptual gap Fitbit leaves for a WHOOP-style app is a dynamic nightly sleep-need target.

### Cited Findings
- **Fitbit bands:** Excellent 90–100, Good 80–89, Fair 60–79, Poor <60. These are support-doc bands, not clinical cut-offs. — [sleepscorecalculator.com (2026)](https://sleepscorecalculator.com/fitbit-sleep-score.html); [Android Authority, Fitbit Sleep Score guide](https://www.androidauthority.com/fitbit-sleep-score-1111682/)
- **Fitbit components (legacy):** time asleep about 50% of the score, deep + REM time about 25%, restoration about 25%. Restoration falls with a higher sleeping heart rate or more movement. Sources disagree, and one lists six sub-inputs: duration, time to fall asleep, sound-sleep %, restlessness, awakenings and interruption time. — [Android Authority](https://www.androidauthority.com/fitbit-sleep-score-1111682/); [Rise Science](https://www.risescience.com/blog/sleep-score); [Fitcoin, Sleep score explained (2026)](https://www.fitcoin.co/articles/fitbit-sleep-score-explained)
- **Paywall (legacy):** free users saw the total plus the duration and quality components. The restoration breakdown was Premium-only. — [Android Authority](https://www.androidauthority.com/fitbit-sleep-score-1111682/)
- **2026 redesign:** Fitcoin refers to an April 2026 redesign of sleep in the app, and to "what happened to Sleep Profile animals". The details could not be verified, so Sleep Profile may have been removed or reworked in the Google Health app. — [Fitcoin (2026)](https://www.fitcoin.co/articles/fitbit-sleep-score-explained)
- **Gemini-era change:** a March 2026 coach update reportedly improved sleep-staging accuracy for Public Preview users. — [Notebookcheck](https://www.notebookcheck.net/Google-announces-new-personal-health-coach-features-for-Fitbit-users.1254691.0.html) (via search summary)
- **Fitbit Air:** Google claims its new heart-rate sensing improves sleep tracking by up to 15%. — [Gizmodo](https://gizmodo.com/googles-screenless-fitbit-air-relies-on-gemini-to-be-your-personal-health-coach-2000755566)
- **WHOOP Sleep Performance:** a percentage combining sufficiency (hours slept vs Sleep Need) with consistency, efficiency and sleep stress. — [Vanity Hero, WHOOP scores explained](https://vanityhero.com/whoop-scores-explained-recovery-strain-and-sleep/); [ValueCom](https://www.valuecom.com/blog/how-to-use-whoop-data)
- **WHOOP Sleep Need:** adjusted by recent strain and accumulated sleep debt. A short night raises the next night's need. — [Fitcoin](https://www.fitcoin.co/articles/whoop-recovery-score-explained); [Vanity Hero](https://vanityhero.com/whoop-scores-explained-recovery-strain-and-sleep/)

### Inferences
- **Mapping:** Fitbit Sleep Score maps only partly to WHOOP Sleep Performance. Fitbit scores absolute duration and depth. WHOOP scores against a personal, load-adjusted need. A WHOOP-style app on Fitbit would need to build Sleep Need (baseline need + strain adjustment + debt − naps) itself, from Fitbit sleep-stage and cardio-load data.
- **Sleep schedule:** Fitbit's bedtime guidance is the closest analogue to WHOOP's Sleep Planner. Neither was confirmed in detail in this session.

### Gaps
- **Sleep Profile [training-data, unverified]:** a Premium monthly chronotype analysis launched 2022, with about 10 metrics and six "sleep animals" (bear, dolphin, giraffe, hedgehog, parrot, tortoise). Its status in the Google Health app as of Nov 2026 was not confirmed.
- **Smart Wake [training-data, unverified]:** wakes you in light sleep within a window of about 30 minutes before the alarm, on Pixel Watch, Sense 2, Versa 4 and Charge 6. Not verified this session.
- **Fitbit sleep schedule / bedtime guidance [training-data, unverified]:** gives a recommended bedtime window and was Premium-associated. Not verified.
- **WHOOP Sleep Performance bands [training-data, unverified]:** often quoted as Optimal ≥85%, Sufficient 70–84%, Poor <70%. No source retrieved.
- Sources conflict on the current weights of Fitbit's sleep-score components after the 2026 app redesign.

## Q3. Cardio Load / Target Load and Active Zone Minutes (Fitbit) vs Strain and HR zones (WHOOP)

### Takeaway
Fitbit Cardio Load is a unitless, TRIMP-style daily HR-load number that starts at 0 each day. It arrived with Pixel Watch 3 in Aug 2024 and later came to Fitbits. Target Load is a daily recommended range. It comes from your training goal, an acute:chronic workload ratio (last week vs last month) and Daily Readiness, and it needs 7 days of wear to calibrate. WHOOP Strain is a capped, logarithmic 0–21 scale of cardiovascular load. Its daily Strain Target comes from Recovery. The two concepts map closely. The scales do not: Fitbit's is open-ended and linear-ish, WHOOP's is compressed into 0–21. Active Zone Minutes (AZM) are a separate minutes-in-zone metric: 1× in fat burn, 2× in cardio and peak, default goal 150 per week.

### Cited Findings
- **Target Load inputs:**
  - The training target you choose. "Maintain cardio fitness" keeps the target at your 4-week average cardio load.
  - Recent activity: the last week of load compared with the last month (ACWR).
  - Daily readiness: low readiness gives a lower target.
  — [Google Fitbit Help: Cardio load & target load](https://support.google.com/fitbit/answer/15402655)
- **Daily behaviour:** Cardio Load starts at zero each day. The target is for the whole day, not one workout. The first Target Load appears after 7 consecutive days and nights of wear. — [Google Fitbit Help](https://support.google.com/fitbit/answer/15402655)
- **Method:** Google uses a training impulse (TRIMP) method to calculate Cardio Load. One community user's own TRIMP calculation gave 66 against Fitbit's 67 for a 40-min treadmill run. That match is anecdotal. — [Android Central, Cardio Load & Target Load explained](https://androidcentral.com/wearables/fitbit-cardio-load-and-target-load-explained); [Fitbit Community thread](https://community.fitbit.com/t5/Charge-6/How-is-Cardio-load-calculated/m-p/5704967)
- **Not AZM:** Cardio Load is distinct from Active Zone Minutes, and Target Load is unitless rather than minutes. Community threads show user confusion on both points and report algorithm changes after app updates. — [Fitbit Community](https://community.fitbit.com/t5/Android-App/How-is-Cardio-Load-calculated/td-p/5803917); [Fitbit Community, "Cardio Load Feature is Nonsense" (Jun 2025)](https://community.fitbit.com/t5/Get-Moving/Cardio-Load-Feature-is-Nonsense/m-p/5807914)
- **AZM scoring:** 1 AZM per minute in fat burn (moderate), 2 AZM per minute in cardio (vigorous) or peak. Swimming earns 1 AZM per minute. Zones are personalised by fitness level and age. — [Google Fitbit Help: Active Zone Minutes](https://support.google.com/fitbit/answer/14236509?hl=en); [Fitabase KB](https://www.fitabase.com/resources/knowledge-base/learn-about-fitbit-data/active-zone-minutes/)
- **AZM zone thresholds conflict across sources:**
  - Personalised zones use heart-rate reserve (HRR): target = zone % × (estimated max HR − RHR) + RHR.
  - An older guide uses %max HR instead: fat burn 50–69%, cardio/peak ≥70%.
  - The commonly quoted HRR cut-offs of 40% / 60% / 85% were not confirmed on an official page.
  — [Validic KB](https://help.validic.com/space/VCS/2980773891/Fitbit+Active+Minutes+and+Active+Zone+Minutes); [repbeats](https://repbeats.com/blog/fitbit-heart-rate-zones)
- **Default weekly AZM goal:** 150, aligned with the WHO/AHA recommendation of 150 minutes of moderate activity. — [Wellness Project](https://wellnessproject.ai/learn/active-zone-minutes); [Android Central, What are AZM](https://www.androidcentral.com/wearables/what-are-fitbit-active-zone-minutes)
- **WHOOP Strain:** a 0–21 measure of cardiovascular load taken on. — [Vanity Hero](https://vanityhero.com/whoop-scores-explained-recovery-strain-and-sleep/); [Sensai, WHOOP strain guide](https://www.sensai.fit/blog/whoop-strain-score-guide)

### Inferences
- **Mapping:**
  - Fitbit Cardio Load maps to WHOOP Day Strain.
  - Fitbit Target Load maps to WHOOP's Recovery-based Strain Target / Strain Coach.
  - Fitbit AZM has no direct WHOOP equivalent. WHOOP shows time in its HR zones 1–5, as %max HR, inside Strain.
- **Implementation:** a WHOOP-style app could log-transform Fitbit's daily Cardio Load, or a TRIMP computed from intraday HR, onto a 0–21 scale. Because Fitbit's API exposes HR and zones, a developer could compute Strain-like values independently of the Cardio Load number.

### Gaps
- **Strain scale [training-data, unverified]:** WHOOP says Strain is logarithmic and "based on the Borg scale". Its bands are Light 0–9, Moderate 10–13, High 14–17 and All Out 18–21. No source retrieved this session.
- **Cardio Load availability:** which devices and app tiers have it as of Nov 2026, and whether Google Health Premium is required, was not confirmed. Prior knowledge says it was free on Pixel Watch 3 and later and expanded to recent Fitbits in early 2025. **[training-data, unverified]**
- **API access:** whether Cardio Load / Target Load are exposed in the Fitbit Web API / Google Health API was not researched.

## Q4. Stress Management Score / Body Response (Fitbit) vs Stress Monitor (WHOOP)

### Takeaway
Fitbit's Stress Management Score is a daily 1–100 score where higher means fewer physiological stress signs. It is built from Responsiveness (30 pts: HR, HRV, sleeping HR, EDA), Exertion Balance (40 pts) and Sleep Patterns (30 pts). Devices with a continuous EDA sensor (Sense 2, Pixel Watch 2 and later) also send Body Response notifications in real time. WHOOP Stress Monitor is a real-time 0–3 scale, driven by HR and HRV relative to the user's baseline. Fitbit's score is a daily summary. WHOOP's is a continuous live gauge, so it maps more closely to Fitbit's cEDA Body Responses than to the daily score.

### Cited Findings
- **Fitbit score structure:**
  - Daily 1–100; a higher score means fewer stress signs.
  - Responsiveness (out of 30), Exertion Balance (out of 40), Sleep Patterns (out of 30). This breakdown is based on Sense-era reporting.
  — [Fitcoin, Stress Management Score explained (2026)](https://www.fitcoin.co/articles/fitbit-stress-management-score-explained); [Tech Advisor](https://www.techadvisor.com/article/742445/fitbit-health-and-fitness-scores-and-stats-explained.html); [MyHealthyApple](https://www.myhealthyapple.com/complete-guide-to-fitbit-sense-stress-management-features/)
- **Responsiveness inputs:** HRV, elevated RHR, sleeping HR above resting, and EDA responses. EDA response counts feed the score. — [Ascent Medicine](https://ascentmedicine.com/how-to-interpret-your-fitbit-stress-management-score/); [Wellyhub](https://wellyhub.com/what-does-eda-mean-on-my-fitbit-a-guide-to-stress-tracking)
- **cEDA and devices:** Sense 2 and Pixel Watch 2 have a continuous EDA sensor for all-day stress-response detection (Body Responses). Devices without EDA rely on HR, HRV, activity and sleep only. — [Wellyhub](https://wellyhub.com/what-does-eda-mean-on-my-fitbit-a-guide-to-stress-tracking); [Kygo (2026)](https://www.kygo.app/post/pixel-watch-fitbit-stress-tracking-explained); [Connect the Watts, Sense 2 review](https://connectthewatts.com/2022/09/29/fitbit-sense-2-review/)
- **Possible 2026 rename (single source):** one 2026 article claims the Stress Management Score was switched to "Resilience" in May 2026 with the Google Health app, with the same three categories. This was not corroborated. — [Fitcoin (2026)](https://www.fitcoin.co/articles/fitbit-stress-management-score-explained)
- **WHOOP tier placement conflict:** third-party tier summaries list Stress Monitor as included in Peak/Life and not in One. — [open-vital](https://open-vital.com/blog/whoop-membership-cost-vs-free-alternatives); [arnav.au (Aug 2026)](https://arnav.au/2026/08/22/compare-whoop-5-0-one-vs-peak-vs-life-comparison-and-data-exposure/). The researcher's prior knowledge is that Stress Monitor is in all tiers including One **[training-data, unverified]**. Treat as conflicting.

### Inferences
- **Mapping:**
  - The Fitbit Stress Management Score (daily) is closest to a daily summary of WHOOP Stress Monitor. WHOOP also reports daily stress time-in-zone.
  - Fitbit Body Responses (cEDA events) map to WHOOP Stress Monitor's high-stress spikes.
- **What a WHOOP-style app can add:** a continuous 0–3 gauge from Fitbit intraday HR/HRV, if API granularity allows. Fitbit's raw EDA data is unlikely to be exposed via API (not verified).

### Gaps
- **Fitbit score bands [training-data, unverified]:** about 80–100 for few stress signs, 60–79 for some and 1–59 for many. Not verified.
- **Current paywall:** historically the score was free and the detailed breakdown Premium. Its status in Google Health (Nov 2026) was not confirmed.
- **WHOOP Stress Monitor definition [training-data, unverified]:** 0–3 scale (0–1 low, 1–2 medium, 2–3 high), based on HR and HRV vs a ~14-day baseline. No source retrieved.

## Q5. Health metrics dashboard (Fitbit) vs WHOOP Health Monitor

### Takeaway
Both products surface overnight HRV, RHR, breathing/respiratory rate, SpO2 and skin-temperature deviation against a personal range. The search done for this question (which also covered AZM) returned no results on the Fitbit Health Metrics dashboard, and none were found for WHOOP Health Monitor either, so details here are mostly unverified. Per third-party tier summaries, WHOOP Health Monitor is in the Peak and Life tiers.

### Cited Findings
- **WHOOP placement:** Health Monitor is in WHOOP Peak (and Life), not One, per third-party tier summaries. — [Trusted Reviews](https://www.trustedreviews.com/versus/whoop-life-vs-peak-vs-one); [open-vital](https://open-vital.com/blog/whoop-membership-cost-vs-free-alternatives)
- **Fitbit Air:** the new screenless band (May 2026) adds A-Fib (irregular rhythm) notifications. — [Forbes Vetted (2026-05-07)](https://www.forbes.com/sites/forbes-personal-shopper/2026/05/07/google-fitbit-air-launch-2026/)

### Inferences
- **Mapping:** the Fitbit Health Metrics dashboard maps to WHOOP Health Monitor. The value a WHOOP-style app adds here is mainly presentation: out-of-range flags, and feeding these metrics into recovery and illness signals.

### Gaps
- **Fitbit Health Metrics dashboard [training-data, unverified]:** shows breathing rate, HRV, RHR, SpO2 and skin-temperature variation with a "personal range" from about 30 days of data. The current night is free; 90-day trends were historically Premium. Not verified this session.
- **WHOOP Health Monitor metrics [training-data, unverified]:** RHR, HRV, respiratory rate, SpO2 and skin temp, each against baseline ranges. Not confirmed from a WHOOP source.

## Q6. Cardio Fitness Score (VO2 max) vs WHOOP VO2max; Fitbit/Google biological age or healthspan?

### Takeaway
Fitbit's Cardio Fitness Score is an estimated VO2 max (ml/kg/min). It is placed in one of 6 levels from Poor to Excellent by age and sex, using published norms; for example, Excellent starts at 60.4 for men aged 20–30 and 50.2 for women aged 20–30. The estimate comes from RHR, age, sex and weight, and is improved by GPS runs. WHOOP added a VO2 max estimate and makes VO2 max one input to its Healthspan / WHOOP Age (Peak tier and above). No Fitbit/Google biological-age or "healthspan" score was found as of Nov 2026.

### Cited Findings
- **Fitbit levels:** VO2 max falls into one of 6 cardio fitness levels, poor to excellent, based on published data for age range and sex. Example cut-offs: Excellent begins at 60.4 (men 20–30) and 50.2 (women 20–30). — [Google Health Help: Learn about your VO2 max](https://support.google.com/fitbit/answer/14237924?hl=en)
- **Fitbit inputs:** estimated from RHR, age, sex and weight; more accurate with GPS-tracked runs. A lab VO2 max can differ substantially. — [Lifestack](https://lifestack.ai/blog/fitbit-vo2-max); [Fitbit Community](https://community.fitbit.com/t5/Other-Charge-Trackers/cardio-fitness-vs-VO2-max/td-p/2517553)
- **Conflicting third-party levels:** a third-party chart uses 5 levels with different cut-offs, which conflicts with Google's 6-level table. Prefer Google's. — [peakvo2trainer](https://peakvo2trainer.com/blog/fitbit-cardio-fitness-score-by-age/)
- **WHOOP Healthspan:** reports WHOOP Age and Pace of Aging with habit recommendations, in the Peak tier and above. — [Trusted Reviews](https://www.trustedreviews.com/versus/whoop-life-vs-peak-vs-one); [Tom's Guide, WHOOP 5.0 review](https://www.tomsguide.com/wellness/fitness-trackers/whoop-5-0-review-should-you-give-a-whoop-about-this-new-tracker)

### Inferences
- **Mapping:** Fitbit Cardio Fitness Score maps to WHOOP VO2max.
- **What a WHOOP-style app adds:** WHOOP Age / Pace of Aging has no Fitbit equivalent, which makes it a clear differentiator. A developer would compute a biological-age-like composite from Fitbit metrics such as VO2max, RHR, HRV, sleep consistency, steps and zone-2 time.

### Gaps
- No Google/Fitbit biological-age, "Fitbit age" or healthspan feature was found. Fitbit Labs (experimental Premium features) was not researched in depth.
- **WHOOP VO2max [training-data, unverified]:** launched with WHOOP 5.0 / Healthspan (May 2025), estimated from HR data and activity. Its exact method was not retrieved.
- **WHOOP Healthspan inputs [training-data, unverified]:** about 9 metrics (sleep consistency, hours of sleep, HR zones 1–3 and 4–5 time, strength time, steps, VO2max, RHR, HRV), with Pace of Aging roughly from −1× to +3×. Not verified.

## Q7. Paywalls and pricing: Google Health Premium vs WHOOP One/Peak/Life

### Takeaway
Google Health Premium (formerly Fitbit Premium) costs $9.99/month or $99.99/year from May 2026, up from $79.99/year. It is included with Google AI Pro/Ultra in 30+ countries. The base Google Health app is free in 200+ countries. Premium's headline feature is the Gemini Google Health Coach; it also includes adaptive fitness plans and multimodal logging. WHOOP is subscription-only and the hardware is included: One $199/yr, Peak $239/yr, Life $359/yr (US). Fitbit-side hardware is a one-off purchase (Fitbit Air $99.99, with 3 months of Premium).

### Cited Findings
- **Price:** Google Health Premium replaces Fitbit Premium. The monthly price is unchanged at $9.99, and the annual price rises from $79.99 to $99.99. — [Android Authority](https://www.androidauthority.com/google-health-premium-price-inclusions-features-3664507/); [gHacks (2026-05-10)](https://www.ghacks.net/2026/05/10/fitbit-app-becomes-google-health-on-may-19-with-annual-subscription-price-increase/)
- **Rename date:** the Fitbit app becomes Google Health on 2026-05-19 via an automatic update, and data carries over. Wikipedia also states "June 2026" in one place, which is an internal inconsistency. — [Android Central](https://www.androidcentral.com/wearables/fitbit/the-old-fitbit-app-is-becoming-google-health); [Droid Life (2026-05-07)](https://www.droid-life.com/2026/05/07/google-health-app-update-fitbit-coach-premium/); [Wikipedia: Fitbit](https://en.wikipedia.org/wiki/Fitbit)
- **AI Pro / Ultra bundle:** Premium is now included with Google AI Pro and Ultra in 30+ countries (previously the UK only). The free Google Health app is available in 200+ countries. — [Android Authority](https://www.androidauthority.com/google-health-premium-price-inclusions-features-3664507/); [Google Store: Google Health Premium](https://store.google.com/us/product/google_health_premium?hl=en-US)
- **Premium features:** the Gemini Health Coach (out of preview as "Google Health Coach"), adaptive fitness plans and multimodal logging. — [Droid Life](https://www.droid-life.com/2026/05/07/google-health-app-update-fitbit-coach-premium/); [Android Authority](https://www.androidauthority.com/fitbit-google-health-app-3664322/)
- **Google Fit:** Google Fit is being retired, and its users must migrate to Google Health later in 2026. — [Android Authority](https://www.androidauthority.com/fitbit-google-health-app-3664322/)
- **WHOOP tiers (US):** One $199/yr, Peak $239/yr, Life $359/yr, hardware included.
  - One: sleep, strain and recovery.
  - Peak: adds Healthspan / WHOOP Age, Health Monitor (and Stress Monitor per these sources), plus a wireless charger.
  - Life: adds ECG and blood-pressure insights on WHOOP MG hardware.
  - UK Life price differs between sources (£349 vs £359).
  — [Trusted Reviews](https://www.trustedreviews.com/versus/whoop-life-vs-peak-vs-one); [Tom's Guide](https://www.tomsguide.com/wellness/fitness-trackers/whoop-5-0-review-should-you-give-a-whoop-about-this-new-tracker); [trackervs](https://trackervs.com/pricing/whoop-pricing/); [open-vital](https://open-vital.com/blog/whoop-membership-cost-vs-free-alternatives)
- **Possible Black Friday promo:** one source cites a WHOOP promotion from 19 Nov to 1 Dec at $189 / $199 / $299. Time-limited and unverified. — [via search summary; source among the WHOOP pricing results above]
- **Fitbit Air:** $99.99 screenless band, launched 2026-05-19, with about a week of battery and 3 months of Google Health Premium included. — [Google blog: Introducing Fitbit Air](https://blog.google/products-and-platforms/devices/fitbit/fitbit-air/); [Gizmodo](https://gizmodo.com/googles-screenless-fitbit-air-relies-on-gemini-to-be-your-personal-health-coach-2000755566); [thepixelcase review](https://thepixelcase.com/blogs/news/google-fitbit-air-review-complete-guide-the-99-screenless-tracker-that-changes-everything-2026)

### Inferences
- **Cost comparison:** a Fitbit Air at $99.99 plus Premium at $99.99/yr costs about the same as WHOOP One ($199/yr) in year one, and less in later years. The free tier keeps most core scores. A WHOOP-style third-party app competes mainly with the paid Gemini coach, not with the core scores.
- **Free vs Premium:** as of Nov 2026 the paywall seems to have moved from individual score breakdowns (the old Fitbit Premium model) to the AI coach and plans. This was not confirmed per score.

### Gaps
- A per-score free-vs-Premium matrix for Google Health (Readiness, Sleep Score breakdown, Sleep Profile, Stress/Resilience breakdown, 90-day health metrics) was not confirmed. The Android Authority article likely has it but could not be fetched.
- Older reporting put Fitbit Premium at $9.99/mo or $79.99/yr; one source said "$80/yr". This is consistent with the price change.

## Q8. Google's Gemini-powered personal health coach

### Takeaway
Google announced a Gemini-based personal health coach in 2025. It entered Public Preview in late Oct 2025 for US Android Fitbit Premium users, and expanded to iOS and 5 more countries (UK, Canada, Australia, NZ, Singapore) in Feb 2026, on 14 supported devices. It became the generally available "Google Health Coach" with the Google Health app launch on 2026-05-19, as the main Google Health Premium feature. It acts as a conversational fitness trainer, sleep coach and wellness advisor. It builds adaptive plans, can ingest uploaded PDFs, and its US preview users are slated for medical-records linking. Its WHOOP analogue is WHOOP Coach (GPT-powered, launched 2023) **[training-data, unverified]**.

### Cited Findings
- **Preview start:** Google's blog announced a Public Preview "starting tomorrow and over the next week" for eligible US Android Fitbit Premium users, with iOS "soon" (late Oct 2025). — [Google blog: personal health coach public preview](https://blog.google/products-and-platforms/devices/fitbit/personal-health-coach-public-preview/); [TechCrunch (2025-10-27)](https://techcrunch.com/2025/10/27/fitbits-revamped-app-with-gemini-powered-health-coach-rolls-out-to-premium-users/)
- **Feb 2026 expansion:** to iPhone and 5 new countries; eligibility requires Premium plus one of 14 supported devices, including Fitbit wearables and Pixel Watch. — [TechRepublic](https://www.techrepublic.com/article/news-fitbit-ai-coach-expands-ios-five-markets/); [Android Authority](https://www.androidauthority.com/google-personal-health-coach-preview-launch-3610243/)
- **Roles and inputs:** Google describes the coach as a fitness trainer, a sleep coach and a health and wellness advisor. Users can upload health data as PDFs. US preview users will "soon" be able to link medical records. A March 2026 update improved sleep staging. — [Google blog: Google Health & Fitbit Air](https://blog.google/products-and-platforms/products/google-health/google-health-fitbit/); [Gizmodo](https://gizmodo.com/googles-screenless-fitbit-air-relies-on-gemini-to-be-your-personal-health-coach-2000755566); [Notebookcheck](https://www.notebookcheck.net/Google-announces-new-personal-health-coach-features-for-Fitbit-users.1254691.0.html)
- **Always-available advisor:** a 24/7 advisor you can chat with about your biometrics, including training reminders. — [Forbes (2026-05-10)](https://www.forbes.com/sites/lucianapaulise/2026/05/10/meet-google-health--fitbit-air-now-every-leader-can-have-an-ai-coach/)
- **Out of preview:** the coach left preview as "Google Health Coach" with the May 2026 Google Health launch. It is a Premium feature alongside adaptive fitness plans. — [Droid Life](https://www.droid-life.com/2026/05/07/google-health-app-update-fitbit-coach-premium/)
- **Launch-date discrepancy:** a third-party blog says the wider rollout began 2026-05-19 and reached all users by 2026-05-26. Not confirmed by Google. — [Sensai blog](https://www.sensai.fit/blog/google-health-premium-fitbit-ai-coach-2026)

### Inferences
- **Mapping:** Google Health Coach maps to WHOOP Coach (and WHOOP's AI-generated daily outlook and weekly plans).
- **Differentiation:** Google bundles conversational coaching into Premium and AI Pro. A WHOOP-style app on Fitbit data would need to differentiate on WHOOP-specific constructs rather than on chat coaching: Strain 0–21, Recovery colours, Sleep Need, Stress 0–3, Healthspan / Pace of Aging.

### Gaps
- No source confirmed whether the coach generates structured, periodised workout plans, beyond the "adaptive fitness plans" label.
- Country list and device list for the coach after GA (Nov 2026) were not confirmed.
- Not researched: whether the coach is available to free-tier users in any limited form.
