const cron = require('node-cron');
const SchoolAdmission = require('../models/SchoolAdmission');
const Student = require('../models/Student');
const TimeTable = require('../models/schoolPeriod');
const { getTodayIST } = require('../utils/date');
const {
  computeTimetableActivityCounts,
  negateActivityCounts,
  buildOccupancyInc,
} = require('../helpers/occupancyHelpers');

async function syncExpiredAdmissions() {
  const todayStr = getTodayIST();
  const startOfToday = new Date(`${todayStr}T00:00:00.000+05:30`);
  const endOfToday = new Date(`${todayStr}T23:59:59.999+05:30`);
  let updatedCount = 0;

  // ── Activate: Inactive admissions whose startDate has arrived ──
  const toActivate = await SchoolAdmission.find({
    status: 'Inactive',
    startDate: { $lte: endOfToday },
    endDate: { $gte: startOfToday },
  }).lean();

  for (const admission of toActivate) {
    const counts = computeTimetableActivityCounts(admission.timetable);
    const incMap = buildOccupancyInc(counts);

    const ops = Object.entries(incMap).map(([pid, inc]) => ({
      updateOne: { filter: { _id: pid }, update: { $inc: inc } },
    }));
    if (ops.length > 0) await TimeTable.bulkWrite(ops);

    await SchoolAdmission.updateOne(
      { _id: admission._id },
      { $set: { status: 'Active', updatedAt: Date.now() } }
    );

    await Student.updateOne(
      { admissionId: admission._id },
      { $set: { status: 'Active', updatedAt: Date.now() } }
    );

    updatedCount++;
  }

  // ── Deactivate: Active admissions whose endDate has passed ──
  const expired = await SchoolAdmission.find({
    status: 'Active',
    endDate: { $lt: startOfToday },
  }).lean();

  for (const admission of expired) {
    const counts = computeTimetableActivityCounts(admission.timetable);
    const incMap = buildOccupancyInc(negateActivityCounts(counts));

    const ops = Object.entries(incMap).map(([pid, inc]) => ({
      updateOne: { filter: { _id: pid }, update: { $inc: inc } },
    }));
    if (ops.length > 0) await TimeTable.bulkWrite(ops);

    await SchoolAdmission.updateOne(
      { _id: admission._id },
      { $set: { status: 'Inactive', updatedAt: Date.now() } }
    );

    await Student.updateOne(
      { admissionId: admission._id },
      { $set: { status: 'Inactive', updatedAt: Date.now() } }
    );

    updatedCount++;
  }

  return updatedCount;
}

function startSchoolExpirySync() {
  // Daily at 12:10 AM IST (after schoolAbsentCron at 12:08)
  cron.schedule('10 0 * * *', async () => {
    try {
      console.log('[Cron] Running school admission expiry sync...');
      const count = await syncExpiredAdmissions();
      console.log(`[Cron] School admission expiry sync complete. Updated ${count} admissions.`);
    } catch (err) {
      console.error('[Cron] School admission expiry sync failed:', err.message || err);
    }
  }, { timezone: "Asia/Kolkata" });

  // Also run once on server start
  setTimeout(async () => {
    try {
      console.log('Running school admission expiry sync on server start...');
      const count = await syncExpiredAdmissions();
      console.log(`School admission expiry sync complete. Updated ${count} admissions.`);
    } catch (err) {
      console.error('School admission expiry sync failed:', err.message || err);
    }
  }, 10000);
}

module.exports = { syncExpiredAdmissions, startSchoolExpirySync };
