# Rebuilding WHOOP Age on Google Health data

WHOOP Age is not a machine-learned aging clock. It is an additive "effective age": your chronological age plus nine per-metric **Age Impacts**. Each impact is roughly **10 × ln(hazard ratio)** for all-cause mortality, measured against a health-optimized target and shrunk to correct for correlation between metrics. The nine metrics are sleep duration and consistency, steps, HR-zone 1–3 and 4–5 minutes, strength time, VO2max, sleeping RHR and lean mass %. WHOOP Age averages the last **6 months** of data. **Pace of Aging** projects the last **30 days** six months forward and is clipped to −1x…3x. Both update weekly on Sundays. WHOOP's daily scores work differently. Recovery, Strain, Sleep Need/Performance and Stress compare you with your own rolling baselines: HRV against a ~30-day baseline, Strain as HR-reserve-weighted load on a logarithmic 0–21 scale, Stress against a 14-day HRV/HR baseline. WHOOP has published their inputs, thresholds and model forms, but never their weights. On the Fitbit side, the legacy **Fitbit Web API and Fitbit OAuth were switched off on 2 November 2026**. Any Fitbit app built today must use the **Google Health API v4** (`health.googleapis.com`). It exposes nearly every input a WHOOP clone needs, including deep-sleep RMSSD, sleeping RHR, respiratory rate, skin-temperature deviation, SpO2, staged sleep, 1-second heart rate, VO2max and body fat. It does not expose biological sex or readable menstrual phase. Fitbit's own Readiness and Sleep Scores do not appear among its data types. The specification below rebuilds WHOOP Age from literature hazard ratios with one shrinkage factor (**a = 0.57**). With that factor it reproduces all four of WHOOP's published 30-year-old anchor cases within 0.4 years. Everything beyond WHOOP's published thresholds is a labeled reconstruction, not WHOOP's code.

## WHOOP Age adds nine mortality hazard ratios to your birthday

### Nine metrics, three domains, six months of data

WHOOP Healthspan groups nine metrics into three domains:

| Domain | Metrics |
|---|---|
| Sleep | Sleep consistency, total sleep hours |
| Activity | Daily steps, time in HR zones 1–3 and 4–5, strength-training time |
| Fitness | VO2max, resting heart rate, lean body mass |

([WHOOP launch](https://www.whoop.com/us/en/thelocker/healthspan/)). The white paper defines WHOOP Age as a "physiological" age "based on the last 6 months of WHOOP data". **WHOOP Age is the sum of the Age Impacts for each Healthspan contributor**, so meeting every recommendation gives a WHOOP Age equal to your real age ([WHOOP white paper p.18](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).

**Gating and timing**

- Healthspan unlocks after **21 recoveries within the first 31 days**, and keeps updating only while that density holds ([WHOOP launch](https://www.whoop.com/us/en/thelocker/healthspan/)).
- Both metrics update **weekly on Sundays**.
- "Full calibration takes 90 days" ([WHOOP explainer, Jan 2026](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)).
- Blood biomarkers from WHOOP Advanced Labs are displayed beside the score but **do not change WHOOP Age** ([WHOOP explainer](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)).

**Measurement details a clone has to copy**

- RHR is measured **during sleep** ([white paper p.27](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).
- Lean body mass comes from a smart scale or manual entry. If it is absent, it has "no effect" ([p.28](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).
- Zone minutes count only **inside logged activities**, not passive all-day heart rate.
- Zones are defined on **heart-rate reserve**: Z1 40–60%, Z2 60–70%, Z3 70–80%, Z4 80–90%, Z5 90–100% ([p.23](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).
- WHOOP warns that changing the zone method or max HR "changes WHOOP Age" ([explainer](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)). A Fitbit clone therefore cannot reuse Fitbit's own zone minutes.
- Strength time counts a fixed activity list: weightlifting, powerlifting, pilates, yoga, barre, functional fitness, HIIT, F45, rucking, solidcore and others ([white paper Table 1](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).

### Effective age converts each hazard ratio into years

WHOOP borrows Spiegelhalter's (2016) "effective age" framework. It assumes a constant hazard ratio and a Gompertz baseline hazard that grows about 10% per year, so mortality doubles every 8–10 years. Under those assumptions, a behavior with hazard ratio HR shifts effective age by **t = ln(HR)/0.1 = 10·ln(HR) years** ([white paper p.12](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).

Three design choices refine this.

1. **Hazard ratios can vary with age.** The same step count can move an older member's WHOOP Age more than a younger member's ([p.13](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).
2. **The referent is "health-optimized," not the population mean.** As a result, "the 'average' American adult is likely to receive a WHOOP Age that is higher than their chronological age" ([p.14](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).
3. **Overlap is corrected with structural equation modeling.** VO2max and RHR, for example, are not independent. WHOOP fitted an empirical covariance matrix from member data against an independent-effects matrix. That produced per-metric "adjustment factors" on each hazard ratio, which WHOOP has not published ([p.15](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).

Effects are also capped where the evidence thins out:

- Sleep above 9 h earns nothing.
- Strength above 2 h/week earns nothing extra.
- Zone benefits accrue "up to 600 minutes per week" ([p.38, p.22–24](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).

**The shrinkage is large, and it is the most important number WHOOP did not publish.** The cited studies, plugged into 10·ln(HR) without adjustment, give big effects:

| Cited contrast | Source | Raw effect |
|---|---|---|
| Lowest vs highest step quartile | Paluch 2022: HR 0.47 at 10,901 vs 3,553 steps/day ([PubMed](https://pubmed.ncbi.nlm.nih.gov/35247352/)) | about −7.5 years |
| Low vs elite fitness | Mandsager 2018: HR 5.04 ([JAMA Netw Open](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428)) | about +16 years |

Yet WHOOP's own worked examples move only **+6 to +7.5 years** for an average 30-year-old American and **−1.6 years** for the median WHOOP member ([white paper Table 2, p.35](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)). Those four anchor rows are the best calibration data available. The specification below fits to them.

### The break-even targets are public; the curves are not

Each target is a break-even point. Hitting it scores zero, beating it subtracts years, and missing it adds years.

| Metric | WHOOP break-even target | Behavior around target |
|---|---|---|
| Sleep duration | 7–9 h/night | <7 h adds years; 7–9 h "minor reduction"; >9 h no effect |
| Sleep consistency | ≥70% | below adds, above subtracts |
| Daily steps | 8,000 (younger) → 5,600 (older adults) | age-dependent |
| HR Zones 1–3 | ≥100 min/wk (young) → 70 | declines with age |
| HR Zones 4–5 | ≥10 min/wk (young) → 7 | declines with age |
| Strength time | ≥40 min/wk | no extra benefit above 120 |
| VO2max | age/sex table (30F >38, 30M >44 mL/kg/min) | above subtracts |
| Sleeping RHR | ~60 bpm men, ~64 bpm women neutral | lower subtracts |
| Lean body mass % | >80% men, >67% women (age 30) | small reductions above |

Sources: [white paper Table 1](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf), restated in the [2026 explainer](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/).

WHOOP has not published:

- the age at which "older adult" targets apply
- step and zone targets as continuous functions of age
- lean-mass targets beyond age 30
- the per-metric hazard curves themselves

### Pace of Aging is a six-month projection, not a slope of history

WHOOP's definition: a projected WHOOP Age is computed "assuming the member's recent 30-day averages… are sustained for the next 6 months" and compared with the current WHOOP Age. **A 6-month rise equals 1.0x.** The scale runs from −1.0x to 3.0x ([white paper p.19](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).

| Band | Range |
|---|---|
| Accelerated | above 1.0x |
| Steady | 1.0x |
| Slowing | 0–1.0x |
| Reversing | below 0 |

Two consequences follow:

- A 3x reading means WHOOP Age would climb about 1.5 years in six months. A −1x reading means it would fall about half a year.
- The six months of chronological aging inside the projection already contribute exactly 1.0x when habits are unchanged.

A search-engine paraphrase calling "−1x optimal and 1x risky" is looser than the white paper, which treats 1.0x as steady.

### Validation so far is cross-sectional, not mortality

WHOOP's validation used about 23,000 members' questionnaire answers, comparing mean WHOOP Age delta with self-rated health and with chronic conditions ([white paper pp.32–33](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)):

| Group | Mean WHOOP Age delta |
|---|---|
| Excellent self-rated health | −5.05 years |
| Poor self-rated health | +5.96 years |
| No chronic conditions | −2.49 years |
| Type 2 diabetes | +3.75 years |

That is a monotonic and plausible ordering, but it is not a longitudinal mortality validation. WHOOP itself warns that effective age "should not be misconstrued as a predictor of life expectancy" ([pp.37–38](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)).

Other wearable "ages" use different families of method:

- Oura's Cardiovascular Age estimates arterial stiffness from PPG pulse-wave analysis ([Oura white paper](https://ouraring.com/blog/wp-content/uploads/2024/05/FINAL_Oura_Cardiovascular_Age_White_Paper.pdf)).
- Garmin's Fitness Age regresses VO2max or its predictors onto age norms ([Garmin](https://www.garmin.com/en-MY/blog/fitness/what-is-your-garmin-fitness-age/)).
- Apple-affiliated PpgAge is a deep-learning clock with 2.4–3.2-year mean absolute error ([ESC commentary](https://www.escardio.org/communities/working-groups/e-cardiology/scientific-documents-and-publications/commented-articles/mind-the-age-gap-with-your-smartwatch/)).

WHOOP's approach is the most transparent and the most actionable of these, and also the least validated against outcomes.

## Recovery, Strain and Sleep are personal-baseline models with unpublished weights

### Recovery is HRV against a 30-day baseline, plus sleep and RHR

**What WHOOP says officially**

- Recovery is a once-per-cycle 0–100% score: **Green 67–100, Yellow 34–66, Red 0–33**. It is fixed for the day unless sleep is edited ([WHOOP 101](https://developer.whoop.com/docs/whoop-101/)).
- Inputs are HRV, RHR, respiratory rate, sleep duration and quality, skin temperature, SpO2, and menstrual phase where applicable ([WHOOP Basics](https://support.whoop.com/s/article/WHOOP-Basics?language=en_US)).
- HRV is RMSSD. WHOOP now computes it as "a weighted average across your entire night of sleep, with more weight given to slow-wave sleep (SWS) and later stages of the night" and compares it "to your 30-day baseline" ([WHOOP Recovery support](https://support.whoop.com/s/article/WHOOP-Recovery?language=en_US)). Older material described a single reading at the end of the final SWS episode, which matches patent claims ([EP3766410B1](https://patents.google.com/patent/EP3766410B1/en)).
- Why SWS: REM gives higher HRV but is noisier because of breathing shifts. Recovery is greyed out for the first four days until a baseline exists ([Podcast 29](https://www.whoop.com/us/en/thelocker/podcast-29-heart-rate-variability-hrv/)).
- Will Ahmed has described comparing HRV to "3-day, 7-day, and 30-day moving averages" ([Podcast 51](https://www.whoop.com/us/en/thelocker/podcast-51-what-is-whoop/)).
- Respiratory rate was added in 2020 because it carried information "not already captured by HRV, resting heart rate, and Sleep" ([Podcast 84](https://www.whoop.com/us/en/thelocker/podcast-84-recovery-update/)).
- Sleep Consistency and Sleep Stress now "slightly adjust" Recovery ([WHOOP Cycles](https://support.whoop.com/s/article/WHOOP-Cycles?language=en_US)).
- A WHOOP patent adds recent strain to the recovery composite ([US9750415B2](https://patents.google.com/patent/US9750415B2/en)).

**The gap.** WHOOP has never published weights, transforms or the final mapping. Third-party evidence suggests sleep matters more than WHOOP's "HRV dominates" messaging implies. One open project found WHOOP Recovery correlates r=0.80 with sleep performance, against r=0.74 with HRV ([Woop RR-OPTIMIZATION](https://github.com/ribhupanwar/Woop/blob/main/docs/RR-OPTIMIZATION.md)). A single-user regression found +1.18 points per ms of HRV and −1.87 per bpm of RHR ([chaganty18](https://github.com/chaganty18/WHOOP-recovery-analysis)).

Open reconstructions converge on one shape: robust z-scores against roughly 28–30 nights, about 0.5–0.6 weight on ln-HRV, 0.2–0.25 on RHR and 0.15–0.25 on sleep, and small or threshold penalties for respiratory rate and temperature, passed through a logistic. Examples include [Woop ANALYTICS](https://github.com/ribhupanwar/Woop/blob/main/docs/ANALYTICS.md), [halo](https://github.com/S0ulArk/halo/blob/main/docs/research/whoop-garmin.md) and [fitbit-mcp](https://github.com/pranshavpatel/fitbit-mcp).

### Strain is HR-reserve-weighted load on a logarithmic 0–21 scale

**What WHOOP says officially**

- Strain is personalized and logarithmic, "based on the Borg Scale". Bands are **Light 0–9, Moderate 10–13, High 14–17, All Out 18–21** ([WHOOP Strain support](https://support.whoop.com/s/article/WHOOP-Strain); [WHOOP 101](https://developer.whoop.com/docs/whoop-101/)).
- Load accumulates linearly and is displayed in "scaled space" ([Podcast 26](https://www.whoop.com/us/en/thelocker/podcast-26-understanding-strain/)). So Day Strain is computed from total cycle load and is not a sum of activity strains. Activities scored 10.2, 8.4 and 5.1 might produce a Day Strain of 14.1. One marathon reaches about 20.4, and a second marathon only 20.6 ([Strain 101](https://www.whoop.com/us/en/thelocker/how-does-whoop-strain-work-101/)).
- Anchors: 21 "would require sustaining your max heart rate for 24 straight hours"; a 1-h walk ≈6.5; a 1-h run ≈12 ([Strain Target](https://www.whoop.com/us/en/thelocker/strain-coach/)).
- Intensity is measured relative to max HR and RHR, i.e. Karvonen HR reserve ([HRR article](https://www.whoop.com/us/en/thelocker/why-whoop-uses-heart-rate-reserve-not-max-heart-rate/)). Max HR starts from Gellish's non-linear formula and rises when higher peaks are recorded ([Max HR support](https://support.whoop.com/s/article/What-is-Max-Heart-Rate-and-How-Do-I-Adjust-It?language=en_US)).
- Since 2024–26, Strain also includes **muscular load**: volume × "effective mass" × intensity, from IMU data or Strength Trainer logs ([Strain support](https://support.whoop.com/s/article/WHOOP-Strain); [2026 What's New](https://www.whoop.com/us/en/thelocker/2026-whats-new/)).

**What the patents disclose.** Load is an integral of a step-weighted HR-reserve function, with example weights **0 / 1 / 18 / 42** across anaerobic and "creatine-phosphate" thresholds. It is normalized by w(1)·24 h and transformed onto 0–21 by "arctangent, sigmoid… and the like" ([US11410765B2](https://patents.google.com/patent/US11410765B2/en)).

Open clones swap in Edwards or Banister TRIMP with a log or soft-capped map. One fitted calibration found that switching load off below about **20% HRR** reproduces WHOOP scoring near-rest workouts as zero ([DX23876/effort-calibration](https://github.com/DX23876/effort-calibration/blob/main/effort_calibration.py)).

### Sleep Need adds strain and debt to a learned baseline

**Sleep Need.** WHOOP's published form, also in its patents, is **SleepNeed = Baseline + f(prior-day strain) + f(sleep debt) − naps** ([EP3614917B1](https://patents.google.com/patent/EP3614917B1/en)).

- The baseline is learned from about 28 days of history, restricted to days below a strain threshold.
- Debt accumulates "relative to the baseline sleep need", in minutes, "capped at a predetermined maximum" ([US12318226B2](https://patents.google.com/patent/US12318226B2/en)).
- The member average need is **8 h 34 min** ([WHOOP Sleep Planner](https://www.whoop.com/us/en/thelocker/how-much-sleep-do-i-need/)).

**Sleep Performance.** It used to be just hours slept versus hours needed. It is now a weighted composite of sufficiency, consistency, efficiency and sleep stress, with undisclosed weights ([WHOOP Sleep support](https://support.whoop.com/s/article/WHOOP-Sleep?language=en_US)). Each component has published thresholds:

| Component | Optimal | Sufficient | Poor |
|---|---|---|---|
| Sleep Performance overall | ≥85% | 70–85% | <70% |
| Hours vs Needed | ≥85% | 70–85% | <70% |
| Consistency | ≥80% | 70–80% | <70% |
| Efficiency | ≥90% | 80–90% | <80% |
| Sleep Stress | <1% | 1–5% | >5% |

**Sleep Consistency.** It measures whether your sleep/wake state at each clock time matches across four consecutive days ([Sleep Consistency](https://www.whoop.com/us/en/thelocker/sleep-consistency-more-to-sleep-than-sleep-need/)). It runs "slightly lower than SRI due to the use of a longer baseline period" ([white paper p.35](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)). The SRI is the sleep regularity index, which runs from −100 to 100. A raw match probability would sit above the SRI, not below it. So WHOOP almost certainly uses SRI-style rescaling, 200·P(match) − 100, averaged over more lags. That is an inference, used in the specification below.

### Stress Monitor scores HR and HRV against 14 days

Stress Monitor is a real-time **0–3** score built in WHOOP Labs. It compares current HR and HRV with a **14-day baseline** and accounts for motion ([Introducing Stress Monitor](https://www.whoop.com/us/en/thelocker/introducing-stress-monitor-a-new-way-to-monitor-manage-stress/)). The patent's equation is **S = α·f(motion)·[w·HR_score + (1−w)·HRV_score]**:

- HR_score scales about 5 minutes of HR between RHR and max HR onto 0–3.
- HRV_score is a percentile of the log-transformed 14-day HRV distribution, scaled onto 0–3.
- w favors HR at low heart rates and approaches 0.5 above 100 bpm ([US20240188865A1](https://patents.google.com/patent/US20240188865A1/en)).

The bands are 0–1 calm, 1–2 alert and 2–3 highly activated.

**HRV baselines elsewhere.** Comparable apps prefer longer windows for stability. HRV4Training uses a 7-day ln-rMSSD rolling mean against a **60-day** normal range ([HRV4Training guide](https://www.hrv4training.com/pro--teams-guide.html)). Athlytic and Bevel use 60-day HRV and RHR baselines ([Athlytic](https://athlyticapp.com/getting-started/); [Bevel](https://help.bevel.health/en/articles/11251073)).

## Fitbit's Web API died on 2 November 2026; Google Health API v4 replaced it

### The legacy API and its tokens are gone

Every Google Health API page carries the same notice: support for the legacy Fitbit Web API **ended 30 September 2026**, and the API **and Fitbit OAuth endpoints** were to be turned off on **2 November 2026** ([Google Health API specifications](https://developers.google.com/health/migration/api-specifications)). A developer post from 5 November reports that apps still calling it "stop receiving Fitbit and Pixel Watch data" ([dev.to](https://dev.to/msavas2544/the-fitbit-web-api-was-switched-off-on-2-november-heres-a-python-path-to-the-google-health-api-38kg)). One secondary summary cited 30 October instead; Google's live page is authoritative.

What migration means for an app:

- **Existing tokens do not transfer.** Every user must re-consent ([Migration overview](https://developers.google.com/health/migration)).
- **IDs change.** Legacy six-character Fitbit IDs become `healthUserId`. `GET /v4/users/me/identity` returns both.
- **Users must link first.** A user must have linked the Google Health mobile app to a Google Account. Otherwise data calls return HTTP 400 `FAILED_PRECONDITION`/`ACCOUNT_NOT_LINKED`, with a signup redirect URI ([Setup](https://developers.google.com/health/setup)).
- **Consumer deadlines have passed.** Fitbit-account sign-in ended 19 May 2026, and Google began deleting never-migrated accounts' data on 15 July 2026 ([takeoutday.org](https://takeoutday.org/guides/fitbit-data-export)). Any user who did not migrate has no data to fetch.
- **Old tooling is obsolete.** Libraries built on `api.fitbit.com` paths such as `dailyRmssd` or `vo2Max` range strings are now historical.

### Access now runs through Google Cloud OAuth with a 100-user ceiling

**Setup and limits**

- Register a Google Cloud project, enable `health.googleapis.com`, and create a **Web Server** OAuth client ([Setup](https://developers.google.com/health/setup)).
- New clients are **unverified and capped at 100 users**. Each user must be listed as a test user. Scaling past 100 requires a **third-party security review**.
- Access tokens last about one hour (`expires_in: 3599`).
- In "Testing" publishing status, **refresh tokens expire after 7 days**. In production they persist unless revoked or left unused for roughly six months ([Setup](https://developers.google.com/health/setup)).
- There is no sandbox and no mock data.

**Scopes.** All scopes share the `googlehealth.` prefix ([Scopes](https://developers.google.com/health/scopes)):

| Scope | Covers |
|---|---|
| `activity_and_fitness.readonly` | steps, exercise, zones, VO2max |
| `health_metrics_and_measurements.readonly` | HR, HRV, RHR, SpO2, respiratory rate, temperature, weight, body fat |
| `sleep.readonly` | sleep |
| `profile.readonly` | profile |

Users can grant scopes piecemeal, so the app must degrade gracefully when some are refused. Reproductive health is exposed only as `.reproductive_health.writeonly`. That means **menstrual phase cannot be read** for Recovery, an inference from the published scope list.

**Architecture.** Google steers toward a confidential web-server client and push webhooks via `projects.subscribers.subscriptions.create` ([API specifications](https://developers.google.com/health/migration/api-specifications)). A pure browser SPA would lose refresh tokens. The practical build is a thin backend that handles token exchange and refresh, webhook receipt and storage, plus a front end on top.

### One uniform resource covers every metric

All data lives at `users/{me}/dataTypes/{type}/dataPoints` ([Endpoints](https://developers.google.com/health/endpoints)). Five operations cover reads:

| Operation | Returns |
|---|---|
| `list` | raw or intraday points |
| `reconcile` | deduplicated stream across devices |
| `rollUp` | physical-time buckets |
| `dailyRollUp` | civil-day buckets that stitch DST and travel |
| `exportExerciseTcx` | TCX export of an exercise |

Practical details:

- Many int64 values come back as **JSON strings**.
- `dataSourceFamily` set to `google-wearables` excludes manual and phone entries.

**Limits** ([Rate limits](https://developers.google.com/health/rate-limits); [Data types](https://developers.google.com/health/data-types)):

- Rate: **300 requests/minute per user** and 120,000/minute per project. An unverified app is capped at 250 QPS in total.
- Roll-up range: **14 days** for heart-rate, total-calories, active-minutes and calories-in-zone; **90 days** for everything else.
- Page size: up to 10,000 points per `list` page, but only **25 sessions** per page for sleep and exercise.
- History depth is unlimited.

At 1-second storage resolution, a day of heart rate is roughly 86,400 points, about nine pages. That makes intraday HR the dominant backfill cost. Data appears only after the device syncs to the Google Health app, roughly every 15 minutes when the app is active.

### Takeout is the zero-OAuth fallback

Google Takeout now exports Fitbit history under the product name **"Google Health"** as a JSON-only ZIP ([takeoutday.org](https://takeoutday.org/guides/fitbit-data-export)):

- It is reported to contain `Sleep/` (per-night stage levels), `Heart Rate/` (about every 5 seconds when active), `HRV/` (nightly rmssd, low and high), `SpO2/`, `Weight/` and activity folders.
- Older exports used `Takeout/Fitbit/Global Export Data/`. Archives can exceed 20,000 files and 12 million heart-rate records ([Garmin forum](https://forums.garmin.com/apps-software/mobile-apps-web/f/garmin-connect-web/391568/export-from-fitbit-using-google-take-out-and-import-to-garmin)).
- There is no date or type filtering ([Fitbit community](https://community.fitbit.com/t5/Product-Feedback/Able-to-select-which-data-to-export-and-date-range-after-Google-migration/idi-p/5483105/page/2)).
- No official schema exists, so an importer must find files by pattern and be checked against a real archive.

The trade-off is clear. A Takeout upload avoids the 100-user cap and the security review, but it gives up freshness.

## Every WHOOP input has a Google Health proxy except biological sex

Most mappings are direct. Four of them are approximations that need care: zones, RHR, HRV and efficiency. Field names below come from the [Google Health REST reference](https://developers.google.com/health/reference/rest/v4/users.dataTypes.dataPoints) and the [migration mapping](https://developers.google.com/health/migration/api-specifications).

| WHOOP input | Google Health API v4 source | Fidelity notes |
|---|---|---|
| Nightly HRV (SWS-weighted RMSSD) | `daily-heart-rate-variability.deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds`; fallback `averageHeartRateVariabilityMilliseconds`; samples in `heart-rate-variability` (RMSSD, LF/HF power) | Deep-sleep RMSSD is the closest analogue to WHOOP's SWS weighting; equivalence unverified |
| Sleeping RHR | `daily-resting-heart-rate.beatsPerMinute` (check `calculationMethod` = `WITH_SLEEP`), or derive from `heart-rate` samples inside the main sleep interval | Fitbit's daily RHR is not defined as a sleep-only value; prefer derived sleeping RHR |
| Respiratory rate | `respiratory-rate-sleep-summary.fullSleepStats.breathsPerMinute`; `daily-respiratory-rate` | Per-stage stats also available |
| Skin temperature | `daily-sleep-temperature-derivations`: deviation = `nightlyTemperatureCelsius − baselineTemperatureCelsius`; `relativeNightlyStddev30dCelsius` | Nightly value is absolute, not relative |
| SpO2 | `daily-oxygen-saturation.averagePercentage` | Stricter filtering than legacy; expect gaps |
| Sleep timing, stages, naps | `sleep` sessions via `reconcile`: `stages[]`, `summary.minutesAsleep`, `minutesInSleepPeriod`, `minutesToFallAsleep`, `minutesAfterWakeUp`, `metadata.mainSleep/nap/stagesStatus` | No `efficiency`/`timeInBed` fields; compute them |
| Intraday HR for Strain/Stress/zones | `heart-rate` samples (1-s storage), `metadata.motionContext` | Fitbit's `daily-heart-rate-zones` and `exercise.metricsSummary.heartRateZoneDurations` use Fitbit's zone definitions, not WHOOP's %HRR zones |
| Logged activities, strength time | `exercise` via `reconcile`: `exerciseType` (STRENGTH_TRAINING, WEIGHTLIFTING, POWERLIFTING, FUNCTIONAL_STRENGTH_TRAINING, CROSSFIT, HIIT, CIRCUIT_TRAINING, CALISTHENICS, BODY_WEIGHT, etc.) | Map WHOOP's Table 1 list to these enums; verify yoga/pilates enums |
| Steps | `steps` `dailyRollUp` `countSum` | Exclude non-wear days |
| VO2max | `daily-vo2-max.vo2Max`, `estimated`, `cardioFitnessLevel`; `vo2-max.measurementMethod` | Drop `GOOGLE_DEMOGRAPHIC` estimates, which are derived from age/sex and so circular (recommendation) |
| Lean body mass % | `body-fat.percentage` → LBM% ≈ 100 − BF% | Optional, as in WHOOP |
| Age | `users.getProfile` (age) | Birthday needs the People API |
| Biological sex | **Not exposed** | Collect in onboarding |
| Menstrual phase | Write-only scope | Omit from Recovery |
| Fitbit Readiness / Sleep Score | Not in data-type list | Must be recomputed, not fetched |

**The zone row matters most for WHOOP Age.** WHOOP calibrated its model to %HRR zones counted only inside activities. Fitbit's Active Zone Minutes and zone durations would systematically shift the two zone metrics. A clone should recompute zone minutes from raw heart rate inside `exercise` intervals.

**RHR has the same trap.** WHOOP's neutral 60/64 bpm targets assume a sleep-measured estimator. A derived sleeping RHR, such as the 5th percentile of sleep HR as OpenStrap uses ([OpenStrap ALGORITHMS](https://github.com/Dismixed/analytics-openwhoop/blob/main/ALGORITHMS.md)), keeps the clone closer to the target's meaning than Fitbit's all-day value.

## Implementation-ready specification

### S0. Provenance legend

Every element below carries one of three labels:

- **[OFFICIAL]**: published by WHOOP or Google.
- **[LIT]**: derived arithmetically from studies WHOOP cites.
- **[RECON]**: a reconstruction or design choice by this report, calibrated where possible to WHOOP's published anchors.

No numeric weight in Recovery, Strain, Sleep Performance or Stress is WHOOP's own. None has been published.

### S1. Ingestion, day boundaries and quality gates

| Item | Rule |
|---|---|
| Cycle | WHOOP-style sleep-to-sleep: from main-sleep onset on night *t* to main-sleep onset on night *t+1* [OFFICIAL concept, [WHOOP Cycles](https://support.whoop.com/s/article/WHOOP-Cycles?language=en_US)] |
| Cycle key | Civil date of wake-up |
| Main sleep | `sleep` via `reconcile` with `metadata.mainSleep = true` |
| Naps | Sessions with `nap = true` reduce Sleep Need but do not create a Recovery score [OFFICIAL] |
| Valid night | Main sleep ≥ 3 h, `stagesStatus = SUCCEEDED`, and HRV plus RHR present [RECON] |
| Valid wear day | ≥ 10 h of heart-rate coverage [RECON] |
| Steps | Days below the wear threshold are excluded from step means [RECON] |
| Heart-rate sampling | Treat each sample as covering min(gap to next sample, 60 s). Gaps > 5 min count as missing [RECON] |
| Backfill | Hot-load the last 14 days, then cold-load history: daily types in 90-day `dailyRollUp` chunks, heart rate via `list` pagination [OFFICIAL limits]. Exponential backoff on 429/504 |

### S2. Personal baselines

All daily-score baselines use the previous **30 valid nights, excluding tonight**, and the same robust estimator throughout [RECON, following WHOOP's 30-day HRV baseline]:

```
med_X = median(X[t-30 .. t-1, valid])
sd_X  = max(1.4826 · MAD(X[t-30 .. t-1, valid]), floor_X)
floors: ln-HRV 0.05 · RHR 1.0 bpm · RR 0.3 br/min · SpO2 0.5 pt   [RECON]
```

| Use | Window |
|---|---|
| Stress | 14 days [OFFICIAL window] |
| Strain inputs: RHR | median sleeping RHR over 30 days |
| Strain inputs: HRmax | max(Gellish 192 − 0.007·age², 99.5th percentile of exercise HR over 90 days). The Gellish constant comes from a third-party extract [RECON] |
| Trend overlay | 7-day ln-RMSSD mean against a 60-day mean ± 0.5·SD band, to flag sustained maladaptation alongside the reactive daily score [LIT, HRV4Training] |

Nights flagged as illness or travel are excluded from baselines.

### S3. Recovery (0–100)

```
lnHRV  = ln(deep-sleep RMSSD)  (use whole-night RMSSD only if deep is missing on >20% of baseline nights; never mix series)
RHR_s  = 5th percentile of 1-s HR during main sleep  (fallback: daily-resting-heart-rate)
SP     = Sleep Performance from S5 (0–100)

z_HRV  = (lnHRV − med)/sd
z_RHR  = −(RHR_s − med)/sd
z_SP   = (SP − 85)/12
pen_RR = min(1, 0.5·max(0, (RR − med_RR)/sd_RR − 1.5))
pen_T  = min(1, 0.5·max(0, |ΔT|/max(relNightlyStddev30d, 0.1) − 1.5))
pen_O2 = min(1, 0.5·max(0, (med_SpO2 − SpO2)/sd_SpO2 − 1.5))
pen_S  = min(0.5, 0.1·max(0, (Strain[t−1] − med_Strain30)/sd_Strain30))

Z      = 0.55·z_HRV + 0.25·z_RHR + 0.20·z_SP − pen_RR − pen_T − pen_O2 − pen_S
Z*     = Z / s_Z        (s_Z = SD of Z over the user's last 90 days; default 0.75 until 30 scores exist)
Recovery = 100 / (1 + exp(−(1.06·Z* + 0.44)))
Zones: Red 0–33 · Yellow 34–66 · Green 67–100   [OFFICIAL]
Display: none before 4 valid nights; "calibrating" until 14   [OFFICIAL 4-day grey-out; 14 RECON]
```

The constants **1.06 and 0.44 are solved, not guessed**. With Z* distributed standard-normal, they give exactly 14.9% red days, 40.0% green days and a mean near 59. That matches the distribution targets that open reconstructions infer for WHOOP: mean about 58, about 15% red, about 40% green ([halo](https://github.com/S0ulArk/halo/blob/main/docs/research/whoop-garmin.md)) [RECON].

The weights are a midpoint of published open-source reconstructions [RECON]. The prior-strain penalty follows WHOOP's patent [PATENT, magnitude RECON].

### S4. Strain (0–21)

```
x(t)   = clamp((HR(t) − RHR)/(HRmax − RHR), 0, 1)
w(x)   = 0                                  if x < 0.20
       = x · 0.64 · e^(1.92x)  (male)       otherwise   [LIT: Banister TRIMP]
       = x · 0.86 · e^(1.67x)  (female)
Load   = Σ w(x(t)) · Δt_minutes             over the cycle (Day) or the exercise interval (Activity)
b      = 6.4 · ln(1 + Load/20.5)
Strain = 21 · b / (b^12 + 21^12)^(1/12)     (soft cap; 24 h at HRmax → 21.0)
Bands: Light 0–9 · Moderate 10–13 · High 14–17 · All Out 18–21   [OFFICIAL]
Optional muscular load: for strength exerciseTypes add 0.5 AU per session-minute before the log   [RECON, speculative]
```

The constants A = 6.4, k = 20.5 and p = 12 were fitted by least squares to WHOOP's published anchors, using assumed workout intensities [RECON]:

| Scenario (assumed intensity) | Reconstructed Strain | WHOOP anchor |
|---|---|---|
| 1-h walk at 40% HRR | 6.2 | ~6.5 |
| 1-h run at 75% HRR | 12.4 | ~12 |
| 3.5-h marathon at 85% HRR | 20.1 | ~20.4 |
| Two marathons in one cycle | 20.9 | ~20.6 |
| 24 h at HRmax | 21.0 | 21 |

Two rules follow from WHOOP's own description:

- Compute Day Strain from total cycle load, never by summing displayed activity scores [OFFICIAL behavior].
- Refit A and k per population once real WHOOP-paired data exist.

### S5. Sleep Need, Consistency and Performance

```
Baseline B   = median TST over the last 28 nights whose prior-day Strain < user's 28-day median,
               clamped to [7.0 h, 9.0 h]; default 8.0 h until 14 qualifying nights   [PATENT form, RECON values]
f_strain     = 5 min × max(0, Strain[t−1] − 10)            (max +55 min at 21)  [RECON]
Debt D_t     = clamp(0.794·D_{t−1} + (B − TST_{t−1}), 0, 120 min)   (3-night half-life, deficit vs baseline, capped)  [PATENT form, RECON values]
Need         = B + f_strain + D_t − nap_minutes_today
Recommended time in bed = Need / (30-day median efficiency)                   [PATENT]

TST          = summary.minutesAsleep (main sleep)
TIB          = minutesInSleepPeriod + minutesToFallAsleep + minutesAfterWakeUp
Efficiency E = 100 · TST/TIB                                                  [RECON proxy for Fitbit's unexposed field]
Sufficiency  = 100 · min(1, TST/Need)                                         [OFFICIAL definition]
Consistency C: build minute vectors s_d(m) ∈ {sleep, wake} on civil clock for the 24 h ending at today's wake;
               P = mean over minutes m and lags k=1..4 of 1[s_d(m) = s_{d−k}(m)];
               C = max(0, 200·P − 100)                                        [RECON of OFFICIAL 4-day definition]
SleepStress% = % of main-sleep minutes with Stress (S6) ≥ 2                   [RECON]
```

Each Sleep Performance component is first mapped to a 0–100 sub-score. The mapping is linear and puts that component's published Optimal threshold at 85 and its Poor threshold at 70, so it lines up with the overall 85/70 bands:

| Component | Mapping |
|---|---|
| Sufficiency | identity |
| Consistency | 85 + 1.5·(C − 80) |
| Efficiency | 85 + 1.5·(E − 90) |
| Sleep stress | 85 − 3.75·(stress% − 1) |

All sub-scores are clamped to 0–100. Then:

```
Sleep Performance = 0.55·Sufficiency + 0.20·Efficiency + 0.15·Consistency + 0.10·Stress   [RECON weights]
```

Overall bands are ≥85 Optimal, 70–85 Sufficient, <70 Poor [OFFICIAL]. The legacy "Hours vs Needed" is the Sufficiency sub-score alone.

### S6. Stress (0–3)

```
HR_score  = 3 · clamp((mean HR last 5 min − RHR14)/(0.5·(HRmax − RHR14)), 0, 1)
HRV_score = 3 · (1 − F14(ln RMSSD_now))   (F14 = empirical CDF of heart-rate-variability samples, last 14 days, same context)
w         = 1.0 if no HRV sample within 5 min; 0.5 if HR > 100; else 0.6
f(motion) = suppress the score (label "activity") when motionContext = ACTIVE or steps > 60/min
Stress    = f(motion) · [w·HR_score + (1−w)·HRV_score]
Bands: 0–1 calm · 1–2 alert · 2–3 highly activated   [OFFICIAL bands; PATENT form; RECON constants]
```

Fitbit's HRV samples are largely sleep-derived, so daytime stress will run mostly on HR and motion [inference].

### S7. Biological age (WHOOP Age equivalent)

Inputs are **180-day means**. Per-week metrics are 180-day totals divided by weeks with wear data. Age-dependent targets interpolate linearly between age 40 and 65 [RECON; WHOOP publishes only the endpoints], using f = clamp((age − 40)/25, 0, 1).

**VO2max minimum targets, mL/kg/min** [OFFICIAL figure; column alignment RECON from PDF extraction, consistent with the stated 30-year-old values] ([white paper p.26](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)). Interpolate linearly between columns.

| Age | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 | 95 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Female | 40 | 40 | 38 | 36 | 34 | 32 | 30 | 29 | 27 | 26 | 25 | 23 | 22 | 21 | 20 | 19 | 18 |
| Male | 46 | 46 | 44 | 42 | 40 | 37 | 36 | 34 | 32 | 30 | 29 | 27 | 26 | 25 | 23 | 22 | 21 |

**Raw Age Impact functions R_i, in years before shrinkage** [targets OFFICIAL; slopes LIT-derived via 10·ln(HR); shapes and clamps RECON]:

| Metric | Target T | Raw impact R | Input clamp | Slope derivation |
|---|---|---|---|---|
| Sleep duration (h) | 7–9 | +1.13·(7−h) if h<7; −0.10·(h−7) for 7–9; 0 if >9 | [5, 10] | Itani short sleep HR 1.12 → 10·ln 1.12 |
| Sleep consistency (%) | 70 | −0.218·(C − 70) | [40, 90] | Windred HR ≈0.52 across ~30 SRI points |
| Steps/day | 8,000 − 2,400·f | +1.03/1k below T; −0.50/1k above | [2,000, T+4,000] | Paluch Q1→Q4 HR 0.47 over 7,350 steps; half slope to plateau |
| Zones 1–3 (min/wk, %HRR 40–80) | 100 − 30·f | −2.21·[ln(1+x/60) − ln(1+T/60)] | [0, 600] | ~35% lower risk at ~6 h/wk (Lee 2022 range 20–50%) |
| Zones 4–5 (min/wk, %HRR ≥80) | 10 − 3·f | −2.33·[ln(1+x/10) − ln(1+T/10)] | [0, 75] | Ahmadi ~21% lower at 15–20 min/wk |
| Strength (min/wk) | 40 | +1.63·(1 − x/40) below; −0.50·(x−40)/80 above | [0, 120] | Momma ~15% lower at 30–60 min |
| VO2max | table above | −0.40·(v − T) | T ± 12 | 13% lower per MET (3.5 mL/kg/min) |
| Sleeping RHR (bpm) | 60 M / 64 F | +0.086·(r − T) | [40, 90] | Zhang 9% per 10 bpm |
| Lean mass % | 80 M / 67 F | +0.104·(T − l) below; −0.052·min(5, l − T) above; 0 if missing | — | Jayedi 11% per 10% body fat |

```
WHOOP_Age_clone = age + a · Σ_i R_i ,   a = 0.57   (single SEM-style shrinkage factor)   [RECON, fitted]
Unlock: ≥21 valid nights in last 31 days; label "calibrating" for first 90 days; recompute weekly (Sunday)   [OFFICIAL]
```

A single factor was fitted to WHOOP's four published normative cases, the white paper's Table 2 ([p.35](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)). "N/A" zone 4–5 minutes were treated as 0. The fitted factor was **a = 0.573**:

| Anchor case (age 30) | Raw Σ R | Clone delta (a = 0.57) | WHOOP published |
|---|---|---|---|
| US-average male | +10.31 | +5.9 | ~+6 |
| WHOOP-median male | −2.16 | −1.2 | −1.6 |
| US-average female | +13.38 | +7.6 | ~+7.5 |
| WHOOP-median female | −2.52 | −1.4 | −1.6 |

An asymmetric variant fits more tightly: a = 0.57 for positive impacts and 0.65 for negative ones gives +5.9, −1.5, +7.6 and −1.7.

These four anchors constrain the total magnitude, not the per-metric shape. Nine separate SEM factors are not identifiable from them. WHOOP's age-varying hazard ratios can be added as an optional multiplier on the steps and zone terms for older users, defaulting to 1.0 [RECON].

### S8. Pace of Aging

```
WA_now  = WHOOP_Age_clone(age,       metrics = 180-day means)
WA_proj = WHOOP_Age_clone(age + 0.5, metrics = 30-day means)
Pace    = clamp((WA_proj − WA_now)/0.5, −1.0, 3.0)
Bands: >1.0 Accelerated · 1.0 Steady · 0–1.0 Slowing · <0 Reversing   [OFFICIAL definition & bands; substitution vs blending RECON]
```

With unchanged habits, Pace is 1.0 apart from small shifts from age-dependent targets. Every 0.5-year difference between the 30-day and 6-month impact sums moves Pace by 1.0x.

### S9. Acceptance tests

A build should pass four checks [RECON]:

1. The four Table 2 cases reproduce within ±0.5 years.
2. Over 90 days of a typical user, Recovery shows about 15% red and 40% green.
3. The Strain anchor table above reproduces within ±0.5.
4. Pace returns 1.0 ± 0.05 when 30-day and 180-day inputs are identical.

Before any comparison with WHOOP output, run sensitivity checks:

- Swap whole-night for deep-sleep RMSSD and confirm Recovery zones barely move.
- Swap Fitbit daily RHR for derived sleeping RHR and quantify the WHOOP Age shift.

## Conclusion

The clone fits the anchors well, and that cuts both ways. WHOOP Age can be rebuilt from public literature plus one shrinkage factor near 0.57: four published anchor cases, nine targets and a 10·ln(HR) conversion are enough to recover its scale. That suggests WHOOP's undisclosed SEM step mostly does what a single correlation discount does. It also means the score's information content is mostly its targets. A Fitbit clone will diverge from WHOOP less because of hidden math and more because of measurement semantics: %HRR zones counted only inside activities, sleeping versus all-day RHR, and deep-sleep versus SWS-weighted HRV. Those are the places to spend validation effort.

The platform risk has also flipped. Before November 2026, the hard part of a Fitbit WHOOP-clone was intraday-access approval. Now intraday 1-second heart rate is open to any authorized client. The new bottlenecks are Google's 100-user cap with its security review, seven-day refresh tokens in Testing, and the fact that every Fitbit user must have migrated to a Google Account. A hobby or research app can live comfortably inside those limits, or sidestep them with Takeout imports. A consumer product has to budget for verification before anything else.
