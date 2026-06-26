const DAY_FIELDS = ['mondayActivityId', 'tuesdayActivityId', 'wednesdayActivityId', 'thursdayActivityId', 'fridayActivityId', 'saturdayActivityId', 'sundayActivityId'];
const DAY_NAMES = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function computeTimetableActivityCounts(timetable) {
  const counts = {};
  for (const row of (timetable || [])) {
    if (!row.periodId) continue;
    const pid = row.periodId.toString();
    if (!counts[pid]) counts[pid] = {};
    for (let i = 0; i < DAY_FIELDS.length; i++) {
      const activityId = row[DAY_FIELDS[i]];
      if (activityId) {
        const aid = activityId.toString();
        if (!counts[pid][aid]) {
          counts[pid][aid] = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
        }
        counts[pid][aid][DAY_NAMES[i]]++;
      }
    }
  }
  return counts;
}

function diffTimetableActivityCounts(oldTt, newTt) {
  const oldCounts = computeTimetableActivityCounts(oldTt);
  const newCounts = computeTimetableActivityCounts(newTt);
  const allPids = new Set([...Object.keys(oldCounts), ...Object.keys(newCounts)]);
  const diff = {};
  for (const pid of allPids) {
    const oldActs = oldCounts[pid] || {};
    const newActs = newCounts[pid] || {};
    const allAids = new Set([...Object.keys(oldActs), ...Object.keys(newActs)]);
    for (const aid of allAids) {
      const old = oldActs[aid] || { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
      const cur = newActs[aid] || { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 };
      const d = {};
      for (const day of DAY_NAMES) {
        const delta = (cur[day] || 0) - (old[day] || 0);
        if (delta !== 0) d[day] = delta;
      }
      if (Object.keys(d).length > 0) {
        if (!diff[pid]) diff[pid] = {};
        diff[pid][aid] = d;
      }
    }
  }
  return diff;
}

function negateActivityCounts(activityCounts) {
  const out = {};
  for (const [pid, activities] of Object.entries(activityCounts)) {
    out[pid] = {};
    for (const [aid, days] of Object.entries(activities)) {
      const neg = {};
      for (const day of DAY_NAMES) {
        if (days[day] !== 0) neg[day] = -days[day];
      }
      if (Object.keys(neg).length > 0) out[pid][aid] = neg;
    }
  }
  return out;
}

function buildOccupancyInc(activityCounts) {
  const result = {};
  for (const [pid, activities] of Object.entries(activityCounts)) {
    const inc = {};
    for (const [aid, days] of Object.entries(activities)) {
      for (const day of DAY_NAMES) {
        const delta = days[day];
        if (delta !== 0) {
          inc[`dayCounts.${day}`] = (inc[`dayCounts.${day}`] || 0) + delta;
          inc[`activityDayCounts.${aid}_${day}`] = (inc[`activityDayCounts.${aid}_${day}`] || 0) + delta;
        }
      }
    }
    if (Object.keys(inc).length > 0) result[pid] = inc;
  }
  return result;
}

function validateActivityCapacity(periodMap, activityCounts) {
  for (const [pid, activities] of Object.entries(activityCounts)) {
    const period = periodMap[pid];
    if (!period) continue;
    for (const [aid, days] of Object.entries(activities)) {
      for (const day of DAY_NAMES) {
        const needed = days[day];
        if (needed > 0) {
          const key = `${aid}_${day}`;
          const current = period.activityDayCounts?.[key] || 0;
          if (current + needed > period.capacity) {
            const periodName = period.name || 'Period';
            return `"${periodName}" on ${day} has only ${period.capacity - current} seat(s) left but needs ${needed}.`;
          }
        }
      }
    }
  }
  return null;
}

module.exports = {
  computeTimetableActivityCounts,
  diffTimetableActivityCounts,
  negateActivityCounts,
  buildOccupancyInc,
  validateActivityCapacity,
};
