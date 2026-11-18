// Offline import: Fitbit / Google Takeout export files → normalised days.
//
// Understands the classic Fitbit export layout (still produced by many archives):
//   sleep-YYYY-MM-DD.json, heart_rate-YYYY-MM-DD.json, resting_heart_rate-*.json, steps-*.json,
//   exercise-*.json, demographic_vo2_max-*.json, weight-*.json,
//   "Daily Heart Rate Variability Summary - *.csv", "Daily Respiratory Rate Summary - *.csv",
//   "Daily SpO2 - *.csv", "Computed Temperature - *.csv"
// plus this app's own export (*.healthspan.json). Files are matched by name pattern, not folder, because the
// post-migration Google Takeout folder layout is not documented and varies between archives.
//
// Timestamps: Fitbit export heart-rate/steps files are written in UTC, sleep logs in local time. Set
// `hrIsUtc=false` if your intraday files are already in local time.

import { isNum, toISODate, addDays } from '../engine/util.js';

const pad = (n) => String(n).padStart(2, '0');

/** "MM/DD/YY HH:MM:SS" → Date (interpreted as UTC or local). */
function parseFitbitStamp(s, utc) {
  const m = /^(\d{2})\/(\d{2})\/(\d{2,4})(?: (\d{2}):(\d{2}):(\d{2}))?/.exec(s);
  if (!m) return new Date(s);
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const args = [year, Number(m[1]) - 1, Number(m[2]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)];
  return utc ? new Date(Date.UTC(...args)) : new Date(...args);
}

const localIso = (d) => `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const stripZone = (s) => String(s).replace(/\.\d+$/, '').replace(/Z$/, '');

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];
  const head = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((l) => {
    const cells = l.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return Object.fromEntries(head.map((h, i) => [h, cells[i]]));
  });
}

const dateFromName = (name) => (/(\d{4}-\d{2}-\d{2})/.exec(name) || [])[1];

export async function importFiles(fileList, { maxDays = 200, hrIsUtc = true, onProgress } = {}) {
  const files = [...fileList];
  const days = new Map();
  const get = (date) => {
    if (!days.has(date)) days.set(date, { date, workouts: [], naps: [] });
    return days.get(date);
  };
  const warnings = [];
  let profile = null;
  let journal = null;

  // Own format short-circuit.
  const own = files.find((f) => /\.healthspan\.json$/i.test(f.name));
  if (own) {
    const data = JSON.parse(await own.text());
    return { days: data.days, profile: data.profile, journal: data.journal, warnings };
  }

  // Only parse files within the requested window (filenames carry the start date of their chunk).
  const newest = files.map((f) => dateFromName(f.name)).filter(Boolean).sort().pop();
  const cutoff = newest ? addDays(newest, -(maxDays + 31)) : '0000';
  const relevant = files.filter((f) => !dateFromName(f.name) || dateFromName(f.name) >= cutoff);

  let done = 0;
  for (const f of relevant) {
    const name = f.name;
    try {
      if (/^sleep-.*\.json$/i.test(name)) {
        for (const s of JSON.parse(await f.text())) {
          const sum = s.levels && s.levels.summary ? s.levels.summary : {};
          const rec = {
            start: stripZone(s.startTime), end: stripZone(s.endTime), asleepMin: s.minutesAsleep, inBedMin: s.timeInBed,
            classic: s.type === 'classic' ? true : undefined,
            deepMin: sum.deep?.minutes, remMin: sum.rem?.minutes, lightMin: sum.light?.minutes, awakeMin: sum.wake?.minutes ?? s.minutesAwake,
          };
          const d = get(s.dateOfSleep);
          if (s.mainSleep !== false && (!d.sleep || rec.asleepMin > d.sleep.asleepMin)) {
            if (d.sleep) d.naps.push(d.sleep);
            d.sleep = rec;
          } else d.naps.push(rec);
        }
      } else if (/^heart_rate-.*\.json$/i.test(name)) {
        const sums = new Map();
        for (const p of JSON.parse(await f.text())) {
          const t = parseFitbitStamp(p.dateTime, hrIsUtc);
          const key = `${toISODate(t)}|${t.getHours() * 60 + t.getMinutes()}`;
          const s = sums.get(key) || [0, 0];
          s[0] += p.value.bpm; s[1] += 1;
          sums.set(key, s);
        }
        for (const [key, [sum, n]] of sums) {
          const [date, minute] = key.split('|');
          const d = get(date);
          if (!d.hrMinutes) d.hrMinutes = new Array(1440).fill(null);
          d.hrMinutes[Number(minute)] = sum / n;
        }
      } else if (/^steps-.*\.json$/i.test(name)) {
        for (const p of JSON.parse(await f.text())) {
          const t = parseFitbitStamp(p.dateTime, hrIsUtc);
          const d = get(toISODate(t));
          if (!d.stepMinutes) d.stepMinutes = new Array(1440).fill(0);
          const v = Number(p.value) || 0;
          d.stepMinutes[t.getHours() * 60 + t.getMinutes()] += v;
          d.steps = (d.steps || 0) + v;
        }
      } else if (/^resting_heart_rate-.*\.json$/i.test(name)) {
        for (const p of JSON.parse(await f.text())) {
          if (!p.value || !p.value.value) continue;
          const t = parseFitbitStamp(p.value.date || p.dateTime, false);
          get(toISODate(t)).rhr = p.value.value;
        }
      } else if (/^exercise-.*\.json$/i.test(name)) {
        for (const e of JSON.parse(await f.text())) {
          const t = parseFitbitStamp(e.startTime, false);
          const zones = {};
          for (const z of e.heartRateZones || []) {
            const n = (z.name || '').toLowerCase();
            if (n.includes('fat')) zones.fatBurn = z.minutes;
            else if (n.includes('cardio')) zones.cardio = z.minutes;
            else if (n.includes('peak')) zones.peak = z.minutes;
          }
          get(toISODate(t)).workouts.push({
            name: e.activityName, type: e.activityName, start: localIso(t), durationMin: Math.round((e.duration || 0) / 60000),
            avgHr: e.averageHeartRate, zoneMinutes: Object.keys(zones).length ? zones : undefined,
          });
        }
      } else if (/^demographic_vo2_max-.*\.json$/i.test(name)) {
        for (const p of JSON.parse(await f.text())) {
          const t = parseFitbitStamp(p.dateTime, false);
          const v = p.value?.filteredDemographicVO2Max ?? p.value?.demographicVO2Max;
          if (isNum(v)) get(toISODate(t)).vo2max = v;
        }
      } else if (/^weight-.*\.json$/i.test(name)) {
        for (const p of JSON.parse(await f.text())) {
          const t = parseFitbitStamp(p.date, false);
          const d = get(toISODate(t));
          if (isNum(p.fat)) d.bodyFatPct = p.fat;
          if (isNum(p.weight)) d.weightKg = p.weight > 140 ? p.weight * 0.4536 : p.weight; // export may be lbs
        }
      } else if (/heart rate variability summary.*\.csv$/i.test(name)) {
        for (const row of parseCsv(await f.text())) {
          const date = (row.timestamp || '').slice(0, 10);
          if (date && isNum(Number(row.rmssd))) get(date).hrv = Number(row.rmssd);
        }
      } else if (/respiratory rate summary.*\.csv$/i.test(name)) {
        for (const row of parseCsv(await f.text())) {
          const date = (row.timestamp || '').slice(0, 10);
          const v = Number(row.daily_respiratory_rate ?? row.full_sleep_breathing_rate);
          if (date && isNum(v) && v > 0) get(date).respRate = v;
        }
      } else if (/daily spo2.*\.csv$/i.test(name)) {
        for (const row of parseCsv(await f.text())) {
          const date = (row.timestamp || '').slice(0, 10);
          const v = Number(row.average_value);
          if (date && isNum(v) && v > 0) get(date).spo2 = v;
        }
      } else if (/computed temperature.*\.csv$/i.test(name)) {
        for (const row of parseCsv(await f.text())) {
          const date = (row.sleep_end || '').slice(0, 10);
          // Mean deviation from the personal baseline across the night's samples.
          const v = Number(row.baseline_relative_sample_sum) / Number(row.temperature_samples);
          if (date && isNum(v)) {
            get(date).skinTempDelta = v;
            const s = Number(row.baseline_relative_nightly_standard_deviation);
            if (isNum(s) && s > 0) get(date).skinTempSd = s;
          }
        }
      } else if (/^run_vo2_max-.*\.json$/i.test(name)) {
        // GPS-run VO2max estimates → mark the day's VO2max as measured, not demographic.
        for (const p of JSON.parse(await f.text())) {
          const t = parseFitbitStamp(p.dateTime, false);
          const v = p.value?.runVO2Max ?? p.value?.filteredRunVO2Max;
          if (isNum(v)) { const d = get(toISODate(t)); d.vo2max = v; d.vo2Estimated = false; }
        }
      } else if (/^devices?\.csv$/i.test(name)) {
        const row = parseCsv(await f.text()).find((r) => /tracker|watch/i.test(`${r.device_type || ''} ${r.type || ''}`)) || {};
        profile = { ...(profile || {}), deviceName: row.device_version || row.deviceVersion || row.device_name };
      } else if (/^profile\.csv$/i.test(name) || /user.*profile.*\.csv$/i.test(name)) {
        const row = parseCsv(await f.text())[0] || {};
        const dob = row.date_of_birth;
        profile = {
          ...(profile || {}),
          sex: /female/i.test(row.gender || '') ? 'female' : /male/i.test(row.gender || '') ? 'male' : undefined,
          age: dob ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 86400000)) : undefined,
        };
      }
    } catch (e) {
      warnings.push(`${name}: ${e.message}`);
    }
    done++;
    if (onProgress && done % 10 === 0) onProgress(done, relevant.length);
  }

  const out = [...days.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
  if (out.length > maxDays) out.splice(0, out.length - maxDays);
  if (!out.length) warnings.push('No recognised Fitbit export files were found.');
  return { days: out, profile, journal, warnings, parsedFiles: relevant.length };
}
