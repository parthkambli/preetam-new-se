const SchoolAdmission = require('../models/SchoolAdmission');
const Student = require('../models/Student');
const TimeTable = require('../models/schoolPeriod');
const {
  computeTimetableActivityCounts,
  negateActivityCounts,
  buildOccupancyInc,
} = require('../helpers/occupancyHelpers');

async function syncExpiredAdmissions() {
  const now = new Date();

  const expired = await SchoolAdmission.find({
    status: 'Active',
    endDate: { $lt: now },
  }).lean();

  let updatedCount = 0;

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
