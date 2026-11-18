// Importer + Google Health parser tests against fixtures shaped like the documented formats.
import test from 'node:test';
import assert from 'node:assert/strict';
import { importFiles } from '../public/adapters/takeout.js';
import { syncDays, localTime, pointDate } from '../lib/googleHealth.js';
import { analyze } from '../public/engine/index.js';

const file = (name, data) => ({ name, text: async () => (typeof data === 'string' ? data : JSON.stringify(data)) });

test('Fitbit/Takeout export files are parsed into days', async () => {
  const files = [
    file('sleep-2026-10-01.json', [{
      dateOfSleep: '2026-10-02', startTime: '2026-10-01T23:05:30.000', endTime: '2026-10-02T06:55:30.000', minutesAsleep: 425, minutesAwake: 45,
      timeInBed: 470, mainSleep: true, levels: { summary: { deep: { minutes: 70 }, light: { minutes: 250 }, rem: { minutes: 105 }, wake: { minutes: 45 } } },
    }]),
    file('heart_rate-2026-10-02.json', [
      { dateTime: '10/02/26 12:00:05', value: { bpm: 70, confidence: 2 } },
      { dateTime: '10/02/26 12:00:35', value: { bpm: 74, confidence: 2 } },
    ]),
    file('resting_heart_rate-2026-10-01.json', [{ dateTime: '10/02/26 00:00:00', value: { date: '10/02/26', value: 55.4, error: 6.2 } }]),
    file('steps-2026-10-01.json', [{ dateTime: '10/02/26 12:01:00', value: '95' }, { dateTime: '10/02/26 12:02:00', value: '100' }]),
    file('exercise-2026-10-01.json', [{ activityName: 'Weights', startTime: '10/02/26 18:00:00', duration: 2700000, averageHeartRate: 118 }]),
    file('demographic_vo2_max-2026-10-01.json', [{ dateTime: '10/02/26 00:00:00', value: { demographicVO2Max: 44.1, filteredDemographicVO2Max: 43.9 } }]),
    file('Daily Heart Rate Variability Summary - 2026-10-01.csv', 'timestamp,rmssd,nremhr,entropy\n2026-10-02T00:00:00,48.7,53.1,3.1\n'),
    file('Daily Respiratory Rate Summary - 2026-10-01.csv', 'timestamp,daily_respiratory_rate\n2026-10-02T00:00:00,14.8\n'),
    file('Daily SpO2 - 2026-10-01-2026-10-31.csv', 'timestamp,average_value,lower_bound,upper_bound\n2026-10-02T00:00:00,96.2,94.1,98.9\n'),
    file('Computed Temperature - 2026-10-01.csv', 'type,sleep_start,sleep_end,temperature_samples,nightly_temperature,baseline_relative_sample_sum,baseline_relative_sample_sum_of_squares,baseline_relative_nightly_standard_deviation,baseline_relative_sample_standard_deviation\nSKIN,2026-10-01T23:05,2026-10-02T06:55,400,33.9,-40,10,0.21,0.1\n'),
  ];
  const { days, warnings } = await importFiles(files, { hrIsUtc: false });
  assert.deepEqual(warnings, []);
  const d = days.find((x) => x.date === '2026-10-02');
  assert.equal(d.sleep.asleepMin, 425);
  assert.equal(d.sleep.deepMin, 70);
  assert.equal(d.rhr, 55.4);
  assert.equal(d.hrv, 48.7);
  assert.equal(d.respRate, 14.8);
  assert.equal(d.spo2, 96.2);
  assert.equal(d.vo2max, 43.9);
  assert.equal(d.steps, 195);
  assert.ok(Math.abs(d.skinTempDelta + 0.1) < 1e-9);
  assert.equal(d.hrMinutes[720], 72);
  assert.equal(d.workouts[0].durationMin, 45);
  const a = analyze(days, { age: 40, sex: 'male' });
  assert.ok(a.days.find((x) => x.date === '2026-10-02').strengthMin === 45);
});

test('Google Health time helpers handle civil, physical and date objects', () => {
  assert.equal(localTime('2026-11-01T07:15:00', 'UTC'), '2026-11-01T07:15:00');
  assert.equal(localTime('2026-11-01T15:15:00Z', 'America/Los_Angeles'), '2026-11-01T07:15:00');
  assert.equal(localTime({ date: { year: 2026, month: 3, day: 4 }, time: { hours: 6, minutes: 5 } }, 'UTC'), '2026-03-04T06:05:00');
  assert.equal(pointDate({ dailyRestingHeartRate: { date: { year: 2026, month: 11, day: 2 }, beatsPerMinute: '54' } }, 'UTC'), '2026-11-02');
});

test('Google Health sync normalises documented payload shapes', async () => {
  const today = new Date();
  const ymd = (offset) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - offset);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
  };
  const iso = (o) => `${o.year}-${String(o.month).padStart(2, '0')}-${String(o.day).padStart(2, '0')}`;
  const d1 = ymd(1);
  const d2 = ymd(2);
  const fake = {
    call: async (path) => (path === '/profile' ? { age: 41 } : {}),
    list: async (type) => ({
      'daily-heart-rate-variability': [{ dailyHeartRateVariability: { date: d1, averageHeartRateVariabilityMilliseconds: 40, deepSleepRootMeanSquareOfSuccessiveDifferencesMilliseconds: 47.5 } }],
      'daily-resting-heart-rate': [{ dailyRestingHeartRate: { date: d1, beatsPerMinute: '56' } }],
      'daily-respiratory-rate': [{ dailyRespiratoryRate: { date: d1, breathsPerMinute: 15.1 } }],
      'daily-oxygen-saturation': [{ dailyOxygenSaturation: { date: d1, averagePercentage: 95.8 } }],
      'daily-sleep-temperature-derivations': [{ x: { date: d1, nightlyTemperatureCelsius: 34.2, baselineTemperatureCelsius: 34.0, relativeNightlyStddev30dCelsius: 0.2 } }],
      'daily-vo2-max': [{ dailyVo2Max: { date: d1, vo2Max: 45.2, cardioFitnessLevel: 'GOOD' } }],
      sleep: [{ sleep: {
        interval: { civilStartTime: `${iso(d2)}T23:10:00`, civilEndTime: `${iso(d1)}T06:40:00` },
        metadata: { mainSleep: true, nap: false },
        summary: { minutesAsleep: '410', minutesInSleepPeriod: '440', minutesToFallAsleep: '8', minutesAfterWakeUp: '2', stagesSummary: [{ type: 'DEEP', minutes: '80' }, { type: 'REM', minutes: '95' }, { type: 'LIGHT', minutes: '235' }, { type: 'AWAKE', minutes: '30' }] },
      } }],
      exercise: [{ exercise: { interval: { civilStartTime: `${iso(d1)}T18:00:00`, civilEndTime: `${iso(d1)}T18:50:00` }, exerciseType: 'WEIGHTLIFTING', displayName: 'Weights', metricsSummary: { averageHeartRateBeatsPerMinute: '121' } } }],
      'body-fat': [{ bodyFat: { sampleTime: { civilTime: `${iso(d1)}T07:00:00` }, percentage: 18.5 } }],
      weight: [],
    })[type] || [],
    dailyRollUp: async () => [{ civilStartTime: { date: d1 }, steps: { countSum: '9120' } }],
    rollUp: async () => [{ startTime: `${iso(d1)}T12:30:00Z`, heartRate: { beatsPerMinuteAvg: 88.4 } }],
  };
  const { days, profile, warnings } = await syncDays(fake, { days: 10, tz: 'UTC' });
  assert.deepEqual(warnings, []);
  assert.equal(profile.age, 41);
  const d = days.find((x) => x.date === iso(d1));
  assert.equal(d.hrv, 47.5);
  assert.equal(d.rhr, 56);
  assert.equal(d.spo2, 95.8);
  assert.ok(Math.abs(d.skinTempDelta - 0.2) < 1e-9);
  assert.equal(d.vo2max, 45.2);
  assert.equal(d.steps, 9120);
  assert.equal(d.sleep.asleepMin, 410);
  assert.equal(d.sleep.inBedMin, 450);
  assert.equal(d.sleep.deepMin, 80);
  assert.equal(d.workouts[0].type, 'WEIGHTLIFTING');
  assert.equal(d.workouts[0].durationMin, 50);
  assert.equal(d.bodyFatPct, 18.5);
  assert.equal(d.hrMinutes[750], 88);
});
