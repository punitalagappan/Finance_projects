# WHOOP Age / Pace of Aging (Healthspan): inputs, method, evidence base, targets, and comparable wearable "age" methods

Research date: 2026-11-18. The primary source is the WHOOP Healthspan white paper (Lee, Bailey, Beattie, Capodilupo et al., with a foreword by Eric Verdin of the Buck Institute; the PDF footer says "Revised on September 4, 2025"). I read all 42 pages. Other sources are the WHOOP launch article (May 8, 2025), a WHOOP Locker explainer updated January 22, 2026, PubMed abstracts of the cited studies, and the Oura CVA white paper. whoop.com could not be reached with the direct fetch tool, so its pages were retrieved through the Apify web-fetch proxy. Perplexity was unavailable because of a credits error.

Key source URLs:
- WHOOP white paper (PDF): https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf
- Launch article (May 8, 2025): https://www.whoop.com/us/en/thelocker/healthspan/
- Explainer (Jan 22, 2026): https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/
- Podcast 323 (May 14, 2025): https://www.whoop.com/us/en/thelocker/podcast-323-the-9-metrics-that-make-up-your-healthspan-with-emily-capodilupo/

---

## Q1. Which metrics feed WHOOP Age, and what are the time window and update cadence?

### Takeaway
WHOOP Age uses 9 metrics in 3 domains:
- **Sleep:** Sleep Consistency and Sleep Duration.
- **Activity:** Daily Steps, HR Zone 1–3 time, HR Zone 4–5 time, and Strength Activity Time.
- **Fitness:** VO2 Max, sleeping Resting Heart Rate, and Lean Body Mass %.

WHOOP Age uses the last 6 months of data. Pace of Aging uses the last 30 days. Both update weekly, on Sundays. Each metric contributes an "Age Impact" in years, and WHOOP Age is chronological age plus the sum of those impacts. WHOOP has not published the per-metric weights or curves. It has published the break-even thresholds and the general math.

### Cited Findings
- **The nine metrics.** The launch article lists "sleep consistency and total hours of sleep… daily steps, time spent in heart rate zones 1-3 and 4-5, and time dedicated to strength-based activities… VO₂ Max, Resting heart rate (RHR), and Lean Body Mass." — [WHOOP launch, May 8 2025](https://www.whoop.com/us/en/thelocker/healthspan/)
- **Window and aggregation.** WHOOP Age summarizes data "into a single 'physiological' or 'functional' age based on the last 6 months of WHOOP data… The contributors may add or subtract years, and WHOOP Age is the sum of the Age Impacts for each Healthspan contributor. A WHOOP Age equal to your actual age means you're meeting the WHOOP recommendations." — [WHOOP white paper p.18](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Data sources.** Healthspan uses "data derived from the sensors (i.e. daily movement, automatic sleep detection, resting heart rate) as well as data input manually (i.e. biological sex, lean body mass)." — [White paper p.10](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Lean body mass is optional.** It comes from a connected smart scale or manual entry, and "If lean body mass is not manually entered, there will be no effect on Healthspan metrics." — [White paper p.28](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Unlock rules and cadence.** Healthspan unlocks after 21 recoveries within the first 31 days. Updates continue only while the member logs at least 21 recoveries in each 31-day period. It updates weekly. It is available on Peak/Life memberships, not to users under 18, and is "for wellness purposes only." — [WHOOP launch](https://www.whoop.com/us/en/thelocker/healthspan/)
- **Additions in the 2026 explainer.** "Both metrics update weekly, on Sundays." "Full calibration takes 90 days, so WHOOP Age can move more sharply in the first weeks." Healthspan is available on WHOOP 4.0, 5.0 and MG. — [WHOOP explainer, Jan 22 2026](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)
- **WHOOP 4.0 support.** Third-party coverage (Aug 1, 2025) reports that Healthspan reached WHOOP 4.0 after launching with 5.0/MG in May 2025. — [Gadgets & Wearables](https://gadgetsandwearables.com/2025/08/01/whoop-4-0-gets-new-healthspan-metrics/)
- **Zone method matters.** HR zones are % of heart rate reserve (HRR):

  | Zone | % HRR |
  |---|---|
  | Z1 | 40–60% |
  | Z2 | 60–70% |
  | Z3 | 70–80% |
  | Z4 | 80–90% |
  | Z5 | 90–100% |

  — [White paper p.23](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)

  The 2026 explainer adds that "the model is calibrated to heart rate reserve zones. Switching to a different zone method or changing your max heart rate changes the zone minutes WHOOP counts, which changes WHOOP Age." — [WHOOP explainer 2026](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)
- **Zone minutes source.** Zone time is counted "in activities logged on WHOOP." Passive all-day HR is not counted. — [White paper p.23](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Sleep Consistency definition.** It "evaluates how similar an individual's sleep and wake times are over the last 24 hours compared to the previous 4 days," on a 0–100% scale. It "tends to be slightly lower than SRI due to the use of a longer baseline period." — [White paper p.21, p.35](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **RHR is measured during sleep** "to minimize the influence of movement." — [White paper p.27](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Activities counted as Strength Activity Time:** Strength Trainer, weightlifting, powerlifting, Barre, Barre3, pilates, yoga, hot yoga, functional fitness, Barry's, F45, box fitness, HIIT, baby wearing, toddler wearing, rucking, solidcore. — [White paper Table 1 p.29](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Blood labs do not change WHOOP Age (2026).** "Biomarkers from Advanced Labs don't change WHOOP Age or Pace of Aging. Some biomarkers are shown alongside the Healthspan pillars… but WHOOP Age is calculated from the nine metrics only." — [WHOOP explainer 2026](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)
- **Development partner.** WHOOP says Healthspan was "Developed in collaboration with the Buck Institute for Research on Aging." — [Podcast 323](https://www.whoop.com/us/en/thelocker/podcast-323-the-9-metrics-that-make-up-your-healthspan-with-emily-capodilupo/)

### Method: effective age from all-cause mortality hazard ratios (disclosed)
- **Framework.** WHOOP uses the "effective age" framework from Spiegelhalter 2016 (BMC Med Inform Decis Mak). It rests on two assumptions:
  1. The hazard ratio (HR) is constant across ages.
  2. Baseline hazard is log-linear in age, with about 10%/yr Gompertz growth (mortality doubling every 8–10 years).

  The effective-age delta is **t = ln(HR) / ln(e^c) = ln(HR)/0.1 = 10 × ln(HR)** years. — [White paper p.12](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Age-varying hazard ratios.** HRs are not always held constant. "Similar increases in steps result in larger risk reductions in older individuals… the same value for a particular Healthspan metric (e.g., step count or HR zone time) can have a different effect on WHOOP Age depending on the age of the member." — [White paper p.13](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Referent is "health-optimized," not the population average.** Each component is mapped to thresholds based on guidelines or expert recommendations. As a result, "the 'average' American adult is likely to receive a WHOOP Age that is higher than their chronological age." — [White paper p.14](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Correlation correction through structural equation modeling (SEM).**
  - WHOOP computed an empirical covariance matrix from "a large dataset of unadjusted Healthspan data from WHOOP members."
  - It then derived a theoretical (independent-effects) covariance matrix and minimized the difference between the two.
  - The result is "adjustment factors" applied to each component's hazard ratio, so that, for example, VO2max and RHR are not double-counted.
  - The factor values are not published.

  — [White paper p.15](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Extremes are capped.** "The WHOOP Healthspan algorithms have been designed to minimize extrapolation beyond the bounds of available evidence." — [White paper p.38](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)

  Explicit caps:
  - Sleep above 9 h gives no effect.
  - Strength training above 2 h/wk gives no extra benefit.
  - Zone-time benefits are described as increasing "up to 600 minutes per week."

### Inferences
- **Reconstructed structure (inferred, not disclosed).** WHOOP_Age ≈ ChronAge + Σ_i a_i · 10·ln(HR_i(x_i, age, sex) / HR_i(target_i(age, sex))).
  - x_i is the 6-month mean of metric i.
  - a_i is the undisclosed SEM shrinkage factor (0 < a_i ≤ 1).
  - Each HR_i curve is clipped at the literature's evidence range.
  - The Age Impact for a metric is 0 when it sits exactly at its target.
- **Literature-only Age Impacts are large.** Applying 10·ln(HR) directly gives these values before WHOOP's undisclosed shrinkage (my arithmetic):

  | Contrast | HR | 10·ln(HR) |
  |---|---|---|
  | RHR +10 bpm (Zhang 2016 meta) | 1.09 | about +0.86 yr |
  | RHR +10 bpm (Jensen 2013) | 1.16 | about +1.5 yr |
  | Paluch Q4 vs Q1 steps | 0.47 | about −7.5 yr |
  | Mandsager low vs elite CRF | 5.04 | about +16 yr |
  | Windred most-regular SRI quintiles | 0.52–0.80 | about −6.5 to −2.2 yr |

  WHOOP's published normative deltas are much smaller (−1.6 yr for the typical member, +6 to +7.5 yr for the average 30-year-old American). This strongly suggests that WHOOP shrinks or caps the raw effects and uses dose-response curves around the targets rather than extreme-quantile contrasts.
- **Normalizing steps by age.** Because targets fall with age (8,000 steps for younger adults versus 5,600 for older adults), a builder should scale the target by age, for example by linear interpolation. WHOOP gives only endpoint examples.

### Gaps
- **Undisclosed parameters:**
  - exact per-metric HR curves and functional forms
  - SEM adjustment factors
  - the age at which "older adult" targets apply
  - the full VO2max and LBM target tables beyond Figure 4 and the 30-year-old examples
  - how 6-month averages are weighted (simple mean or exponential)
- **Unconfirmed reports.** I found no primary source confirming a 2026 algorithm revision to WHOOP Age itself. The Jan 2026 explainer still describes the same 9 metrics and the same thresholds. A search summary said Advanced Labs biomarkers were shown beside the pillars from about January 2026. That claim was not independently verified beyond the explainer's FAQ.

---

## Q2. Which studies does WHOOP cite, and what are the effect sizes per metric?

### Takeaway
WHOOP maps each metric onto published all-cause mortality associations. The main ones:
- Windred 2024 for sleep regularity
- Itani 2017 and Saint-Maurice 2024 for sleep duration
- Lee DH 2022 Circulation and Ahmadi 2022 for zone time
- Momma 2022 and Shailendra 2022 for strength
- Paluch 2022 and Sheng 2021 for steps
- Mandsager 2018 for VO2max
- Zhang 2016 and Jensen 2013 for RHR
- Jayedi 2022 and Padwal 2016 for body fat / lean mass

### Cited Findings
- **Sleep regularity (Windred et al., Sleep 2024; 47(1):zsad253).**
  - Sample: 60,977 UK Biobank participants with accelerometry; median SRI 81.0 (IQR 73.8–86.3).
  - Higher regularity was associated with "a 20%-48% lower risk of all-cause mortality… 16%-39% lower risk of cancer mortality… 22%-57% lower risk of cardiometabolic mortality, across the top four SRI quintiles compared to the least regular quintile."
  - SRI was a stronger predictor than sleep duration.

  — [PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/?term=Windred+sleep+regularity+stronger+predictor+of+mortality+risk+than+sleep+duration&format=abstract)

  WHOOP cites the same figures. — [White paper p.21](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Sleep duration.**
  - A meta-analysis of over 5 million participants found short sleep associated with 12% higher all-cause mortality (Itani 2017, Sleep Med).
  - Risk is higher when sleep is measured objectively (Saint-Maurice 2024, Sleep, UK Biobank actigraphy).
  - Some studies suggest about 7 h is optimal. A study of healthy individuals found a slight, non-significant reduction at 8–9 h versus 7 h (Magee 2013).
  - WHOOP therefore applies: below 7 h adds years, 7–9 h gives a "minor reduction," above 9 h has no effect.

  — [White paper p.22](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **HR zone time / MVPA.**
  - "20% to nearly 50% reduction in all-cause mortality with 5-7 hours of weekly physical activity," with stronger associations when activity is objectively measured (Lee DH 2022 Circulation; Matthews 2016 AJCN).
  - 15–20 min/wk of vigorous activity (1–2 min bouts) was associated with 18–24% lower all-cause mortality (Ahmadi 2022 Eur Heart J).
  - Risk keeps decreasing up to 600 min/wk.
  - The benefit is larger at older ages (Martinez-Gomez 2024 JAMA Netw Open).

  — [White paper p.23](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Strength training.**
  - 30–60 min/wk of muscle-strengthening is associated with 10–30% lower all-cause mortality, CVD and cancer (Momma 2022 BJSM; Shailendra 2022 AJPM).
  - The association is U-shaped, with the optimum between 30 min and 2 h/wk (Liu 2019 MSSE).

  — [White paper p.24](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Steps (Paluch et al., Lancet Public Health 2022).**
  - Sample: 15 cohorts, 47,471 adults, 3,013 deaths, median follow-up 7.1 years.
  - Quartile medians were 3,553 / 5,801 / 7,842 / 10,901 steps.
  - HRs versus Q1: 0.60 (Q2), 0.55 (Q3), 0.47 (Q4).
  - Risk falls until 6,000–8,000 steps/day in adults aged 60+ and until 8,000–10,000 in those under 60.
  - Spline reference: 3,000 steps for age ≥60 and 5,000 for age <60.

  — [PubMed 35247352](https://pubmed.ncbi.nlm.nih.gov/35247352/)
- **Steps (other meta-analyses).**
  - WHOOP also cites Sheng 2021 (J Sport Health Sci): "for every additional 1,000 steps per day, the risk of all-cause mortality decreased by 23%," and 500 steps/day was associated with 6% fewer CV events.
  - It cites a benefit plateau around 8,000–10,000 steps (Stens 2023 JACC).

  — [White paper p.25](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **VO2max (Mandsager et al., JAMA Netw Open 2018).**
  - Sample: 122,007 patients undergoing treadmill testing.
  - Adjusted HR for low vs elite cardiorespiratory fitness = 5.04 (95% CI 4.10–6.20).
  - Mortality fell "without an observed upper limit of benefit."

  — [JAMA Netw Open](https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2707428); [PMC6324439](https://pmc.ncbi.nlm.nih.gov/articles/PMC6324439/)
- **VO2max (WHOOP's framing).**
  - Moving from the bottom quartile to the 50th–75th percentile cuts mortality risk by over 60%.
  - Each +1 MET (about 3.5 mL/kg/min) gives 13% lower mortality.
  - VO2max falls 10–12% per decade after 30.
  - About 20 mL/kg/min is the minimum needed for independent living (Cress 2003).
  - Males are about 20% higher than females.

  — [White paper p.26](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **RHR (Jensen et al., Heart 2013, Copenhagen Male Study).**
  - Sample: 2,798 men, followed 16 years, 1,082 deaths.
  - RHR above 90 vs at or below 50 bpm: HR 3.06 (1.97–4.75).
  - Mortality rose 16% (10–22%) per 10 bpm, independent of VO2max.

  — [PubMed abstract](https://pubmed.ncbi.nlm.nih.gov/?term=Jensen+Elevated+resting+heart+rate+physical+fitness+all-cause+mortality+Copenhagen+Male+Study&format=abstract)
- **RHR (WHOOP's framing).** WHOOP cites "A 10 bpm increase in RHR has been associated with a 9% increase in mortality risk" (Zhang 2016 CMAJ meta-analysis). It cites Jensen for the threefold risk at 90 vs 50 bpm. — [White paper p.27](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Body composition.**
  - "With each 10% increase in body fat, risk of all-cause mortality increases by 11%" (Jayedi 2022 Int J Obes; about 1 million adults, 35 cohorts).
  - Higher lean mass % is linked to lower mortality independent of BMI (Padwal 2016 Ann Intern Med).

  — [White paper p.28](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Validation of WHOOP Age (spring 2025, internal, cross-sectional).**
  - Data come from the Digital WHOOP Labs Health History Questionnaire, n of about 23k.
  - Mean WHOOP Age delta by self-rated health:

    | Self-rated health | n | Mean delta (yr) |
    |---|---|---|
    | Poor | 120 | +5.96 |
    | Fair | 1,056 | +3.86 |
    | Good | 6,435 | +0.47 |
    | Very good | 11,179 | −2.83 |
    | Excellent | 4,322 | −5.05 |

  - Mean delta by condition:

    | Condition | n | Mean delta (yr) |
    |---|---|---|
    | None | 18,266 | −2.49 |
    | Mental health only | 2,557 | −0.24 |
    | CVD only | 1,540 | −0.30 |
    | Type 2 diabetes only | 109 | +3.75 |
    | 2+ condition groups | 322 | +3.79 |

  - Statistics: Welch ANOVA, p<0.0001. No longitudinal mortality validation yet.

  — [White paper pp.32–33](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Stated limitations.**
  - The hazard ratios are mostly observational.
  - Extremes are sparse in the evidence.
  - Nutrition, social connection and mental well-being are not included.
  - "Effective age… should not be misconstrued as a predictor of life expectancy" (Pang & Hanley 2021 AJE).

  — [White paper pp.37–38](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)

### Inferences
- **Steps example.** For a builder, a log-linear HR model per metric (HR = exp(β·Δx)) gives a clean result. Sheng's 23% per 1,000 steps means β = ln(0.77) = −0.261 per 1,000 steps, so each 1,000 steps above target is about −2.6 years before shrinkage and capping. This is my arithmetic and too large to use unshrunk. WHOOP evidently caps above the plateau (8–10k).
- **Fitness example.** The MET-based VO2max effect (13% per MET) gives about −1.4 yr per +3.5 mL/kg/min. That is a more plausible per-unit slope than Mandsager's extreme-quantile contrast.

### Gaps
- WHOOP does not say which effect estimate it actually uses for each metric (several are cited per metric), the functional form, or the SEM-adjusted magnitudes.
- I did not verify Mandsager's per-quantile HRs beyond the low-vs-elite 5.04 figure.

---

## Q3. How is Pace of Aging defined (range −1x to 3x) and calculated?

### Takeaway
Pace of Aging = (projected WHOOP Age in 6 months − current WHOOP Age) / 6 months. The projection assumes the member's last-30-day metric averages are sustained for the next 6 months. The result is shown on a scale clipped to −1.0x to 3.0x. 1.0x means WHOOP Age is rising one year per year.

### Cited Findings
- **Definition.** "A projected WHOOP Age is calculated assuming the member's recent 30-day averages for the Healthspan metrics are sustained for the next 6 months. This projected WHOOP Age is then compared to the member's current WHOOP age. If the difference between the projected WHOOP Age and the current WHOOP Age is exactly 6 months, then WHOOP Age is projected to increase at the same rate as chronological age, and the member's Pace of Aging is 1." Scale: −1.0x to 3.0x. — [White paper p.19](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)
- **Bands:**

  | Band | Range |
  |---|---|
  | Accelerated | >1.0x |
  | Steady | 1.0x |
  | Slowing | 0.0–1.0x (WHOOP Age rises more slowly than time) |
  | Reversing | <0.0x (WHOOP Age likely to decrease) |

  — [White paper p.19](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf); [WHOOP explainer 2026](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/)
- **Launch wording.** The launch copy says "a 3x score means you're increasing your WHOOP Age, while -1x means you're decreasing your WHOOP Age." — [WHOOP launch](https://www.whoop.com/us/en/thelocker/healthspan/)

  A search-engine summary described "-1x as optimal" and "1x or higher" as indicating risk. That is a looser paraphrase. The white paper's definition (1.0x = steady) is authoritative.

### Inferences
- **Implied formula.** Pace = clip( [WA(age+0.5, metrics = 30-day means) − WA(age, metrics = 6-month means)] / 0.5, −1, 3 ).
  - Pace = 3x means WHOOP Age would rise about 1.5 years over 6 months.
  - Pace = −1x means it would fall about 0.5 years.
  - A builder should note that the chronological-age +0.5 term already contributes +1.0x when the metrics are unchanged.

### Gaps
- Not disclosed: whether the projection blends 30-day values into the trailing 6-month window (rolling replacement) or substitutes them outright, and how the clipping is handled.

---

## Q4. What "optimal" target ranges does WHOOP show for each metric?

### Takeaway
The targets are break-even points: meeting the target gives zero Age Impact, beating it subtracts years, and falling short adds years. Several targets scale with age and sex.

### Cited Findings (White paper Table 1, p.29, plus component pages pp.21–28)
| Metric | Break-even / target | Notes |
|---|---|---|
| Sleep Duration | 7–9 h/night | Below 7 h adds years; 7–9 h gives a minor reduction; above 9 h has no effect |
| Sleep Consistency | ≥70% | Below 70% adds years; above 70% subtracts |
| Daily Steps | 8,000/day for a younger adult; 5,600/day for an older adult | Age-dependent; fewer steps needed over 60 |
| HR Zones 1–3 | ≥70–100 min/week | "at least 100 minutes" for young adults; decreases with age |
| HR Zones 4–5 | ≥7–10 min/week | "at least 10 minutes" for young adults; decreases with age |
| Strength Activity | ≥40 min/week | No extra benefit above 120 min/wk |
| VO2 Max | Age/sex table (below); e.g. 30F >38, 30M >44 mL/kg/min | Above target subtracts, below adds |
| RHR (sleeping) | ~60 bpm M, ~64 bpm F = neutral | Lower subtracts |
| Lean Body Mass % | Young adults >67% F, >80% M (30-year-old values) | Changes with age; below adds; above "may see small reductions" |

Source for the table: [WHOOP white paper](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf); the same values are restated in the [WHOOP explainer, Jan 2026](https://www.whoop.com/us/en/thelocker/how-healthspan-on-whoop-helps-you-optimize-longevity/).

- **VO2max minimum recommendations (Figure 4, p.26).** The PDF text extraction gives 17 values per sex aligned to the age axis 20, 25 … 100. The axis has 17 ticks (20→100 in steps of 5), so the alignment is:

  | Age | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80 | 85 | 90 | 95 | 100 |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
  | F | 40 | 40 | 38 | 36 | 34 | 32 | 30 | 29 | 27 | 26 | 25 | 23 | 22 | 21 | 20 | 19 | 18 |
  | M | 46 | 46 | 44 | 42 | 40 | 37 | 36 | 34 | 32 | 30 | 29 | 27 | 26 | 25 | 23 | 22 | 21 |

  This is consistent with the text: a 30-year-old woman should exceed 38 and a 30-year-old man 44. — [White paper p.26](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)

  Caveat: this alignment was reconstructed from a PDF text extraction of the figure. The column-to-age mapping is my inference, although it is consistent with the 30-year-old values stated in the text.
- **Normative example (Table 2, p.35).** WHOOP medians are from April 2025.

  30-year-old male:

  | Metric | US average | WHOOP median |
  |---|---|---|
  | Sleep | 6.1–6.6 h | 7.0 h |
  | Sleep Consistency | 60–70% | 67% |
  | Steps | 5,200 | 10,900 |
  | HRZ 1–3 | 69 min/wk | 141 min/wk |
  | HRZ 4–5 | N/A | 6 min/wk |
  | Strength | 0 | 46 min/wk |
  | VO2max | 42.4 | 46.8 |
  | RHR | 67 | 58 |
  | Lean Body Mass | 73.9% | 81% |
  | Expected WHOOP Age | ~+6 yr | −1.6 yr |

  30-year-old female:

  | Metric | US average | WHOOP median |
  |---|---|---|
  | Sleep | 6.1–6.6 h | 7.3 h |
  | Sleep Consistency | 60–70% | 68% |
  | Steps | 5,000 | 11,500 |
  | HRZ 1–3 | 46 min/wk | 124 min/wk |
  | HRZ 4–5 | N/A | 7 min/wk |
  | Strength | 0 | 56 min/wk |
  | VO2max | 30.2 | 40.0 |
  | RHR | 72 | 63 |
  | Lean Body Mass | 62.2% | 73% |
  | Expected WHOOP Age | ~+7.5 yr | −1.6 yr |

  — [White paper p.35](https://assets.ctfassets.net/rbzqg6pelgqa/3ONehqJslbqxI7CQlwGjfT/36429d6f66940e1fd866a772ed5bfc93/WHOOP_2025_White_Paper_Healthspan__6_.pdf)

### Inferences
- **Calibration targets.** The Table 2 rows are the best available anchors for calibrating a clone. A model fed the "US average 30M" inputs should output about +6 yr, and one fed the WHOOP-median inputs about −1.6 yr. Together these constrain the total magnitude of the per-metric effects.

### Gaps
- Not published: the lean-body-mass target by age, the step and zone-time targets as continuous functions of age, and the exact neutral RHR by age (RHR targets appear to depend only on sex).

---

## Q5. Comparable methods: Oura, Garmin, Apple, Samsung, Fitbit, Ultrahuman, academic models

### Takeaway
- **Oura Cardiovascular Age** (May 2024) is a PPG pulse-wave-analysis estimate of arterial stiffness (PWV), not a behavior-based mortality model.
- **Garmin Fitness Age** derives from VO2max or its non-exercise predictors (age, sex, RHR, BMI/body fat, vigorous minutes), in the lineage of the NTNU/HUNT "fitness age" (Nes et al.).
- **Samsung** uses skin-autofluorescence AGEs.
- **Apple-affiliated research** produced PpgAge, a deep-learning aging clock (Nature Communications 2025).
- **PhenoAge** is the canonical blood-based mortality clock.
- **WHOOP** is distinctive in summing literature hazard ratios across behaviors, with a health-optimized referent.

### Cited Findings
- **Oura CVA: inputs.** Oura uses Pulse Wave Analysis on nighttime PPG to estimate CVA and PWV (m/s). The algorithm "takes into account the impact of individual demographics."
  - PPG waveform morphology was studied in age groups of 10,000 individuals each.
  - Validation: estimated PWV vs carotid-femoral PWV (cfPWV) r=0.83 in N=99 healthy subjects (mean age 46.6, cfPWV 7.77±1.49 m/s).
  - Requires 14 days/nights of data in the prior 30.

  — [Oura CVA white paper 2024](https://ouraring.com/blog/wp-content/uploads/2024/05/FINAL_Oura_Cardiovascular_Age_White_Paper.pdf)
- **Oura CVA: outputs and evidence.**
  - Bands: Above means at least 6 years older than chronological age; Aligned means within ±5 years; Below means at least 6 years younger.
  - Evidence cited: Vlachopoulos meta-analysis, where each +1 m/s PWV gives +14% CV events and +15% CV and all-cause death; high vs low PWV gives all-cause RR 1.90.
  - Ben-Shlomo: +1 m/s gives a fully adjusted 7% higher CV event risk.
  - Reference PWV medians by age:

    | Age | <30 | 30–39 | 40–49 | 50–59 | 60–69 | ≥70 |
    |---|---|---|---|---|---|---|
    | Median PWV (m/s) | 6.1 | 6.4 | 6.9 | 8.1 | 9.7 | 10.6 |

  - The exact PWV→age mapping is not disclosed.

  — [Oura CVA white paper](https://ouraring.com/blog/wp-content/uploads/2024/05/FINAL_Oura_Cardiovascular_Age_White_Paper.pdf); [Oura blog](https://ouraring.com/blog/cardiovascular-age/)
- **Garmin Fitness Age.**
  - Newer devices use "age, BMI, resting heart rate data, and vigorous activity history," with body fat % substituted for BMI when an Index S2 scale is paired.
  - The older method compared VO2max with sex-specific age norms.
  - Exact weights are not disclosed.

  — [Garmin Fitness Age page](https://garmin.ae/garmin-technologies/fitness-age); [Garmin blog](https://www.garmin.com/en-MY/blog/fitness/what-is-your-garmin-fitness-age/); [Garmin VO2 manual](https://www8.garmin.com/manuals/webhelp/vivoactive4_4S/EN-US/GUID-5C6CB6AA-3603-4708-89FB-C819F065A5B0.html); [Garmin forum (user-reported method change)](https://forums.garmin.com/outdoor-recreation/outdoor-recreation/f/fenix-7-series/317854/curious-why-fitness-age-calculation-doesn-t-take-vo2max-into-account-as-firstbeat-itself-suggests-to-do)
- **Nes et al. 2011 HUNT non-exercise VO2peak equations (waist version).**
  - Men: VO2peak = 100.27 − 0.296·age + 0.226·PA − 0.369·waist(cm) − 0.155·RHR (R² 0.61, SEE 5.70).
  - Women: VO2peak = 74.736 − 0.247·age + 0.198·PA − 0.259·waist − 0.114·RHR (R² 0.56, SEE 5.14).
  - PA is the HUNT physical-activity index.
  - "Fitness age" is the age at which a healthy HUNT participant's median VO2peak equals the estimated value.

  — [PMC review table](https://pmc.ncbi.nlm.nih.gov/articles/PMC7428991/table/jah35165-tbl-0001); [worked example](https://chrisputa.github.io/basics_exercise_physiology/lectures/lecture-5/)

  A BMI-based variant exists with a different intercept (reported as 92.05). That variant was not verified against the primary paper.
- **Samsung (Galaxy Watch 7/8).** The "AGEs Index" uses BioActive sensor skin autofluorescence of advanced glycation end-products and is presented as a biological-age indicator. A 2026 update added automatic overnight measurements for trend-building. — [Samsung Newsroom](https://news.samsung.com/global/unlocking-new-possibilities-for-preventative-wellness-with-new-galaxy-watch-and-bioactive-sensor); [Yahoo Tech](https://tech.yahoo.com/wearables/articles/inside-samsungs-plan-help-us-120010079.html)
- **PpgAge (Apple Heart & Movement Study; Nature Communications, Oct 2025; doi:10.1038/s41467-025-64275-4).**
  - A deep-learning aging clock from wrist PPG.
  - Data: n=213,593 participants, over 149M participant-days.
  - Mean absolute error 2.43 yr in a healthy cohort and 3.18 yr in a general cohort.
  - An elevated age gap is associated with heart disease, heart failure and diabetes, and with smoking, exercise and sleep.
  - It spikes in pregnancy and around cardiac events.
  - Not a shipping Apple Watch feature as far as found.

  — [Duke Scholars](https://scholars.duke.edu/publication/1692100); [ESC commentary](https://www.escardio.org/communities/working-groups/e-cardiology/scientific-documents-and-publications/commented-articles/mind-the-age-gap-with-your-smartwatch/); [Princeton](https://collaborate.princeton.edu/en/publications/a-wearable-based-aging-clock-associates-with-disease-and-behavior/)
- **PhenoAge (Levine et al., Aging 2018).**
  - Linear mortality predictor: xb = −19.907 − 0.0336·albumin(g/L) + 0.0095·creatinine(µmol/L) + 0.1953·glucose(mmol/L) + 0.0954·ln(CRP mg/dL) − 0.0120·lymphocyte% + 0.0268·MCV + 0.3306·RDW + 0.00188·ALP + 0.0554·WBC + 0.0804·age.
  - 10-year mortality score M = 1 − exp(−e^xb·(e^(120·0.0077) − 1)/0.0077).
  - PhenoAge = 141.50 + ln(−0.00553·ln(1 − M))/0.09165.
  - Each additional year of PhenoAge corresponds to HR of about 1.09 for mortality (NHANES IV).
  - Secondary sources disagree on units and constants, so check against the paper's supplement.

  — [Aging wiki summary](https://jadams5.github.io/aging_wiki/biomarkers/phenoage-2018)

  The denominator 0.09165 is my recollection of the original paper. The fetched sources gave 0.0553 or were inconsistent, so treat it as needing verification.

### Inferences
- **Three design families a developer could combine:**
  1. Hazard-ratio summation of behaviors (WHOOP), which is transparent and actionable but not validated against mortality in-cohort.
  2. Physiology regression to an age norm (Garmin/Nes fitness age, Oura PWV), which uses a single biomarker mapped to its population age curve.
  3. ML clocks trained to predict chronological age, with the gap used as the signal (PpgAge), or trained against mortality (PhenoAge).
- **Shared Gompertz conversion.** Both WHOOP's effective age and PhenoAge use about 0.08–0.10/yr Gompertz slopes to convert hazards into years. 10·ln(HR) is therefore a reasonable shared conversion.

### Gaps
- No reliable primary sources were found for Ultrahuman's age-type metrics or for any Fitbit/Google "biological age" feature. Fitbit is known for its "Cardio Fitness Score" (a VO2max estimate), but this was not verified in this session.
- Apple Watch shows VO2max ("Cardio Fitness") but, as far as found, no consumer biological-age metric.
- The exact Garmin Fitness Age weights and the Oura PWV→age mapping are undisclosed.
