// Journal + behaviour impact: compares next-morning recovery on "yes" vs "no" days.
// Like WHOOP, an impact is only shown once there are ≥5 yes and ≥5 no answers in the last 90 days,
// and it is a correlation, not proof of cause.

import { isNum, mean, addDays } from './util.js';

export const BEHAVIORS = [
  { key: 'alcohol', label: 'Drank alcohol' },
  { key: 'lateCaffeine', label: 'Caffeine after 2 pm' },
  { key: 'lateMeal', label: 'Ate close to bedtime' },
  { key: 'screens', label: 'Screens in bed' },
  { key: 'stressed', label: 'Felt stressed' },
  { key: 'sauna', label: 'Sauna / heat' },
  { key: 'coldPlunge', label: 'Cold exposure' },
  { key: 'magnesium', label: 'Took magnesium' },
  { key: 'meditation', label: 'Meditated / breathwork' },
  { key: 'readBeforeBed', label: 'Read before bed' },
  { key: 'sick', label: 'Felt sick' },
  { key: 'travel', label: 'Travelled' },
];

/**
 * @param {Object<string, Object<string, boolean>>} journal answers keyed by date (the day the behaviour happened)
 * @param {Map<string, object>} byDate analysed days keyed by date
 */
export function behaviorImpacts(journal, byDate, today) {
  const since = addDays(today, -90);
  return BEHAVIORS.map((b) => {
    const yes = [];
    const no = [];
    for (const [date, answers] of Object.entries(journal || {})) {
      if (date < since || !(b.key in answers)) continue;
      const next = byDate.get(addDays(date, 1));
      const rec = next && next.recovery && next.recovery.score;
      if (!isNum(rec)) continue;
      (answers[b.key] ? yes : no).push(rec);
    }
    const ready = yes.length >= 5 && no.length >= 5;
    return {
      ...b,
      yesCount: yes.length,
      noCount: no.length,
      ready,
      impact: ready ? mean(yes) - mean(no) : null,
    };
  });
}
