// Apple Health normalisation against fixtures shaped like @capgo/capacitor-health output.
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHealthKit } from '../public/adapters/healthkit.js';
import { mergeSources } from '../public/engine/merge.js';
import { analyze } from '../public/engine/index.js';

// Local-time ISO helper (the plugin returns ISO strings; tests run in the container's local zone).
const at = (date, hh, mm = 0) => new Date(`${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`).toISOString();
const seg = (src, date0, h0, m0, date1, h1, m1, stage) => ({ dataType: 'sleep', value: 0, unit: 'minute', sourceName: src, startDate: at(date0, h0, m0), endDate: at(date1, h1, m1), sleepState: stage });

const WATCH = "Alex's Apple Watch";
const raw = {
  samples: {
    heartRate: [
      { value: 60, unit: 'bpm', sourceName: WATCH, deviceType: 'watch', startDate: at('2026-11-02', 3, 10), endDate: at('2026-11-02', 3, 10) },
      { value: 64, unit: 'bpm', sourceName: WATCH, deviceType: 'watch', startDate: at('2026-11-02', 3, 10), endDate: at('2026-11-02', 3, 10) },
      { value: 120, unit: 'bpm', sourceName: 'Oura', startDate: at('2026-11-02', 18, 0), endDate: at('2026-11-02', 18, 0) },
    ],
    restingHeartRate: [{ value: 55, unit: 'bpm', sourceName: WATCH, startDate: at('2026-11-02', 0, 0), endDate: at('2026-11-02', 23, 59) }],
    heartRateVariability: [
      { value: 40, unit: 'millisecond', sourceName: WATCH, startDate: at('2026-11-01', 23, 30), endDate: at('2026-11-01', 23, 31) },
      { value: 50, unit: 'millisecond', sourceName: WATCH, startDate: at('2026-11-02', 4, 0), endDate: at('2026-11-02', 4, 1) },
      { value: 90, unit: 'millisecond', sourceName: WATCH, startDate: at('2026-11-02', 15, 0), endDate: at('2026-11-02', 15, 1) }, // daytime: ignored
      { value: 72, unit: 'millisecond', sourceName: 'Oura', startDate: at('2026-11-02', 6, 0), endDate: at('2026-11-02', 6, 0) },
    ],
    oxygenSaturation: [{ value: 0.965, unit: 'percent', sourceName: WATCH, startDate: at('2026-11-02', 2, 0), endDate: at('2026-11-02', 2, 0) }],
    respiratoryRate: [{ value: 14.5, unit: 'count', sourceName: WATCH, startDate: at('2026-11-02', 2, 0), endDate: at('2026-11-02', 2, 0) }],
    appleSleepingWristTemperature: ['2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02'].map((d, i) => ({
      value: i === 4 ? 35.4 : 34.9, unit: 'celsius', sourceName: WATCH, startDate: at(d, 3, 0), endDate: at(d, 6, 0),
    })),
    sleep: [
      seg(WATCH, '2026-11-01', 22, 50, '2026-11-02', 6, 55, 'inBed'),
      seg(WATCH, '2026-11-01', 23, 0, '2026-11-02', 1, 0, 'light'),
      seg(WATCH, '2026-11-02', 1, 0, '2026-11-02', 2, 30, 'deep'),
      seg(WATCH, '2026-11-02', 2, 30, '2026-11-02', 2, 45, 'awake'),
      seg(WATCH, '2026-11-02', 2, 45, '2026-11-02', 4, 45, 'light'),
      seg(WATCH, '2026-11-02', 4, 45, '2026-11-02', 6, 45, 'rem'),
      { dataType: 'sleep', value: 0, unit: 'minute', sourceName: 'Oura', startDate: at('2026-11-01', 23, 10), endDate: at('2026-11-02', 6, 40), sleepState: 'asleep' },
      seg(WATCH, '2026-11-02', 14, 0, '2026-11-02', 14, 30, 'asleep'), // nap
    ],
    vo2Max: [{ value: 46.2, unit: 'mL/min/kg', sourceName: WATCH, startDate: at('2026-11-02', 8, 0), endDate: at('2026-11-02', 8, 0) }],
    bodyFat: [{ value: 0.182, unit: 'percent', sourceName: 'Health Mate', startDate: at('2026-11-02', 7, 0), endDate: at('2026-11-02', 7, 0) }],
  },
  workouts: [{ workoutType: 'traditionalStrengthTraining', duration: 2700, startDate: at('2026-11-02', 18, 0), endDate: at('2026-11-02', 18, 45), sourceName: WATCH }],
  steps: [{ startDate: at('2026-11-02', 0, 0), endDate: at('2026-11-03', 0, 0), value: 10432.4, values: { sum: 10432.4 }, unit: 'count' }],
};

const sources = normalizeHealthKit(raw);
const byId = Object.fromEntries(sources.map((s) => [s.id, s]));
const day = (id, date) => byId[id].days.find((d) => d.date === date);

test('Each app/device becomes its own source with a detected device profile', () => {
  assert.equal(byId[`hk:${WATCH}`].device, 'apple-watch');
  assert.equal(byId['hk:Oura'].device, 'oura');
  assert.equal(byId['hk:Health Mate'].device, 'withings');
  assert.equal(byId['hk:Apple Health'].label, 'Apple Health (all devices)');
});

test('Sleep stage segments are grouped into a staged main sleep, with naps separated', () => {
  const s = day(`hk:${WATCH}`, '2026-11-02').sleep;
  assert.equal(s.deepMin, 90);
  assert.equal(s.remMin, 120);
  assert.equal(s.lightMin, 240);
  assert.equal(s.asleepMin, 450);
  assert.equal(s.inBedMin, 485);
  assert.equal(day(`hk:${WATCH}`, '2026-11-02').naps.length, 1);
  const oura = day('hk:Oura', '2026-11-02').sleep;
  assert.equal(oura.classic, true);
  assert.equal(oura.asleepMin, 450);
});

test('Overnight vitals are nightly means; daytime spot readings are ignored', () => {
  const d = day(`hk:${WATCH}`, '2026-11-02');
  assert.equal(d.hrv, 45);
  assert.equal(d.spo2, 96.5);
  assert.equal(d.respRate, 14.5);
  assert.equal(d.rhr, 55);
  assert.equal(day('hk:Oura', '2026-11-02').hrv, 72);
});

test('Wrist temperature becomes a deviation from this device\'s own baseline', () => {
  assert.equal(day(`hk:${WATCH}`, '2026-11-02').skinTempDelta, 0.5);
});

test('Minute HR, VO2max, body fat, workouts and deduplicated steps', () => {
  const d = day(`hk:${WATCH}`, '2026-11-02');
  assert.equal(d.hrMinutes[3 * 60 + 10], 62);
  assert.equal(d.vo2max, 46.2);
  assert.equal(d.workouts[0].durationMin, 45);
  assert.equal(d.workouts[0].strength, true);
  assert.equal(day('hk:Health Mate', '2026-11-02').bodyFatPct, 18.2);
  assert.equal(day('hk:Apple Health', '2026-11-02').steps, 10432);
});

test('Apple Health sources merge and score end-to-end', () => {
  const m = mergeSources(sources);
  assert.equal(m.primary.sleep, 'hk:Oura'); // ring preferred for overnight on equal coverage
  assert.equal(m.days.find((x) => x.date === '2026-11-02').bodyFatPct, 18.2);
  const a = analyze(m.days, { age: 38, sex: 'male', device: 'apple-watch' });
  assert.ok(a.days.length >= 1);
});
