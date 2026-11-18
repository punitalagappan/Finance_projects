# Independent Accuracy and Validation Evidence: Fitbit / Pixel Watch vs WHOOP (vs ECG, PSG, Pulse Oximetry, Metabolic Cart)

Research note, compiled 2026-11-18. Method caveat: in this session, direct full-text fetches of PMC, Wiley, OUP and dev.fitbit.com were blocked by the sandbox network policy. Those hosts would have to be allowed in the session's network settings to fetch full text. Most numbers below therefore come from abstracts and search-engine snippets of the primary papers. Each figure says where it came from, and anything that could not be checked against a primary source is flagged. Full-text tables, especially the Bland-Altman limits of agreement, should be verified before the numbers go into calibration code.

## Q1. Nightly HRV (RMSSD): Fitbit vs ECG, WHOOP vs ECG, and systematic offsets between them

### Takeaway
WHOOP 4.0 nightly RMSSD agrees well with a chest-strap ECG all-night reference. Dial et al. 2025 (13 adults, 536 nights) report mean bias of about -0.8 ms, CCC 0.94 and MAPE about 8%. Fitbit has only one small pilot: on the Versa 4 (n=8), Fitbit RMSSD ran about 8% higher than a Firstbeat ECG reference. **No peer-reviewed study puts Fitbit and WHOOP RMSSD on the same people at the same time.** Window definitions differ, so a fixed offset cannot be taken from the literature. Fitbit uses sleep-period and deep-sleep RMSSD; WHOOP uses a sleep average weighted toward the last slow-wave sleep (SWS) period. Per-user calibration is required.

### Cited Findings
- **Dial et al. 2025, *Physiological Reports* (doi 10.14814/phy2.70527).**
  - Design: 13 healthy adults, 536 nights. Devices: Oura Gen 3, Oura Gen 4, WHOOP 4.0, Garmin Fenix 6 and Polar Grit X Pro, all against a Polar H10 chest strap (single-lead ECG, 1000 Hz). — [PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/); [Wiley](https://physoc.onlinelibrary.wiley.com/doi/10.14814/phy2.70527)
  - HRV agreement vs ECG:

    | Device | CCC | MAPE |
    |---|---|---|
    | Oura Gen 4 | 0.99 | 5.96 ± 5.12% |
    | Oura Gen 3 | 0.97 | 7.15 ± 5.48% |
    | **WHOOP 4.0** | **0.94** | **8.17 ± 10.49%** |
    | Garmin Fenix 6 | 0.87 | 10.52 ± 8.63% |
    | Polar Grit X Pro | 0.82 | 16.32 ± 24.39% |

    — [PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/)
  - WHOOP 4.0 bias, reported in search snippets of the paper:
    - Mean bias: RHR -1.41 ± 1.69 bpm; HRV -0.78 ± 5.98 ms.
    - Absolute ("relative") bias: RHR 1.78 ± 1.31 bpm; HRV 4.17 ± 4.33 ms.

    So WHOOP slightly under-reads both on average, with about ±4 ms typical absolute error in RMSSD. The authors say the WHOOP differences fall within normal day-to-day variability. — [ResearchGate copy](https://www.researchgate.net/publication/394774819_Validation_of_nocturnal_resting_heart_rate_and_heart_rate_variability_in_consumer_wearables); [Wiley](https://physoc.onlinelibrary.wiley.com/doi/10.14814/phy2.70527)
  - Limits-of-agreement intervals were not retrievable. One secondary source gives WHOOP HRV MAPE SD inconsistently (10.49% vs 4.33%); verify against the paper. — [sensai.fit summary, secondary](https://www.sensai.fit/blog/wearable-hrv-accuracy-validation-studies-2026)
  - Both Oura rings had significantly lower RHR bias and MAPE than WHOOP 4.0 (p<0.01). For HRV MAPE, WHOOP was not significantly different from Oura. — [PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/)
- **Window-mismatch critique of Dial et al.** A published letter ("Accurate comparison of wearables requires contextual equivalence") argues the comparison was not like-for-like:
  - WHOOP HRV is a dynamic average during sleep, weighted toward the last SWS period, but it was compared with an all-night ECG average.
  - The authors aligned Polar to its own window (first 4 h of sleep).
  - Garmin was excluded from RHR analyses.

  The authors' reply ("Contextual equivalence ... requires transparency") says proprietary, undisclosed windows make matching impossible. — [Letter PMC12701519](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12701519/); [Reply PMC12706116](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12706116/)
- **Miller et al. 2022, *Sensors* 22(16):6317.**
  - Design: 53 adults, one 9-h lab night with PSG and ECG. Six devices: Apple Watch, Garmin, Polar, Oura, WHOOP and Somfit. **Fitbit was not tested.** — [DOAJ record](https://doaj.org/article/8bdca05438bd47b6b2f929245cc89b75); [PMC9505647](https://pmc.ncbi.nlm.nih.gov/articles/PMC9505647)
  - A secondary source (citing WHOOP) says WHOOP had the smallest HRV error of the six, about 3.9 ms. Not verified in the primary text. — [whoop.com Locker, vendor](https://www.whoop.com/us/en/thelocker/how-well-whoop-measures-sleep/)
- **Bellenger et al. 2021, *Sensors* (WHOOP 2.0 era).** WHOOP vs ECG during sleep. Bias and LoA for ln RMSSD "approached or exceeded the typical variation and smallest worthwhile change," so WHOOP RMSSD changes should be interpreted cautiously. HR agreement was acceptable. — [PMC8160717](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8160717/); [ACU PDF](https://acuresearchbank.acu.edu.au/download/70f2691b687e5a4e0997266c34d00cec8a8d37a2d38cbc0f8233bfe57a4c56d9/950087/OA_Bellenger_2021_Wrist_based_photoplethysmography_assessment_of_heart.pdf)
- **Fitbit: Nasr et al. 2025, Fitbit Versa 4 pilot ("Agreement between Fitbit Versa 4 and a reference standard on time-domain nocturnal HRV").**
  - Design: n=8, at least 3 nights each, reference Firstbeat Bodyguard 3 (ECG).
  - Results:
    - Median RMSSD: Fitbit about 21.7 ms vs Firstbeat about 20.6 ms (p=0.3858).
    - A linear mixed model put Firstbeat at about 92.3% of Fitbit values, so Fitbit read about 8% higher.
    - The authors report low mean bias, acceptable Bland-Altman agreement with only one median value outside the LoA, and strong correlation.

  — [SAGE doi 10.1177/20552076251394960](https://doi.org/10.1177/20552076251394960); [UTMB record](https://researchexperts.utmb.edu/en/publications/agreement-between-fitbit-versa-4-and-a-reference-standard-on-time/); [ResearchGate](https://www.researchgate.net/publication/397730635_Agreement_between_Fitbit_Versa_4_and_a_reference_standard_on_time-domain_nocturnal_heart_rate_variability_A_pilot_study)
- **WHOOP's HRV window.** WHOOP says it computes RMSSD during the deepest sleep each night, not continuously. — [whoop.com HRV page](https://www.whoop.com/the-locker/heart-rate-variability-hrv/)
  - Third-party accounts disagree on the details. One says WHOOP first used the last SWS stage and later moved to a dynamic all-night average emphasising deep sleep. — [Gadgets & Wearables, 100-day Garmin vs WHOOP comparison](https://gadgetsandwearables.com/2023/04/16/garmin-vs-whoop-hrv-heart-rate-variability)
  - The "weighted towards your last slow wave sleep" wording is quoted in the Dial et al. letter. — [PMC12701519](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12701519/)
- **Fitbit's HRV window.** The Fitbit Web API has HRV endpoints (dailyRmssd and deepRmssd). The legacy Fitbit Web API was scheduled to end on 2026-09-30, with migration to the Google Health API. — [dev.fitbit.com HRV reference](https://dev.fitbit.com/build/reference/web-api/heartrate-variability/)
  - The exact windowing could not be fetched. The widely reported definition is RMSSD over the main sleep period in 5-min windows, with a separate deep-sleep RMSSD. Treat it as unverified here.

### Inferences
- **Direction of offsets.**
  - Against ECG, WHOOP 4.0 is roughly unbiased (-0.8 ms mean) when compared to an all-night reference.
  - Fitbit Versa 4 is about 8% high in one 8-person pilot.
  - The bigger driver of any Fitbit vs WHOOP gap is likely the sampling window, not sensor error:
    - RMSSD is typically highest during deep/SWS sleep, and is higher in late-night SWS than in early SWS.
    - So a WHOOP figure weighted toward the last SWS should usually be similar to or higher than an all-sleep average such as Fitbit dailyRmssd.
    - It should be closer to Fitbit deepRmssd.
  - This is a physiological inference, not a measured offset.
- **Recommended developer approach.**
  1. Map Fitbit `deepRmssd`, not `dailyRmssd`, to WHOOP HRV as the conceptually closest match.
  2. Do not apply a fixed literature-derived offset.
  3. Compare in personal-baseline space, for example a z-score or % deviation from a rolling 30–60-day mean. Alternatively, fit a per-user linear mapping during a period when both devices are worn together.
  4. Use ln(RMSSD) for scaling, because device errors appear roughly proportional (MAPE-type).
- **Noise floors.** Expected device noise is about ±4–6 ms (WHOOP absolute error 4.17 ± 4.33 ms). Night-to-night changes smaller than about 5–8% probably should not be treated as meaningful on either device.

### Gaps
- No peer-reviewed validation of Fitbit Charge 5/6, Sense/Sense 2 or Pixel Watch (1–4) nightly RMSSD against ECG or PSG-ECG was found, beyond the Versa 4 pilot.
- No study measured Fitbit and WHOOP simultaneously for RMSSD.
- No peer-reviewed study quantifies the offset between window definitions (Fitbit 5-min deep-sleep windows vs WHOOP SWS-weighted).
- Dial et al. limits of agreement, and the Miller 2022 per-device HRV bias table, could not be retrieved (full text blocked).
- WHOOP 5.0/MG (2025) RMSSD has no independent validation located.

## Q2. Resting heart rate accuracy and definitional differences

### Takeaway
WHOOP 4.0 nocturnal RHR is accurate to within about 1.5–2 bpm of ECG, slightly under-reading (Dial 2025: CCC 0.91, MAPE 3.0%). Fitbit resting-HR accuracy specifically was not found in recent independent studies, but Fitbit HR at rest is generally within about 1–2 bpm. Definitions differ (WHOOP is sleep-derived; Fitbit's RHR algorithm is not disclosed), so expect small systematic offsets.

### Cited Findings
- WHOOP 4.0 nocturnal RHR vs ECG: CCC 0.91, MAPE 3.00 ± 2.15%, mean bias -1.41 ± 1.69 bpm, absolute bias 1.78 ± 1.31 bpm. — [PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/); [ResearchGate copy](https://www.researchgate.net/publication/394774819_Validation_of_nocturnal_resting_heart_rate_and_heart_rate_variability_in_consumer_wearables)
- Oura comparators in the same study: Gen 3 CCC 0.97, MAPE 1.67%; Gen 4 CCC 0.98, MAPE 1.94%. — [PMC12367097](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12367097/)
- Fitbit Charge 2 HR at rest and during cognitive-emotional stress vs ECG: mean bias -1.1 bpm (95% LoA -5.62 to 3.42). — [ResearchGate, Charge 2 validation](https://www.researchgate.net/publication/354845629_A_Validation_Study_Fitbit_Charge_2_Heart_Rate_Measurement_at_Rest_and_During_Cognitive-Emotional_Stressors)
- Fitbit Charge HR vs portable PSG during sleep: validation exists, but the numbers were not retrieved. — [PMC9286609](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9286609/)
- An earlier multi-device RHR/HRV comparison (Stone et al. 2021, "Assessing the Accuracy of Popular Commercial Technologies That Measure RHR and HRV") exists; its numbers were not retrieved. — [PMC7956986](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7956986/)

### Inferences
- Fitbit RHR is a whole-day/sleep-informed algorithmic value; WHOOP's is a sleep-period value. Expect Fitbit RHR to sit equal to or slightly above WHOOP's for the same person. Calibrate per user rather than assuming zero offset.

### Gaps
- No independent study of Fitbit/Pixel Watch daily "Resting Heart Rate" vs ECG-derived nocturnal minimum or average HR was located.
- No head-to-head Fitbit vs WHOOP RHR study was found.

## Q3. Sleep staging vs PSG

### Takeaway
The only head-to-head PSG study with both brands is Schyvens et al. 2025, *SLEEP Advances*:
- Kappa: Fitbit Sense 0.42 and Fitbit Charge 5 0.41 (moderate) vs WHOOP 4.0 0.37 (fair).
- All devices had sensitivity above 90% for sleep but only 29–52% specificity for wake.
- Deep and REM epochs were classified better than wake and light.

Fitbit's meta-analytic profile: staging-capable models show no significant TST bias but underestimate sleep onset latency. Non-staging models overestimate TST by about 7–67 min.

### Cited Findings
- **Schyvens et al. 2025, *SLEEP Advances* 6(2):zpaf021.** Six wrist devices vs PSG: Fitbit Charge 5, Fitbit Sense, WHOOP 4.0, Apple Watch Series 8, Garmin Vivosmart 4 and Withings ScanWatch.
  - Cohen's kappa:

    | Device | Kappa |
    |---|---|
    | Apple Watch S8 | 0.53 |
    | Fitbit Sense | 0.42 |
    | Fitbit Charge 5 | 0.41 |
    | WHOOP 4.0 | 0.37 |
    | Overall range | 0.21–0.53 |

  - Sleep-epoch sensitivity above 90% for all devices; wake specificity 29.39–52.15%.
  - All wearables classified deep (N3) and REM epochs more correctly than wake and light.
  - Fitbit devices were described as reliable especially for light and REM detection.

  — [PMC12038347](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12038347/); [OUP](https://academic.oup.com/sleepadvances/article/6/2/zpaf021/8090472); [ResearchGate](https://www.researchgate.net/publication/390119507_A_performance_validation_of_six_commercial_wrist-worn_wearable_sleep-tracking_devices_for_sleep_stage_scoring_compared_to_polysomnography)
  - A secondary blog says WHOOP 4.0 correctly classified 69.63% of PSG N3 epochs, the best of the six for deep sleep. Not verified in primary text. — [Welltory blog, secondary](https://welltory.com/blog/best-sleep-trackers)
- **Haghayegh et al. 2019, *JMIR* 21(11):e16273.** Meta-analysis of Fitbit models: 22 studies reviewed, 8 meta-analysed.
  - Non-sleep-staging Fitbits overestimated TST (range about 7–67 min across studies; ES = -0.51, p<0.001).
  - Sleep-staging Fitbits showed no significant difference vs PSG in TST (p=0.289), WASO (p=0.251) or SE (p=0.189), but underestimated SOL.
  - Conclusion: Fitbits give "gross estimates," with limited specificity.

  — [PMC6908975](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6908975/); [JMIR](https://www.jmir.org/2019/11/e16273)
- **Chinoy et al. 2021, *SLEEP*.** Seven consumer devices including the Fitbit Alta HR; **WHOOP not included**.
  - Epoch sensitivity ≥0.93 and specificity 0.18–0.54 across devices.
  - Fitbit Alta HR was among the best: sensitivity 0.93–0.96, specificity 0.45–0.54 for that group; REM sensitivity 0.69 and specificity 0.94.
  - Fitbit significantly underestimated REM.
  - Performance was worse on disrupted sleep.

  — [PMC8343587](https://pmc.ncbi.nlm.nih.gov/articles/PMC8343587); [NeurologyLive summary](https://www.neurologylive.com/view/consumer-sleep-tracking-devices-perform-equally-or-better-than-actigraphy)
- **Multi-device study, medRxiv 2023, later published in ScienceDirect** (this may be the paper the brief calls "Lee 2023"; unconfirmed). Fitbit 2-stage kappa 0.58 and 4-stage kappa 0.45–0.60. Ranked below the EEG Dreem headband and above low-cost trackers. — [medRxiv](https://www.medrxiv.org/content/10.1101/2023.10.12.23296981v1.full); [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S235272182300267X)
- **Oura-funded Brigham study (Fitbit Sense 2 era).** 4-stage kappa: Oura 0.65, Apple Watch 0.60, Fitbit 0.55. Industry-funded. — [Sleep Review](https://sleepreviewmag.com/sleep-diagnostics/consumer-sleep-tracking/wearable-sleep-trackers/oura-ring-apple-watch-fitbit-face-off-sleep-accuracy-study/)
- **Fitbit Charge 4 in Chinese chronic-insomnia patients vs PSG.** Exists; numbers not retrieved. — [PMC9578631](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9578631/)
- **WHOOP vs PSG (Miller et al. 2020, *J Sports Sci*, WHOOP 2.0/3.0 era).** Secondary reports: about 89% agreement for 2-stage and about 64% for 4-stage classification. — [ResearchGate](https://www.researchgate.net/publication/343225397_A_validation_study_of_the_WHOOP_strap_against_polysomnography_to_assess_sleep); [WHOOP podcast, vendor](https://www.whoop.com/us/en/thelocker/podcast-62-whoop-sleep-validation-study/)
  - A 2022 secondary write-up of a WHOOP 3.0 PSG study reports TST underestimation of 12.2 ± 36.3 min (absolute bias 30.3 ± 23.0 min). It notes that the lab was partly WHOOP-funded. — [chatppg blog, secondary](https://chatppg.com/blog/how-accurate-is-whoop)
  - A 2021 study found WHOOP automatic mode underestimated SWS by about 15.5 min. — [PMC8226553](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8226553/)
- **Miller 2022 *Sensors* (no Fitbit).** Sleep vs wake agreement 86–89% across devices including WHOOP. All six were valid for sleep timing and duration, but none was adequate for specific stages. — [DOAJ](https://doaj.org/article/8bdca05438bd47b6b2f929245cc89b75)

### Inferences
- Per-stage minutes are not interchangeable between the brands at the individual-night level, given kappa around 0.4 for each.
- For harmonisation:
  - TST is the most comparable metric. Fitbit staging models are about unbiased; WHOOP is about 12 min under in one WHOOP 3.0 study.
  - Deep and REM minutes should be compared as % of TST or as deviation from the personal baseline.
  - Wake/WASO is the least reliable on both, because specificity is about 30–50%.

### Gaps
- Per-stage Bland-Altman biases (minutes of light/deep/REM, with LoA) for Fitbit Charge 5/Sense and WHOOP 4.0 from Schyvens 2025 could not be retrieved.
- Lee et al. 2023 (JMIR mHealth, 11 sleep trackers) was not located, and it is unconfirmed whether it is the medRxiv/ScienceDirect paper above.
- No Pixel Watch sleep-staging PSG validation was found.

## Q4. Respiratory rate, SpO2, skin temperature

### Takeaway
- Respiratory rate is well validated for both brands:
  - About 0.5 breaths/min MAE for a heart-rate-derived method published in *npj Digital Medicine* 2021 (Fitbit/Google authorship is my recollection, not confirmed in snippets).
  - WHOOP bias 1.8% vs PSG (Berryhill, n=32, cited secondhand).
- No independent peer-reviewed validation of Fitbit SpO2 against arterial blood gas or reference oximetry was found.
- No skin-temperature validation was found for either brand.

### Cited Findings
- ***npj Digital Medicine* 2021, "Measurement of respiratory rate using wearable devices and applications to COVID-19 detection."** HR-signal-derived respiratory rate vs sleep-study reference: MAE 0.46 breaths/min, RMSE 0.648, MAPE 3%. Absolute bias is larger at low respiratory rates. — [Nature](https://www.nature.com/articles/s41746-021-00493-6); [PMC8443549](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8443549/)
- **WHOOP respiratory rate (Berryhill et al. 2020, as cited in the npj paper).** Compared well with PSG during sleep in 32 participants: bias 1.8%, precision error 6.7%. Secondhand citation; original not retrieved. — [PMC8443549](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8443549/)
- **Garmin fēnix 6 VO2max and SpO2 validation (2025).** A related benchmark exists, but it covers no Fitbit or WHOOP. — [PMC11723475](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11723475/)

### Inferences
- Respiratory rate is likely the most transferable nightly metric between brands: both are sleep-derived with about 2–3% error. A near-identity mapping, followed by per-user offset correction, is reasonable.

### Gaps
- The search did not establish Fitbit authorship of the *npj* 2021 paper.
- No peer-reviewed Fitbit Sense/Charge/Pixel Watch SpO2 accuracy (ARMS, bias) vs CO-oximetry or reference pulse oximetry was found.
- WHOOP 4.0 SpO2 has no independent validation located.
- Skin-temperature deviation has no independent validation located for either brand.

## Q5. VO2max estimates (Fitbit Cardio Fitness Score, Pixel Watch, WHOOP)

### Takeaway
The only located independent lab validation in the Fitbit/Google family is for the **Pixel Watch 3** (PLOS ONE, n=34, treadmill with indirect calorimetry). Its VO2max error was not captured in snippets; its HR and energy-expenditure results are under Q6. No peer-reviewed validation of the Fitbit Cardio Fitness Score on Charge/Sense, or of WHOOP's VO2max feature, was found.

### Cited Findings
- **Pixel Watch 3 (PLOS ONE 2026, PMID 42743109).** 34 participants, maximal treadmill test with indirect calorimetry. VO2max, HR and EE were assessed. The snippet does not report VO2max bias. The authors note that accuracy cannot be inferred from earlier Fitbit validations. — [PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0356808); [PubMed](https://pubmed.ncbi.nlm.nih.gov/42743109/); [ResearchGate](https://www.researchgate.net/publication/414344648_The_accuracy_of_VO2_max_heart_rate_and_energy_expenditure_measurements_from_Google_Pixel_Watch_3)
- **Older wrist-tracker VO2max validation (includes Fitbit models).** Exists; numbers not retrieved. — [PMC6747132](https://pmc.ncbi.nlm.nih.gov/articles/PMC6747132/)
- **Fitbit Cardio Fitness Score and WHOOP VO2max.** A commercial blog says Fitbit Cardio Fitness MAPE is about 8–12% in "older studies" and that WHOOP has no peer-reviewed VO2max validation. Unverified secondary claims. — [peakvo2trainer blog](https://peakvo2trainer.com/blog/best-fitness-tracker-for-vo2-max/)
- **Apple Watch VO2max vs indirect calorimetry (PLOS ONE 2025).** Useful for typical wrist-estimate error, but not Fitbit or WHOOP. — [PMC12080799](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12080799/)

### Inferences
- Treat both VO2max estimates as low-precision, trend-only values. Wrist-estimated VO2max errors are typically around 5–15% in comparable devices.
- Do not convert between Fitbit and WHOOP VO2max beyond a per-user offset.

### Gaps
- The Pixel Watch 3 VO2max bias, LoA and MAPE could not be retrieved.
- No Fitbit Charge/Sense Cardio Fitness Score lab validation was found.
- No WHOOP VO2max validation was found.

## Q6. Heart rate during exercise (MAPE) and effects on strain and zone minutes

### Takeaway
Fitbit-family wrist HR during exercise is roughly 3–7% MAPE vs ECG or chest strap:
- Pixel Watch 3 treadmill: MAPE 2.73%, bias -2.4 bpm, wide LoA (-24 to +20 bpm).
- 10-device multi-condition study (2026): Charge 6 MAPE 5.5%; Pixel Watch 2 MAPE 6.7%.

No independent exercise-HR validation of WHOOP 4.0 was found, so a head-to-head exercise MAPE comparison is not possible from peer-reviewed data.

### Cited Findings
- **Pixel Watch 3 vs Polar H10, maximal treadmill (n=34).**
  - HR: bias -2.39 bpm, LoA -24.42 to 19.65, MAPE 2.73%.
  - Energy expenditure: MAPE 15.02%.

  — [PLOS ONE](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0356808); [PubMed](https://pubmed.ncbi.nlm.nih.gov/42743109/)
- **JMIR Formative Research 2026: 10 wearables, ECG-derived reference, varied climates and activities.**

  | Device | MAE | MAPE | CCC |
  |---|---|---|---|
  | Fitbit Charge 6 | 4.5 bpm | 5.5% | 0.93 |
  | Pixel Watch 2 | 4.9 bpm | 6.7% | 0.87 |

  Irregular movement reduced accuracy. Whether WHOOP was among the 10 devices was not confirmed. — [PMC12912460](https://pmc.ncbi.nlm.nih.gov/articles/PMC12912460/); [JMIR PDF](https://formative.jmir.org/2026/1/e85186/PDF)
- **Fitbit Charge 4 (with Samsung Galaxy Watch Active2).** HR accuracy evaluation; numbers not retrieved. — [PMC8924780](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8924780/)
- **Fitbit wristband in home rehabilitation.** Precision and accuracy decreased with increasing exercise intensity. — [PMC8747642](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8747642/)
- **Fitbit Charge 3 vs Polar H10.** LoA -46 to 33 bpm (study-dependent; shows wide individual-reading errors). — reported in search synthesis; primary not retrieved
- **WHOOP.** Published accuracy data are almost all WHOOP 2.0 or 4.0 at rest or during sleep. A reviewer noted that the WHOOP accuracy study did not cover exercise HR. No independent validation of WHOOP 5.0/MG was located. — [WeGuide](https://www.weguide.health/blog/whoop-clinical-research); [Gadgets & Wearables review](https://gadgetsandwearables.com/2022/11/24/whoop-4-0-hands-on-review/); [PMC8160717](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8160717/)
- **Studies of wrist vs arm placement and transient HR states (2025).** Relevant to WHOOP's bicep-band option. Numbers not retrieved. — [PMC12788198](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12788198/); [PMC12568089](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12568089/)

### Inferences
- A -2 to -5 bpm mean bias with ±20 bpm LoA mostly washes out in session averages. It still shifts time-in-zone near zone boundaries, so Fitbit Active Zone Minutes and WHOOP Strain (a log-scaled cardiovascular load) can diverge at moderate intensities.
- Recompute zones from raw HR using the same HRmax/HRR definition for both devices, rather than comparing vendor zone minutes or Strain directly.
- Strain is proprietary and has no independent validation.

### Gaps
- No WHOOP 4.0 exercise HR MAPE against ECG was found.
- No simultaneous Fitbit/Pixel vs WHOOP exercise study was found.
- No validation of WHOOP Strain or Fitbit Active Zone Minutes against a reference load metric (e.g., TRIMP) was found.
- No DC Rainmaker comparison was retrieved in this session.

## Q7. Sampling resolution: Fitbit intraday HR vs WHOOP continuous

### Takeaway
- Fitbit's intraday HR API offers 1-sec, 1-min, 5-min or 15-min granularity, but "1-sec" data are irregularly spaced, about 10–15 s apart at rest in developer reports, and denser during exercise.
- WHOOP's sampling rate was not verified from primary documentation in this session.
- The legacy Fitbit Web API was scheduled to end on 2026-09-30, so integrations should use the Google Health API.

### Cited Findings
- Fitbit intraday HR endpoints return 1sec/1min/5min/15min detail levels, subject to Fitbit approval for intraday access. — [Fitbit Web API swagger](https://dev.fitbit.com/build/reference/web-api/explore/fitbit-web-api-swagger.json); [jentic API summary](https://jentic.com/apis/fitbit.com/fitbit.md)
- A developer reported that 1sec requests still return about 10–15 s gaps between timestamps (anecdotal, 2019). — [Fitbit community forum](https://community.fitbit.com/t5/Web-API-Development/About-heart-rate-intraday-with-1-seconds-scale/m-p/3419570)
- Developer reports of intraday HR returned at wrong or irregular intervals (2025). — [Fitbit community](https://community.fitbit.com/t5/Web-API-Development/Heart-rate-data-being-returned-for-the-wrong-intervals/td-p/5750530)
- Legacy Fitbit Web API support ends 2026-09-30; migrate to the Google Health API. — [dev.fitbit.com](https://dev.fitbit.com/build/reference/web-api/heartrate-variability/)

### Inferences
- Fitbit intraday HR at about 5–15 s spacing cannot be used to compute RMSSD; HRV requires beat-to-beat intervals. Use Fitbit's server-side HRV values.
- Strain-like load metrics built from Fitbit intraday HR should resample to a common grid (e.g., 1-min means) before comparing with WHOOP.
- Irregular spacing biases time-in-zone if gaps are not handled. Use time-weighted integration, not sample counts.

### Gaps
- WHOOP 4.0/5.0 HR sampling frequency and the resolution exposed in the WHOOP API were not verified from primary sources in this session.
- Fitbit's on-device sampling rule (exercise vs non-exercise) was not confirmed from official documentation.
- Google Health API HR and HRV granularity after migration was not documented here.
