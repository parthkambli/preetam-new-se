const mongoose = require('mongoose');
const SchoolAdmission = require('../models/SchoolAdmission');
const SchoolAttendance = require('../models/SchoolAttendance');
const Activity = require('../models/Activity');
const {
  getTodayIST,
  getDayNameFromDate
} = require('../utils/date');

exports.getAttendanceSummary = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { date, activityId, page, limit } = req.query;
    const targetDate = date || getTodayIST();
    const dayName = getDayNameFromDate(targetDate);
    const dayField = dayName.toLowerCase() + 'ActivityId';

    const matchStage = {
      organizationId,
      status: 'Active',
      'timetable.0': { $exists: true },
    };

    // Base pipeline: match → unwind → filter day → optional activity → group
    const basePipeline = [
      { $match: matchStage },
      { $unwind: '$timetable' },
      { $match: { [`timetable.${dayField}`]: { $ne: null } } },
    ];

    if (activityId) {
      basePipeline.push({
        $match: { [`timetable.${dayField}`]: new mongoose.Types.ObjectId(activityId) },
      });
    }

    basePipeline.push({
      $group: {
        _id: {
          periodId: '$timetable.periodId',
          activityId: `$timetable.${dayField}`,
        },
        studentCount: { $sum: 1 },
        students: { $push: '$_id' },
      },
    });

    // Lookup stages (used after grouping)
    const lookupStages = [
      {
        $lookup: {
          from: 'timetables',
          localField: '_id.periodId',
          foreignField: '_id',
          as: 'period',
        },
      },
      { $unwind: { path: '$period', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'activities',
          localField: '_id.activityId',
          foreignField: '_id',
          as: 'activity',
        },
      },
      { $unwind: { path: '$activity', preserveNullAndEmptyArrays: true } },
      { $sort: { 'period.startTime': 1 } },
    ];

    const isPaginated = page !== undefined || limit !== undefined;
    let schedules;

    if (isPaginated) {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
      const skip = (pageNum - 1) * limitNum;

      const [countResult, dataResult] = await Promise.all([
        SchoolAdmission.aggregate([...basePipeline, { $count: 'totalRecords' }]),
        SchoolAdmission.aggregate([
          ...basePipeline,
          { $sort: { '_id.periodId': 1 } },
          { $skip: skip },
          { $limit: limitNum },
          ...lookupStages,
        ]),
      ]);

      const totalRecords = countResult[0]?.totalRecords || 0;
      schedules = dataResult;

      const periodActivityPairs = schedules.map(s => ({
        periodId: s._id.periodId,
        activityId: s._id.activityId,
      }));

      const attendanceRecords = await SchoolAttendance.find({
        $or: periodActivityPairs.map(p => ({
          periodId: p.periodId,
          activityId: p.activityId,
        })),
        attendanceDate: targetDate,
        organizationId,
      }).lean();

      const recordMap = {};
      for (const r of attendanceRecords) {
        const key = `${r.periodId.toString()}_${r.activityId.toString()}`;
        if (!recordMap[key]) recordMap[key] = { present: 0, absent: 0 };
        if (r.status === 'Present') recordMap[key].present++;
        else if (r.status === 'Absent') recordMap[key].absent++;
      }

      const result = schedules.map(s => {
        const key = `${s._id.periodId.toString()}_${s._id.activityId.toString()}`;
        const counts = recordMap[key] || { present: 0, absent: 0 };
        return {
          periodId: s._id.periodId,
          periodName: s.period?.name || '',
          startTime: s.period?.startTime || '',
          endTime: s.period?.endTime || '',
          activityId: s._id.activityId,
          activityName: s.activity?.name || '',
          day: dayName,
          date: targetDate,
          totalStudents: s.studentCount,
          presentCount: counts.present,
          absentCount: counts.absent,
        };
      });

      return res.json({
        attendance: result,
        pagination: {
          totalRecords,
          totalPages: Math.ceil(totalRecords / limitNum),
          page: pageNum,
          limit: limitNum,
        },
      });
    }

    // Default: no pagination (backward-compatible)
    schedules = await SchoolAdmission.aggregate([...basePipeline, ...lookupStages]);

    const periodActivityPairs = schedules.map(s => ({
      periodId: s._id.periodId,
      activityId: s._id.activityId,
    }));

    const attendanceRecords = await SchoolAttendance.find({
      $or: periodActivityPairs.map(p => ({
        periodId: p.periodId,
        activityId: p.activityId,
      })),
      attendanceDate: targetDate,
      organizationId,
    }).lean();

    const recordMap = {};
    for (const r of attendanceRecords) {
      const key = `${r.periodId.toString()}_${r.activityId.toString()}`;
      if (!recordMap[key]) recordMap[key] = { present: 0, absent: 0 };
      if (r.status === 'Present') recordMap[key].present++;
      else if (r.status === 'Absent') recordMap[key].absent++;
    }

    const result = schedules.map(s => {
      const key = `${s._id.periodId.toString()}_${s._id.activityId.toString()}`;
      const counts = recordMap[key] || { present: 0, absent: 0 };
      return {
        periodId: s._id.periodId,
        periodName: s.period?.name || '',
        startTime: s.period?.startTime || '',
        endTime: s.period?.endTime || '',
        activityId: s._id.activityId,
        activityName: s.activity?.name || '',
        day: dayName,
        date: targetDate,
        totalStudents: s.studentCount,
        presentCount: counts.present,
        absentCount: counts.absent,
      };
    });

    res.json({ attendance: result });
  } catch (err) {
    console.error('getAttendanceSummary error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendanceStudents = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { date, periodId, activityId } = req.query;

    if (!date || !periodId || !activityId) {
      return res.status(400).json({ message: 'date, periodId, and activityId query params required' });
    }

    const dayName = getDayNameFromDate(date);
    const dayField = dayName.toLowerCase() + 'ActivityId';

    const students = await SchoolAdmission.find({
      organizationId,
      status: 'Active',
      timetable: {
        $elemMatch: {
          periodId: new mongoose.Types.ObjectId(periodId),
          [dayField]: new mongoose.Types.ObjectId(activityId),
        }
      }
    })
    .select('_id admissionId fullName mobile photo')
    .lean();

    const attendanceRecords = await SchoolAttendance.find({
      studentId: { $in: students.map(s => s._id) },
      periodId: new mongoose.Types.ObjectId(periodId),
      activityId: new mongoose.Types.ObjectId(activityId),
      attendanceDate: date,
      organizationId,
    }).lean();

    const statusMap = {};
    for (const r of attendanceRecords) {
      statusMap[r.studentId.toString()] = r.status;
    }

    const result = students.map(s => ({
      _id: s._id,
      admissionId: s.admissionId,
      fullName: s.fullName,
      mobile: s.mobile,
      photo: s.photo,
      status: statusMap[s._id.toString()] || null,
    }));

    res.json({ students: result });
  } catch (err) {
    console.error('getAttendanceStudents error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getActivityList = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const activities = await Activity.find({ organizationId })
      .select('_id name')
      .sort({ name: 1 })
      .lean();
    res.json({ data: activities });
  } catch (err) {
    console.error('getActivityList error:', err);
    res.status(500).json({ message: err.message });
  }
};
