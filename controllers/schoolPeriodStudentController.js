const mongoose = require('mongoose');
const SchoolAdmission = require('../models/SchoolAdmission');

exports.getPeriodStudents = async (req, res) => {
  try {
    const { periodId, activityId, day } = req.query;
    if (!periodId || !activityId) {
      return res.status(400).json({ message: 'periodId and activityId query params required' });
    }

    const organizationId = req.organizationId;
    const pid = new mongoose.Types.ObjectId(periodId);
    const aid = new mongoose.Types.ObjectId(activityId);

    const dayFields = [
      'mondayActivityId',
      'tuesdayActivityId',
      'wednesdayActivityId',
      'thursdayActivityId',
      'fridayActivityId',
      'saturdayActivityId',
      'sundayActivityId',
    ];

    const timetableMatch = day && dayFields.includes(day + 'ActivityId')
      ? { periodId: pid, [day + 'ActivityId']: aid }
      : { periodId: pid, $or: dayFields.map(f => ({ [f]: aid })) };

    const students = await SchoolAdmission.find({
      organizationId,
      status: 'Active',
      timetable: { $elemMatch: timetableMatch },
    })
      .select('_id admissionId fullName mobile photo status')
      .lean();

    res.json({ students });
  } catch (err) {
    console.error('getPeriodStudents error:', err);
    res.status(500).json({ message: err.message });
  }
};
