# WHOOP Core Daily Scores (Recovery, Strain, Sleep Need/Performance, Stress) and Open Re-implementations

Research date: 2026-11-18. Method note: direct fetches of whoop.com, support.whoop.com and patents.google.com were blocked by this session's network policy, so WHOOP and patent text was read from search-engine page extracts (Perplexity search with domain filters), which quote the pages. URLs below are the original pages. Labels used: **[OFFICIAL]** = WHOOP support/Locker/developer docs; **[PATENT]** = WHOOP-assigned patent text (describes "embodiments", which may not be what ships); **[3RD-PARTY]** = open-source or blog reconstructions (not WHOOP's numbers).

---

## 1. Recovery: inputs, weights, baselines, zones

### Takeaway
Recovery is a 0-100% morning score, fixed for the day, banded Green 67-100 / Yellow 34-66 / Red 0-33. HRV (RMSSD measured during sleep, weighted toward slow-wave and late-night sleep) is the input with the most weight. RHR is the other major input. Sleep performance, respiratory rate, skin temperature, SpO2 and menstrual phase add context. Each input is compared to the user's own rolling baseline: WHOOP names a ~30-day window, and older material also mentions 3- and 7-day windows. WHOOP has never published numeric weights or the final mapping function.

### Cited Findings
- **[OFFICIAL] Zones:** GREEN 67-100% ("well recovered and primed to perform"), YELLOW 34-66% ("maintaining... moderate amounts of strain"), RED 0-33% ("rest is likely what your body needs"). Recovery "does not change over the day (unless you edit your sleep which triggers a Recovery score re-calculation)." — [WHOOP 101, developer.whoop.com](https://developer.whoop.com/docs/whoop-101/)
- **[OFFICIAL] Inputs (developer docs):** "resting heart rate (RHR), heart rate variability (HRV), respiratory rate, sleep duration/quality, skin temperature, and blood oxygen," using "measurements from the previous day and your sleep." — [WHOOP 101](https://developer.whoop.com/docs/whoop-101/)
- **[OFFICIAL] Inputs (support, 2026):** HRV, RHR, Respiratory Rate, Sleep Duration and Quality, Skin Temperature, SpO2, "and Menstrual Cycle Phase (when applicable)." — [WHOOP Basics](https://support.whoop.com/s/article/WHOOP-Basics?language=en_US)
- **[OFFICIAL] Narrower Locker phrasing:** "WHOOP uses HRV, resting heart rate, respiratory rate, and sleep performance to calculate your Recovery Score." — [HRV: What It Means](https://www.whoop.com/us/en/thelocker/heart-rate-variability-hrv/). Other WHOOP pages list 4 core metrics: HRV, RHR, sleep, respiratory rate. — [How does WHOOP Recovery work 101](https://whoop.com/thelocker/how-does-whoop-recovery-work-101)
- **[OFFICIAL] HRV measurement window, current wording:** "WHOOP calculates HRV using a weighted average across your entire night of sleep, with more weight given to slow-wave sleep (SWS) and later stages of the night." HRV is "one of the two biggest contributors to Recovery" and is compared "to your 30-day baseline." — [WHOOP Recovery support article (2025)](https://support.whoop.com/s/article/WHOOP-Recovery?language=en_US)
- **[OFFICIAL] HRV measurement window, older and Locker wording:** "WHOOP measures your HRV during your final slow-wave sleep stage each night." — [HRV for Athletes](https://www.whoop.com/us/en/thelocker/heart-rate-variability-a-coachs-review-of-the-uses-and-value-of-hrv-data-in-athletes/). Other pages say "during your deepest sleep each night." — [HRV Training](https://www.whoop.com/us/en/thelocker/heart-rate-variability-training/)
- **[OFFICIAL] Metric is RMSSD:** RMSSD from PPG beat detection, "validated against ECG to a bias of 1.66% with limits of agreement of ±5.93%." "HRV is the most heavily weighted input into your daily Recovery score." — [HRV: How to Read and Improve](https://www.whoop.com/us/en/thelocker/heart-rate-variability-how-to-read-and-improve-your-hrv/)
- **[OFFICIAL] Why SWS (podcast 29, Emily Capodilupo):** HRV is higher in REM but REM is "more vulnerable to respiratory shifts and sleep disordered breathing." SWS gives "a lower HRV value, but a more comparable one." "Recovery is grayed out for the first four days because the score is not useful until a personal baseline exists." HRV is "the main input," RHR "adding context," and sleep "contributing supporting information rather than dominating." — [Podcast 29](https://www.whoop.com/us/en/thelocker/podcast-29-heart-rate-variability-hrv/)
- **[OFFICIAL] Multi-window baselines (podcast 51, Will Ahmed):** "we measure heart rate variability during [slow-wave sleep]. And then we're able to compare your baseline over 3-day, 7-day, and 30-day moving averages." — [Podcast 51](https://www.whoop.com/us/en/thelocker/podcast-51-what-is-whoop/)
- **[OFFICIAL] Sleep's weight:** Sleep "has less weight in the algorithm than HRV" but is "often the clearest explanatory variable." Respiratory rate was added (2020 recovery update) because it held next-day performance information "not already captured by HRV, resting heart rate, and Sleep." — [Podcast 84: Recovery update](https://www.whoop.com/us/en/thelocker/podcast-84-recovery-update/) (via search extract)
- **[OFFICIAL] Recent change:** "WHOOP now accounts for Sleep Consistency and Sleep Stress factors, which may slightly adjust Recovery trends over time." — [WHOOP Cycles](https://support.whoop.com/s/article/WHOOP-Cycles?language=en_US)
- **[OFFICIAL] Cycle logic:** "One Recovery score per Sleep-to-Sleep cycle". "Naps do not generate a new Recovery score but help reduce Sleep Need." — [WHOOP Cycles](https://support.whoop.com/s/article/WHOOP-Cycles?language=en_US)
- **[PATENT] HRV timing:** claims "determining an end of a most recent slow wave sleep state occurring most recently before the waking event; calculating a heart rate variability... at the end of the most recent slow wave sleep state." If the sleeper is woken early, "a last recorded episode of REM sleep or some other phase" may be used. HRV is computed "for a window of predetermined duration within the slow wave sleep period having the highest quality of heart rate data." — [EP3766410B1](https://patents.google.com/patent/EP3766410B1/en); [WO2022187019A1](https://patents.google.com/patent/WO2022187019A1/en)
- **[PATENT] Composition:** "the recovery score is a weighted combination of the user's heart rate variability (HRV), resting heart rate, sleep quality indicated by a sleep score, and recent strain (indicated... by the intensity score)." — [US9750415B2](https://patents.google.com/patent/US9750415B2/en)
- **[3RD-PARTY] Empirical drivers:** A regression on 306 days of one user's WHOOP export found HRV β=+1.18 per ms, RHR β=−1.87 per bpm, sleep efficiency β=−0.41, R²=0.467. — [chaganty18/WHOOP-recovery-analysis](https://github.com/chaganty18/WHOOP-recovery-analysis). The NOOP fork reports that, using WHOOP's own inputs, WHOOP Recovery correlates most with sleep performance (r=0.80), then the HRV/RHR ratio (r=0.78), HRV (r=0.74) and RHR (r=−0.63). Respiration and skin temp are near zero. A multi-parameter fit on 8 nights overfit (0.849 in-sample vs 0.575 leave-one-out). — [ribhupanwar/Woop RR-OPTIMIZATION.md](https://github.com/ribhupanwar/Woop/blob/main/docs/RR-OPTIMIZATION.md)
- **[3RD-PARTY] Reconstruction marked as a guess (Halo project):** z_HRV=(ln RMSSD−μ30)/σ30; z_RHR=−(RHR−μ)/σ; z_SP=(SP−85)/12; z=0.55·z_HRV+0.25·z_RHR+0.20·z_SP; respiratory-rate penalty if z_RR>1.5. Recovery=100·Φ(z/1.1) or a logistic, "calibrated so the mean is about 58 and the 34/67 cut-offs give about 15% red and 40% green." — [S0ulArk/halo whoop-garmin.md](https://github.com/S0ulArk/halo/blob/main/docs/research/whoop-garmin.md)
- **[3RD-PARTY] Other published weightings:**
  - NOOP/Woop "Charge": wHRV 0.55, wRHR 0.20, wSleep 0.15, wResp 0.05, wSkinTemp 0.05 (symmetric penalty). Sleep term (sleepPerf−0.85)/0.12. EWMA baselines with MAD→σ factor 1.253. — [Woop ANALYTICS.md](https://github.com/ribhupanwar/Woop/blob/main/docs/ANALYTICS.md)
  - fitbit-mcp: HRV 45% / RHR 30% / sleep 25% as z-scores vs prior 28 days, then a logistic. — [pranshavpatel/fitbit-mcp](https://github.com/pranshavpatel/fitbit-mcp)
  - akshatksingh18/whoop: ln HRV .35, RHR .25, sleep .20, resp .12, temp .08. Robust z = median/(1.4826·MAD) over up to 28 eligible nights within 60 days (≥14 needed). score=100/(1+e^(−z)). — [energy-recovery-independent-review.md](https://github.com/akshatksingh18/whoop/blob/main/energy-recovery-independent-review.md)
  - ZHOOP blog: HRV 60% + RHR 20% weighted z, then score=100/(1+exp(−1.6·(z+0.20))). — [Rusheel Raj, "Reverse Engineering Whoops"](https://www.rusheelraj.com/blog/whoop/)
- **[3RD-PARTY] Summary of what is public:** WHOOP Recovery: "HRV and resting heart rate are the biggest contributors. HRV is compared with a 30-day baseline... Missing: numerical weights, input transformations, and final scoring function." The same post gives an illustrative (not validated) formula: Readiness = 50 + 10·z_HRV − 5·z_RHR + 5·z_sleep, with z vs the previous 30 nights. — [empirical.health](https://www.empirical.health/blog/apple-watch-readiness-score/)

### Inferences
- A defensible WHOOP-style Recovery for Fitbit data:
  1. Take nightly ln(RMSSD). Prefer deep-sleep RMSSD if available; else the whole-night value.
  2. Take sleeping RHR (lowest sustained or 5th-percentile sleeping HR), sleeping respiratory rate, skin-temp deviation, SpO2, and the sleep performance %.
  3. Compute per-input z-scores against a ~30-day rolling baseline. Use a robust median/MAD; exclude today; require ≥4-14 nights before scoring, since WHOOP greys out the first 4 days.
  4. Orient the signs: HRV and sleep up are good; RHR, RR and |temp deviation| up are bad.
  5. Weight roughly HRV 0.5-0.6, RHR 0.2-0.25, sleep 0.15-0.25, RR/temp/SpO2 ≤0.05 each or as threshold-triggered penalties.
  6. Map through a logistic or normal CDF to 0-100. Calibrate the slope and offset so roughly 15-20% of days are red and 35-45% green, then apply the 34/67 cut-offs.
- The third-party correlation evidence (sleep performance r≈0.80) suggests WHOOP's live model leans on sleep more than its "HRV dominates" messaging implies. This may be partly because sleep debt depresses HRV and raises RHR. Treat the weights as tunable.
- The patents also put "recent strain" into Recovery. Some reconstructions omit it. A small negative term for prior-day strain above the user's norm is consistent with the patent.

### Gaps
- No official numeric weights, transforms, or final mapping function. WHOOP describes the model as cloud-trained and personalised.
- Unclear how SpO2, skin temperature and menstrual phase enter: continuous term vs. threshold flag.
- Exact baseline statistic (mean vs EWMA, raw vs ln) and how the 3/7/30-day windows combine are not public.
- Fitbit Web API field semantics (e.g., whether its HRV "deep" RMSSD is comparable to WHOOP's SWS-weighted HRV) were not verified in this session.

---

## 2. Strain (Day Strain and Activity Strain): cardiovascular + muscular load, 0-21 log scale, TRIMP

### Takeaway
Officially, Strain is a personalised, non-linear (logarithmic) 0-21 score inspired by the Borg 6-20 RPE scale. It is built from cardiovascular load (time at elevated heart rate relative to heart-rate reserve, with higher intensity weighted far more) plus, since 2024-2026, muscular load. Day Strain is computed over the whole sleep-to-sleep cycle and is not the sum of activity strains.

WHOOP's patents disclose the skeleton: an integral of a step-weighted %HRR function (weights 0 / 1 / 18 / 42), normalised by w(1)·24 h to [0,1], then transformed onto a 0-21 scale. The exact transform and thresholds are unpublished. Open re-implementations use Edwards or Banister TRIMP with a log or saturating-exponential map to 0-21.

### Cited Findings
- **[OFFICIAL] Bands:** Light 0-9, Moderate 10-13, High 14-17, All Out 18-21. "Strain is logarithmic, meaning it is easier to go from 0 to 4 than from 10 to 14." — [WHOOP Strain support](https://support.whoop.com/s/article/WHOOP-Strain); [WHOOP 101](https://developer.whoop.com/docs/whoop-101/)
- **[OFFICIAL] Borg basis:** "based on the Borg Scale of Perceived Exertion." "Strain is also specific to your baseline. Two people making the same motions will likely generate different Strain scores." — [WHOOP 101](https://developer.whoop.com/docs/whoop-101/). WHOOP "extends the ceiling to 21 to leave room for exceptional efforts." Everyday tasks yield ~4-5. — [Grosicki: Strain explained](https://www.whoop.com/us/en/thelocker/grosicki-strain-explained/)
- **[OFFICIAL] Non-additivity:** Workouts at 10.2, 8.4 and 5.1 "might leave you with a Day Strain of 14.1." "A marathon might take your Day Strain to 20.4, and a second marathon the same day might only lift it to 20.6." Cardiovascular load "adds up time spent in each heart rate zone... Sustained hard effort counts for much more than brief spikes." — [How does WHOOP Strain work 101](https://www.whoop.com/us/en/thelocker/how-does-whoop-strain-work-101/)
- **[OFFICIAL] Linear accumulation, log display (podcast 26, 2019):** "the underlying load can be accumulated in linear space, while the number people see is presented in scaled space." At the time Strain "does not measure musculoskeletal load." — [Podcast 26](https://www.whoop.com/us/en/thelocker/podcast-26-understanding-strain/)
- **[OFFICIAL] Anchors:** "The theoretical maximum of 21 would require sustaining your max heart rate for 24 straight hours." Examples: walking ~6.5 for one hour; running ~12.0 for one hour; functional fitness ~10.1. — [Strain Target](https://www.whoop.com/us/en/thelocker/strain-coach/). A 45-minute run "might generate a Strain of 12 to 15." Activity auto-detection needs ~15 min of sustained elevated HR. — [How WHOOP detects workouts](https://www.whoop.com/us/en/thelocker/how-whoop-detects-and-labels-your-workouts-activities/)
- **[OFFICIAL] Intensity reference:** "Strain is calculated independently based on time spent at elevated HR levels relative to Max HR and RHR". It is "not directly influenced by HR Zones." Max HR is estimated with "Gellish's non-linear formula" (≈192 − 0.007·age² per search extract) and raised when higher peaks are recorded. — [Max HR & Zones support](https://support.whoop.com/s/article/What-is-Max-Heart-Rate-and-How-Do-I-Adjust-It?language=en_US); [the5krunner](https://the5krunner.com/2022/05/24/whoop-strain-everything/)
- **[OFFICIAL] HR zones are %HRR (Karvonen):** Target HR = (HRmax − RHR)·% + RHR. Zones auto-update monthly as RHR changes. — [Why WHOOP uses HRR](https://www.whoop.com/us/en/thelocker/why-whoop-uses-heart-rate-reserve-not-max-heart-rate/)
  - Zone 1 bounds conflict: that page lists Z1 = 40-60% HRR, while other WHOOP pages list Z1 = 50-60%. Both agree on Z2 60-70, Z3 70-80, Z4 80-90, Z5 90-100%. — [Max HR training zones](https://www.whoop.com/us/en/thelocker/max-heart-rate-training-zones/)
- **[OFFICIAL] Muscular load:** Measured from "Volume" (incorporating "effective mass": body mass and which body parts move, so a squat beats a bench press) and "Intensity" (closeness to max lift, movement speed). It comes from IMU (accelerometer + gyroscope) plus ML, or from Strength Trainer logs of sets, reps and weight. — [WHOOP Strain support](https://support.whoop.com/s/article/WHOOP-Strain); [Grosicki: Strain explained](https://www.whoop.com/us/en/thelocker/grosicki-strain-explained/)
  - 2026 additions: passive muscular load for weightlifting, HIIT, functional fitness and others (Feb 2026); rucking and Solidcore (Jan 2026); 14 outdoor activities (Apr 2026). — [2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/)
- **[PATENT] Intensity integral:** I(t0,t1)=∫ w(v(t)) dt, where v = HRR fraction = (HR−RHR)/(HRmax−RHR). Normalised to [0,1] as N_T = I_T / (w(1)·24 hr). Then "the unit interval is transformed to have any desired distribution in a scale (e.g., a scale including 21 points from 0 to 21), for example, arctangent, sigmoid, sinusoidal, and the like."
  - Example weights: 0 at zero HRR; 1 from 0 up to the anaerobic threshold (AT); 18 from AT to the "creatine triphosphate threshold (CPT)"; 42 from CPT to 1.
  - Inputs are personalised by "age, gender, anaerobic threshold, resting heart rate, maximum heart rate."
  - Sources: [US11410765B2](https://patents.google.com/patent/US11410765B2/en); [US10182726B2](https://patents.google.com/patent/US10182726B2/en); [US20220108782A1](https://patents.google.com/patent/US20220108782A1/en)
- **[TRIMP literature] Banister TRIMP:** TRIMP = duration(min) × ΔHR × 0.64·e^(1.92·ΔHR) for men, or 0.86·e^(1.67·ΔHR) for women, with ΔHR = (HRex−HRrest)/(HRmax−HRrest). Morton 1990 variant: duration × ΔHR × e^(b·ΔHR). — [Hesselink 2017 (Maastricht)](https://cris.maastrichtuniversity.nl/ws/portalfiles/portal/62102783/Hesselink_2017_Methods_of_Monitoring_Training_Load_and_Their_Relationships.pdf); [JHSE triathlon review](https://rua.ua.es/dspace/bitstream/10045/17808/1/jhse_Vol_VI_N_II_218-232.pdf)
  - Per-sample form: Σ t_i·x_i·0.64·e^(1.92·x_i). The ceiling is ≈4.365 AU/min (male) or 4.568 AU/min (female) at x=1. — [Custom-AMS-Skills calculations.md](https://github.com/Bencal18/Custom-AMS-Skills/blob/main/docs/calculations.md)
- **[TRIMP literature] Edwards (1993) TRIMP:** minutes in 50-60/60-70/70-80/80-90/90-100% HRmax × weights 1/2/3/4/5, summed; below 50% counts 0. — [Hesselink 2017](https://cris.maastrichtuniversity.nl/ws/portalfiles/portal/62102783/Hesselink_2017_Methods_of_Monitoring_Training_Load_and_Their_Relationships.pdf); [Titan TRIMP glossary](https://titanhealth.app/glossary/trimp)
- **[TRIMP literature] Lucia TRIMP:** 3 zones (below VT1, VT1-RCP, above RCP) weighted 1/2/3. — [SciELO RBME](https://www.scielo.br/j/rbme/a/kd8RLyCwnm3KNM5SbnTdg4B/?format=pdf&lang=en)
- **[3RD-PARTY] NOOP/Woop StrainScorer:**
  - %HRR per sample (Karvonen); Edwards-style weights 1-5 at 50/60/70/80/90 %HRR × duration.
  - Strain = 21·ln(TRIMP+1)/ln(7201). D=7201 is chosen because the top weight 5 × 1440 min = 7200, so 24 h at max equals 21, matching WHOOP's stated anchor.
  - D can be refit from (TRIMP, WHOOP strain) pairs via ln(D) = 21·Σx²/Σ(x·strain), with x = ln(TRIMP+1).
  - Sources: [Woop ANALYTICS.md](https://github.com/ribhupanwar/Woop/blob/main/docs/ANALYTICS.md); [ujix/noop FAQ](https://github.com/ujix/noop/wiki/FAQ)
- **[3RD-PARTY] Proposed recalibration fitted to shared WHOOP exports (noop issue #2438):**
  - weight(x) = exp(β·(x−55)/10) at intensity x (%HRR), switched off below 20% HRR.
  - b = a·ln(1+load/k); score = 21·b/(b^p+21^p)^(1/p) with p=8, a soft cap that never reaches 21.
  - Fitted parameters are a, k and β; the loss weights WHOOP bands equally; error is reported as RMS vs WHOOP Activity Strain. "WHOOP scores workouts that stay close to resting heart rate as 0."
  - Source: [DX23876/effort-calibration](https://github.com/DX23876/effort-calibration/blob/main/effort_calibration.py)
- **[3RD-PARTY] Other mappings:**
  - openwhoop: HRmax = 208−0.7·age (Tanaka); zone weights 1/2/3/4.5/6; strain = 21·ln(1+weighted_min/60)/ln(9). — [sandeep-kota/openwhoop](https://github.com/sandeep-kota/openwhoop)
  - OpenStrap: Banister per minute, score = min(21, ln(TRIMP+1)/ln(1.5)). — [openstrap-analytics ALGORITHMS.md](https://github.com/mbulling83/openstrap-analytics/blob/main/ALGORITHMS.md)
  - unstrap: 21·(1−e^(−TRIMP/180)), giving "about 7 for 1 h at 60% HRR (male), about 15 for 2 h at 75%." It notes "WHOOP's 0-21 Strain has no published validation." — [unstrap evidence-review](https://github.com/sayed0am/unstrap/blob/main/docs/algorithms/evidence-review.md)
  - heartline: 21·(1−e^(−TRIMP/120)), with the constant "a guess calibrated so a typical active day is ~10." — [heartline METHODS.md](https://github.com/AbhiramJayasankar/heartline-zepp-alternative/blob/main/server/analytics/METHODS.md)

### Inferences
- Cardiovascular Strain implementation for Fitbit intraday HR (1-min or 1-s):
  1. Compute RHR (Fitbit daily RHR or a 14-30-day median sleeping RHR) and HRmax (Gellish or Tanaka, raised to the observed max).
  2. Compute x = clamp((HR−RHR)/(HRmax−RHR), 0, 1) per sample. Ignore x below about 0.2-0.5 so sitting scores ~0.
  3. Accumulate load = Σ w(x)·Δt over the sleep-to-sleep cycle for Day Strain, or over the activity window for Activity Strain. For w(x), use Edwards weights 1-5 at 50/60/70/80/90 %HRR, Banister x·0.64·e^(1.92x), or the patent's steps 1/18/42 with AT ≈ VT1 (~60-70% HRR) and CPT ≈ VT2 (~85-90% HRR). The AT/CPT mapping is my assumption.
  4. Display Strain = 21·ln(1+load)/ln(1+load_max), with load_max = w_max·1440 min, so 24 h at HRmax gives 21.
  5. Optionally fit the denominator, or a,k in a·ln(1+load/k), to anchor points: ~6.5 for 1 h walk, ~12 for 1 h run, 4-5 for a sedentary day.
- Because the display is logarithmic, compute Activity Strain on the activity's own load. Compute Day Strain on the total cycle load, never by summing displayed scores.
- Muscular load can only be approximated from Fitbit data, e.g., an added load term from logged strength sessions (sets × reps × relative load × effective-mass factor). WHOOP's model is IMU-based and unpublished.
- Any Fitbit implementation must choose a %HRR floor and decide how sub-zone-1 time counts. The noop calibration found a 20% HRR floor reproduces WHOOP's zero-strain behaviour near rest.

### Gaps
- The exact WHOOP transform from normalised load to 0-21 (log vs arctan vs sigmoid), its constants, and the AT/CPT thresholds are unpublished.
- How muscular load is converted and combined with cardiovascular load (additively before the log, or otherwise) is unpublished.
- Gellish formula variant: the support page names Gellish's non-linear formula. The constant 192 − 0.007·age² comes from a third-party blog extract, not a verified WHOOP page.
- No peer-reviewed validation of WHOOP Strain against TRIMP or sRPE was found in this session.

---

## 3. Sleep Need, Sleep Performance, Consistency, Efficiency, Restorative Sleep

### Takeaway
Sleep Need = Baseline + f(prior-day Strain) + f(Sleep Debt) − Naps. This is WHOOP's published model form, also in its patent.
- **Baseline** is learned from history, ~28 days, using low-strain days per the patent claims.
- **Sleep debt** accumulates relative to baseline and is capped in minutes.
- **Sleep Performance:** originally "Hours vs Needed" (sleep obtained / need). Since ~2024-25 it is a weighted composite of Sufficiency, Consistency, Efficiency and Sleep Stress, with Optimal ≥85%, Sufficient 70-85%, Poor <70%. The weights are unpublished.

### Cited Findings
- **[OFFICIAL] Sleep need inputs:**
  - "Baseline... determined by your physiology, which WHOOP begins to learn about as soon as you put on the Strap."
  - "Strain... The more Strain you accumulate during the day, the more sleep you need."
  - "Sleep Debt... extra sleep your body requires tonight due to insufficient sleep on previous nights."
  - "Naps: ...your sleep need that night is reduced by the amount of time you napped for."
  - "Typical Sleep Patterns: WHOOP evaluates the bed/wake times, duration, and efficiency over the past 28 days."
  - "Lifestyle and Behavior: WHOOP smooths out weekend vs weekday shifts, travel, or time zone changes."
  - "The average sleep need for WHOOP members is 8:34 per night." Members average just under 8 h in bed and slightly over 7 h asleep.
  - Source: [How Much Sleep Do You Need / Sleep Planner](https://www.whoop.com/us/en/thelocker/how-much-sleep-do-i-need/)
- **[OFFICIAL] Need is also individual:** Capodilupo says sleep need is shaped by "sleep debt, naps, strain, and personal factors such as age, sex, and fitness level." Sleep Performance (old definition) "measures duration sufficiency." — [Podcast 40](https://www.whoop.com/us/en/thelocker/podcast-40-whoop-recovery-maximize-readiness/)
- **[PATENT] Model form:** "SleepNeed = Baseline + f1(strain) + f2(debt) − Naps." f1 "may be assessed based on a previous day's physical intensity." Baseline is "a standard amount of sleep needed by the user on a typical rest day." — [EP3614917B1](https://patents.google.com/patent/EP3614917B1/en)
- **[PATENT] Claims (US12318226B2, granted 2025-06-03):**
  - Baseline is calculated "based on the sleep performance over the historical time window," using days "where activity by the user did not exceed a predetermined strain level."
  - The first sleep-debt metric is based on strain. The second is "an accumulation of prior sleep debt relative to the baseline sleep need over one or more preceding sleep cycles... scaled to minutes, and... capped at a predetermined maximum number of minutes."
  - Need = baseline + both debt metrics − nap adjustment. A nap may be scaled by a "nap factor."
  - Source: [US12318226B2](https://patents.google.com/patent/US12318226B2/en); [US20240252121A1](https://patents.google.com/patent/US20240252121A1/en)
- **[PATENT] Time in bed:** The recommended time in bed is chosen "to satisfy the current sleep need based on an historic ratio of time in bed to time asleep." It can be adjusted by menstrual phase (down in the early follicular phase, up in the late luteal phase). Sleep need may also use "heart rate variability, a resting heart rate, and a respiratory rate." — [WO2022187019A1](https://patents.google.com/patent/WO2022187019A1/en)
- **[OFFICIAL] Updated Sleep Performance:** "combines sleep consistency, sufficiency, stress, and efficiency"; previously "based solely on 'Hours vs Needed'". "Each factor is weighted based on its impact... Some factors have a greater influence."
  - Thresholds (Optimal / Sufficient / Poor):
    - Sleep Performance: ≥85% / 70-85% / <70%
    - Hours vs Needed: ≥85% / 70-85% / <70%
    - Sleep Consistency: ≥80% / 70-80% / <70%
    - Sleep Efficiency: ≥90% / 80-90% / <80%
    - Sleep Stress: <1% / 1-5% / >5%
  - "Restorative Sleep – Time spent in REM & Deep Sleep." "Efficiency – Percentage of time spent asleep vs. time in bed."
  - Source: [WHOOP Sleep support](https://support.whoop.com/s/article/WHOOP-Sleep?language=en_US)
- **[OFFICIAL] Definitions:** "Sleep sufficiency: Hours of sleep / sleep need." "High Sleep stress %: Physiological stress during sleep." — [WHOOP Basics](https://support.whoop.com/s/article/WHOOP-Basics?language=en_US)
- **[OFFICIAL] Sleep Consistency definition:** "measures the likelihood a user's state (sleep or wake) is the same at a particular clock time on each of four consecutive days". It differs from the Harvard Sleep Regularity Index, "which analyzes months of data." Members with lower consistency averaged 4 percentage points lower Sleep Performance. — [Sleep Consistency](https://www.whoop.com/us/en/thelocker/sleep-consistency-more-to-sleep-than-sleep-need/)
- **[OFFICIAL] Supporting stats:** In 3 million sleeps, higher consistency was associated with more SWS and REM. "Sleep consistency explains a 3% difference in sleep efficiency." Cutting sleep by 2 h loses ~20 min of SWS but possibly over an hour of REM. — [Podcast 55](https://www.whoop.com/us/en/thelocker/podcast-55-sleep-impacts-performance/)
- **[OFFICIAL] Older user-facing targets:** Target 100% of need, "perform with 85%, or get by with 75%." — [How much sleep do I need (search extract)](https://whoop.com/thelocker/how-much-sleep-do-i-need)
- **[3RD-PARTY] Open sleep-need/debt choices (unstrap):** need 480 min for ages 18-64, 450 min for 65+, user override. Debt with half-life 7 nights; a long night repays its surplus up to 2 h. Sleep score weights duration 70 / continuity 30. The authors label the debt formula "Contested." — [unstrap evidence-review](https://github.com/sayed0am/unstrap/blob/main/docs/algorithms/evidence-review.md)
- **[3RD-PARTY] Bevel's sleep score** uses duration relative to sleep need plus Deep, REM, sleep HR changes, efficiency and interruptions. Missing components are dropped. — [Bevel Common Questions](https://help.bevel.health/en/articles/11257601)

### Inferences
- Sleep Need for Fitbit data:
  1. **Baseline:** median total sleep time on low-strain, non-debt nights over the last 28-60 days, clamped to about 7-9 h. Default 8 h until calibrated. Some fall back to ~8.5 h because WHOOP's member average need is 8:34.
  2. **Strain term:** f1(strain) = 0 below the user's typical strain, rising to about +30-60 min near 18-21 strain. This magnitude is an assumption; WHOOP's is unpublished.
  3. **Debt term:** f2(debt) = an exponentially decayed sum of (need − actual) over prior nights, half-life ~3-7 nights, capped at e.g. 60-120 min. The patent confirms a cap but not its value.
  4. Subtract nap minutes, optionally scaled by a nap factor below 1.
- Sleep Performance (current WHOOP style) = weighted mean of:
  - Sufficiency = min(1, TST/need)
  - Consistency = 4-day state-match probability or SRI
  - Efficiency = TST/TIB
  - (1 − sleep-stress%)
  - Give sufficiency the dominant weight (an assumption). Each component's Optimal/Sufficient/Poor thresholds can be used to normalise it before weighting.
- The legacy "Hours vs Needed" is simply 100·TST/need, capped at 100.
- Recommended time in bed = need / historical efficiency, per the patent.

### Gaps
- No official numeric values for the baseline-need calculation, the strain-to-minutes function, debt decay or cap, or the Sleep Performance component weights.
- The "sleep stress" definition (likely the Stress Monitor score during sleep exceeding a threshold, as % of sleep time) is not documented precisely.

---

## 4. Stress Monitor (0-3), Strength Trainer / muscular load, Journal and Behavior Impacts

### Takeaway
- **Stress Monitor** is a real-time 0-3 score. It compares current HR and HRV to a 14-day personal baseline, adjusts for motion, and was developed in WHOOP Labs. The patent discloses S = α·f(motion)·[w·HR_score + (1−w)·HRV_score], with each sub-score mapped to 0-3; the HRV sub-score uses a percentile of the log-HRV 14-day distribution.
- **Strength Trainer** adds muscular load (volume via "effective mass" × intensity) into Strain.
- **Journal "Behavior Impacts"** are per-user associations between yes/no behaviours and next-day Recovery. They unlock at ≥5 yes + ≥5 no within 90 days and are explicitly correlational.

### Cited Findings
- **[OFFICIAL] Stress Monitor basics:** "a real-time stress score between 0 and 3 by measuring your heart rate and HRV and comparing that to your baseline." Motion is taken into account. The algorithm was built in WHOOP Labs from stress, relaxation, light activity, cold exposure, breathing and cognitive tasks. "Changes in heart rate correlated with changes in systolic and diastolic blood pressure." The baseline is "from the past 14 days." — [Introducing Stress Monitor (2023)](https://www.whoop.com/us/en/thelocker/introducing-stress-monitor-a-new-way-to-monitor-manage-stress/)
- **[OFFICIAL] Interpretation (podcast 215):** 0-1 very low stress, 1-2 alertness/focus, 2-3 highly activated. During good sleep the signal is often below 0.5. — [Podcast 215](https://www.whoop.com/us/en/thelocker/podcast-215-introducing-stress-monitor-a-new-way-to-measure-manage-stress/)
- **[OFFICIAL] Support article:** The score uses HR and HRV, "a comparison to your personal HRV baseline, dynamically updated over time," and motion. The Today view shows the last 24 h. Stress Score is separate from Strain. — [Get to Know the Stress Monitor](https://support.whoop.com/s/article/Get-to-Know-the-Stress-Monitor?language=en_US)
- **[PATENT] Stress equation (Eq. 1):** S = alpha·f(motion)·[w·(HR) + (1−w)·(HRV)].
  - HR from the previous ~5 min is "mapped to a score between 0 and 3, taking into account the user's baseline resting heart rate and maximum heart rate."
  - HRV over 1-5 min is compared to "a log-transformed 14-day history... percentile based... scaling these percentiles to a range of 0 to 3."
  - w favours HR when HR is low (sleep), is ~0.5 when HR > 100 bpm, and is reduced for HRV when data quality is poor.
  - Alternative: score the current HRRR "based on a quantile within the HRRR distribution."
  - Bands: 0-1 calm/sleep, 1-2 neutral/alert, 2-3 stressed/highly activated.
  - Sources: [US20240188865A1](https://patents.google.com/patent/US20240188865A1/en); [US20240188896A1](https://patents.google.com/patent/US20240188896A1/en); [WO2024129679A2](https://patents.google.com/patent/WO2024129679A2/en)
- **[OFFICIAL] Muscular load and Strength Trainer:** Volume uses "effective mass." Intensity is "how close you are to lifting your maximum, and the speed of your movement." Linking exercises gives a more precise estimate; live Strength Trainer logging is most precise because "WHOOP measures each rep's speed and intensity." — [WHOOP Strain support](https://support.whoop.com/s/article/WHOOP-Strain); [Strain 101](https://www.whoop.com/us/en/thelocker/how-does-whoop-strain-work-101/)
  - Activities "now display cardiovascular and neuromuscular contributions, which improves the accuracy of Sleep need and Recovery guidance downstream." — [Grosicki: Strain explained](https://www.whoop.com/us/en/thelocker/grosicki-strain-explained/)
- **[OFFICIAL] Journal and Behavior Impacts:**
  - Unlock requires ≥5 "yes" and ≥5 "no" for a behaviour within 90 days. WHOOP uses "machine learning and biometric analysis." Overlapping behaviours that are always logged together cannot be separated. — [Recovery Impacts support](https://support.whoop.com/s/article/Recovery-Insights?language=en_US); [Journal Overview](https://support.whoop.com/s/article/WHOOP-Journal-Overview?language=en_US)
  - Results "identify personal patterns and do not establish causation." — [Behavior Insights](https://www.whoop.com/us/en/thelocker/a-new-way-to-see-insights-on-which-behaviors-affect-your-recovery/)
  - The same Journal Overview page also mentions an older "10 entries over 30 days" threshold, an internal inconsistency.
  - 2026 updates: custom behaviours, voice logging, and "300+ behaviors." — [2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/)
- **[3RD-PARTY] Behaviour-impact reconstruction (Halo):** per tag, ridge regression of next-day Recovery on tag + Strain(d) + other tags with ≥5/5, λ=1 on standardised predictors, bootstrap CI. Labelled by its authors as their design. — [halo whoop-garmin.md](https://github.com/S0ulArk/halo/blob/main/docs/research/whoop-garmin.md)

### Inferences
- Fitbit Stress-Monitor-like score, using whatever HR/HRV granularity Fitbit exposes:
  1. HR_score = 3·clamp((HR_5min − RHR14)/(HRmax − RHR14) / k), with k chosen so that ~50% HRR maps to 3 (an assumption).
  2. HRV_score = 3·(1 − percentile of ln RMSSD_now within the 14-day log-HRV distribution).
  3. w = 1 during sleep or near-rest, 0.5 when HR > 100 bpm.
  4. Damp the score when steps or accelerometer show exercise.
- Fitbit intraday HRV is limited (it is mostly sleep-derived), so a daytime stress score from Fitbit will likely have to lean on HR plus motion.
- Behaviour impact = per-user difference in mean next-day Recovery (yes vs no) with a CI, or a regression controlling for prior-day strain. Gate on ≥5 yes and ≥5 no in a 90-day window, as WHOOP does.

### Gaps
- Official Stress Monitor coefficients (α, f(motion), the w schedule, scaling functions) are unpublished. The patent gives example structure only.
- No public specification of the muscular-load units or how they convert to Strain points.
- WHOOP's statistical method for Behavior Impacts is described only as "machine learning and biometric analysis."

---

## 5. Comparable published and open methodologies (HRV4Training/Altini, Plews/Buchheit, Athlytic, Bevel, open-source repos)

### Takeaway
The best-documented open methodology for HRV readiness is HRV4Training / Plews-Buchheit:
- Daily ln(rMSSD).
- A 7-day rolling mean as the "baseline."
- A "normal range" from the last 60 days (mean ± 0.5·SD, or the smallest worthwhile change ≈ 0.5-1.0 × CV).
- "Normal is better," not "higher is better."
- Sustained departures below the band trigger reduced load.

Commercial Apple Watch analogues use 60-day baselines: Athlytic for HRV + RHR, and Bevel for HRV, RHR, RR, SpO2, temperature and sleep. Many 2025-2026 open-source WHOOP-strap and Fitbit projects use HRV-led z-score logistic composites for Recovery and Edwards/Banister TRIMP with log mapping for Strain.

### Cited Findings
- **[HRV4Training] Windows:** "We use part of your historical data (60 days) to determine what your normal values are... sometimes called... smallest worthwhile change." Baseline = 7-day moving average of ln rMSSD. — [HRV4Training Pro & Teams Guide](https://www.hrv4training.com/pro--teams-guide.html)
  - Why 60 days: a month is "too reactive"; 60 days lets the normal range "decouple more effectively from the baseline." — [Altini, "Determining your normal range" (2022)](https://www.hrv4training.com/blog2/determining-your-normal-range)
  - Day-to-day variation of "5-20 ms or 0.5 recovery points" is normal; the displayed HRV is a "logarithmic transformation of rMSSD." — [HRV4Training FAQ](https://www.hrv4training.com/faq.html)
- **[HRV4Training] Trend states:** uses RHR, HRV and HRV coefficient of variation over 40-60 days, classified as "Stable," "Coping well" (HRV up or flat, RHR down or flat, CV lower) or "Maladaptation" (RHR up, CV up, HRV down). — [Altini Substack](https://marcoaltini.substack.com/p/long-term-trends-in-resting-heart)
- **[Literature synthesis] Convergent rule:**
  - ln-rMSSD transform; 7-day rolling mean; 60-day reference.
  - Band = mean ± 0.5·SD (Vesterinen 2016; HRV4Training) or SWC = 0.5-1.0 × within-athlete CV (Plews/Buchheit).
  - Trigger when the 7-day mean falls below the band; require "3+ consecutive days" for a hard hold.
  - Plews/Buchheit: correlations with performance appear only when averaging "at least 3-4 days."
  - Source: [airbone42/360-data-athlete hrv-prediction-vs-readiness-modeling.md](https://github.com/airbone42/360-data-athlete/blob/main/research/hrv-prediction-vs-readiness-modeling.md); [hrv-rhr-baseline-methodology.md](https://github.com/airbone42/360-data-athlete/blob/main/research/hrv-rhr-baseline-methodology.md)
- **[Athlytic]** Recovery is a 0-100% score from HRV and RHR "compared against your personal 60-day baseline. HRV is weighted slightly higher." Exertion is 0-10, "accumulating whenever your heart rate rises above a threshold personalized to you." — [Athlytic Getting Started](https://athlyticapp.com/getting-started/). The Exertion threshold comes from 30-day average max HR and 60-day average RHR. — [Fitcoin: Bevel vs Athlytic](https://www.fitcoin.co/articles/bevel-vs-athlytic)
- **[Bevel]** Recovery is 1-100% from "Sleep Score, resting heart rate (RHR), heart rate variability (HRV), respiratory rate, SpO2, and wrist temperature." HRV uses RMSSD during sleep by default (SDNN optional). HRV and RHR baselines are "rolling 60-day average." Strain = active (workout) + passive strain; "100% usually means a high-intensity workout." — [Bevel Key Terms](https://help.bevel.health/en/articles/11251073)
  - Recovery requires a Sleep Score, HRV and RHR plus enough baseline. Calibration takes 2-6 weeks. — [Bevel Common Questions](https://help.bevel.health/en/articles/11257601)
- **[Other wearables] Published structure only:** Oura HRV balance compares a "weighted 14-day average with a three-month average." Fitbit/Pixel readiness uses HRV, RHR and recent sleep vs baseline with "seven nights" initial calibration. — [empirical.health appendix](https://www.empirical.health/blog/apple-watch-readiness-score/)
- **[Open-source, Fitbit-specific]**
  - fitbit-mcp/fitdash: Recovery = HRV 45% / RHR 30% / sleep 25% z-scores vs prior 28 days → logistic. Strain 0-21 = Banister TRIMP on the user's Fitbit zones, log scale. — [pranshavpatel/fitbit-mcp](https://github.com/pranshavpatel/fitbit-mcp)
  - local-health-dashboard (Google Health API → InfluxDB/Grafana): Recovery from HRV vs baseline, RHR, sleep performance and respiration. Strain = Edwards TRIMP over intraday HR. Also a sleep-debt ledger. — [joalavedra/local-health-dashboard](https://github.com/joalavedra/local-health-dashboard/blob/main/README.md)
- **[Open-source, WHOOP-strap BLE]**
  - ujix/noop (and the Woop fork): Recovery = "HRV-dominant z-score + logistic composite vs personal baselines." Strain from %HRR plus Edwards/Banister TRIMP, log 0-21. — [noop FAQ](https://github.com/ujix/noop/wiki/FAQ)
  - openwhoop: also adds CTL/ATL/TSB with 42-day and 7-day exponential constants on Strain. — [openwhoop](https://github.com/sandeep-kota/openwhoop)
  - OpenStrap: Recovery = Plews ln-RMSSD z → clamp(50+25·z, 0, 100), needing ≥5 baseline nights. RHR = 5th percentile of sleep HR. RR cleaning: keep 300-2000 ms, drop |Δ|>200 ms. — [Dismixed analytics-openwhoop ALGORITHMS.md](https://github.com/Dismixed/analytics-openwhoop/blob/main/ALGORITHMS.md)
- **[Caveat from implementers]** "WHOOP's Recovery, Strain, and Sleep are proprietary, cloud-trained models. Mine are textbook formulas (RMSSD, Edwards TRIMP, z-scores)." — [Rusheel Raj blog](https://www.rusheelraj.com/blog/whoop/)

### Inferences
- A hybrid is reasonable for Fitbit:
  - **Daily Recovery:** WHOOP-style. Today's ln RMSSD, RHR and sleep z vs a ~30-day baseline → logistic → 0-100 with 34/67 cut-offs.
  - **Trend overlay:** HRV4Training-style. 7-day ln RMSSD mean vs 60-day mean ± 0.5·SD band, to flag sustained maladaptation (combined with rising RHR and CV).
  - This captures WHOOP's daily responsiveness and Altini's robustness to single-night noise.
- Baseline window trade-off: WHOOP ~30 days (plus 3/7-day windows) is more reactive; Athlytic, Bevel and HRV4Training use 60 days for stability. Exclude sick or flagged nights from baselines.
- For biological-age work, Strain → CTL/ATL (Banister impulse-response with 42/7-day constants) is a published extension that is not in WHOOP's model.

### Gaps
- None of the commercial apps (Athlytic, Bevel, Gentler Streak) publish numeric weights or mapping functions. Gentler Streak was not covered by sources found in this session.
- The open-source accuracy claims against WHOOP rest on small samples (e.g., 8 nights in NOOP's recovery fit). There is no independent large-sample validation.
