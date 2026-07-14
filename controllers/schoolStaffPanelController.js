const mongoose = require('mongoose');
const schoolDashboardController = require('./schoolDashboardController');
const schoolEnquiryController = require('./schoolEnquiryController');
const followupController = require('./followupController');
const schoolAdmissionController = require('./schoolAdmissionController');
const studentController = require('./studentController');
const schoolServiceController = require('./schoolServiceController');
const schoolServiceBookingController = require('./schoolServiceBookingController');
const feeController = require('./feeController');
const healthRecordController = require('./healthRecordController');
const renewalController = require('./renewalController');
const activityController = require('./activityController');
const eventController = require('./eventController');
const User = require('../models/User');
const FitnessStaff = require('../models/FitnessStaff');
const Activity = require('../models/Activity');
const SchoolAdmission = require('../models/SchoolAdmission');
const SchoolAttendance = require('../models/SchoolAttendance');
const TimeTable = require('../models/schoolPeriod');
const Event = require('../models/Event');
const {
  getTodayIST,
  getDayNameFromDate
} = require('../utils/date');
exports.getDashboard = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const emptyShape = {
      success: true,
      data: {
        profile: null,
        stats: { todayClasses: 0, todayStudents: 0, presentToday: 0, absentToday: 0, pendingToday: 0 },
        upcomingClasses: [],
        upcomingEvents: [],
      },
    };

    const user = await User.findById(req.user.id).lean();
    if (!user || !user.mobile) {
      return res.json(emptyShape);
    }

    const fitnessStaff = await FitnessStaff.findOne({ mobileNumber: user.mobile }).lean();
    if (!fitnessStaff) {
      return res.json(emptyShape);
    }

    const activities = await Activity.find({
      staffName: fitnessStaff.fullName,
      organizationId,
    }).select('_id name').lean();

    const profile = {
      name: fitnessStaff.fullName || 'Staff',
      mobile: fitnessStaff.mobileNumber || '',
      email: fitnessStaff.emailId || '',
      role: user.role || fitnessStaff.role || '',
      assignedActivities: activities.map(a => a.name),
      profileImage: fitnessStaff.profilePhoto
        ? `${req.protocol}://${req.get('host')}${fitnessStaff.profilePhoto}`
        : '',
    };

    const todayIST = getTodayIST();
    const dayName = getDayNameFromDate(todayIST);
    const dayField = dayName.toLowerCase() + 'ActivityId';
    const [y, m, d] = todayIST.split('-').map(Number);

    const now = new Date();
    const currentISTTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(now);

    const activityIds = activities.map(a => a._id);

    const schedule = await SchoolAdmission.aggregate([
      { $match: { organizationId, status: 'Active' } },
      { $match: { 'timetable.0': { $exists: true } } },
      { $unwind: '$timetable' },
      { $match: { [`timetable.${dayField}`]: { $in: activityIds, $ne: null } } },
      {
        $group: {
          _id: {
            periodId: '$timetable.periodId',
            activityId: `$timetable.${dayField}`,
          },
          studentCount: { $sum: 1 },
        },
      },
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
      {
        $project: {
          _id: 0,
          periodId: '$_id.periodId',
          periodName: { $ifNull: ['$period.name', ''] },
          startTime: { $ifNull: ['$period.startTime', ''] },
          endTime: { $ifNull: ['$period.endTime', ''] },
          activityId: '$_id.activityId',
          activityName: { $ifNull: ['$activity.name', ''] },
          studentCount: 1,
        },
      },
    ]);

    const todayClasses = schedule.length;
    const todayStudents = schedule.reduce((sum, s) => sum + s.studentCount, 0);

    const periodIds = [...new Set(schedule.map(s => s.periodId))];
    const scheduleActivityIds = [...new Set(schedule.map(s => s.activityId))];

    const [presentToday, absentToday] = await Promise.all([
      SchoolAttendance.countDocuments({
        organizationId,
        attendanceDate: todayIST,
        status: 'Present',
        periodId: { $in: periodIds },
        activityId: { $in: scheduleActivityIds },
      }),
      SchoolAttendance.countDocuments({
        organizationId,
        attendanceDate: todayIST,
        status: 'Absent',
        periodId: { $in: periodIds },
        activityId: { $in: scheduleActivityIds },
      }),
    ]);

    const pendingToday = todayStudents - presentToday - absentToday;

    const upcomingClasses = schedule.filter(s => s.startTime >= currentISTTime);

    const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(dayName);
    const daysUntilSunday = dayIndex === 0 ? 0 : 7 - dayIndex;
    const todayDate = new Date(Date.UTC(y, m - 1, d));
    const sundayDate = new Date(Date.UTC(y, m - 1, d + daysUntilSunday, 23, 59, 59, 999));

    const events = await Event.find({
      organizationId,
      date: { $gte: todayDate, $lte: sundayDate },
    }).sort({ date: 1, startTime: 1 }).lean();

    return res.json({
      success: true,
      data: {
        profile,
        stats: {
          todayClasses,
          todayStudents,
          presentToday,
          absentToday,
          pendingToday,
        },
        upcomingClasses,
        upcomingEvents: events,
      },
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMySchedule = async (req, res) => {
  try {
    const organizationId = req.organizationId;

    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fitnessStaff = await FitnessStaff.findOne({ mobileNumber: user.mobile }).lean();
    if (!fitnessStaff) {
      return res.json({ schedules: [] });
    }

    const activities = await Activity.find({
      staffName: fitnessStaff.fullName,
      organizationId,
    }).select('_id name').lean();

    if (activities.length === 0) {
      return res.json({ schedules: [] });
    }

    const activityIds = activities.map(a => a._id);

    const schedules = await SchoolAdmission.aggregate([
      { $match: { organizationId, status: 'Active' } },
      { $match: { 'timetable.0': { $exists: true } } },
      { $unwind: '$timetable' },
      {
        $match: {
          $or: [
            { 'timetable.mondayActivityId': { $in: activityIds } },
            { 'timetable.tuesdayActivityId': { $in: activityIds } },
            { 'timetable.wednesdayActivityId': { $in: activityIds } },
            { 'timetable.thursdayActivityId': { $in: activityIds } },
            { 'timetable.fridayActivityId': { $in: activityIds } },
            { 'timetable.saturdayActivityId': { $in: activityIds } },
            { 'timetable.sundayActivityId': { $in: activityIds } },
          ]
        }
      },
      {
        $addFields: {
          dayEntries: [
            { day: 'Monday',    activityId: '$timetable.mondayActivityId' },
            { day: 'Tuesday',   activityId: '$timetable.tuesdayActivityId' },
            { day: 'Wednesday', activityId: '$timetable.wednesdayActivityId' },
            { day: 'Thursday',  activityId: '$timetable.thursdayActivityId' },
            { day: 'Friday',    activityId: '$timetable.fridayActivityId' },
            { day: 'Saturday',  activityId: '$timetable.saturdayActivityId' },
            { day: 'Sunday',    activityId: '$timetable.sundayActivityId' },
          ]
        }
      },
      { $unwind: '$dayEntries' },
      { $match: { 'dayEntries.activityId': { $in: activityIds, $ne: null } } },
      {
        $group: {
          _id: {
            day: '$dayEntries.day',
            periodId: '$timetable.periodId',
            activityId: '$dayEntries.activityId',
          },
          studentCount: { $sum: 1 },
        }
      },
      {
        $lookup: {
          from: 'timetables',
          localField: '_id.periodId',
          foreignField: '_id',
          as: 'period',
        }
      },
      { $unwind: { path: '$period', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'activities',
          localField: '_id.activityId',
          foreignField: '_id',
          as: 'activity',
        }
      },
      { $unwind: { path: '$activity', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          dayOrder: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id.day', 'Monday'] }, then: 1 },
                { case: { $eq: ['$_id.day', 'Tuesday'] }, then: 2 },
                { case: { $eq: ['$_id.day', 'Wednesday'] }, then: 3 },
                { case: { $eq: ['$_id.day', 'Thursday'] }, then: 4 },
                { case: { $eq: ['$_id.day', 'Friday'] }, then: 5 },
                { case: { $eq: ['$_id.day', 'Saturday'] }, then: 6 },
                { case: { $eq: ['$_id.day', 'Sunday'] }, then: 7 },
              ],
              default: 8,
            }
          }
        }
      },
      { $sort: { dayOrder: 1, 'period.startTime': 1 } },
      {
        $project: {
          _id: 0,
          day: '$_id.day',
          periodId: '$_id.periodId',
          periodName: { $ifNull: ['$period.name', ''] },
          startTime: { $ifNull: ['$period.startTime', ''] },
          endTime: { $ifNull: ['$period.endTime', ''] },
          activityId: '$_id.activityId',
          activityName: { $ifNull: ['$activity.name', ''] },
          studentCount: 1,
        }
      },
    ]);

    res.json({ schedules });
  } catch (err) {
    console.error('getMySchedule error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getScheduleStudents = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { day, activityId, periodId } = req.query;

    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(day)) {
      return res.status(400).json({ message: 'Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday' });
    }

    if (!activityId || !periodId) {
      return res.status(400).json({ message: 'activityId and periodId are required' });
    }

    const dayField = `${day}ActivityId`;

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
    .select('_id admissionId fullName mobile status')
    .lean();

    res.json({ students });
  } catch (err) {
    console.error('getScheduleStudents error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user || !user.mobile) {
      return res.json({
        success: true,
        data: {
          name: "Staff",
          mobile: "",
          email: "",
          role: "",
          assignedActivities: [],
          profileImage: ""
        }
      });
    }

    const fitnessStaff = await FitnessStaff.findOne({ mobileNumber: user.mobile }).lean();

    if (!fitnessStaff) {
      return res.json({
        success: true,
        data: {
          name: user.name || "Staff",
          mobile: user.mobile || "",
          email: user.email || "",
          role: user.role || "",
          assignedActivities: [],
          profileImage: ""
        }
      });
    }

    const activities = await Activity.find({
      staffName: fitnessStaff.fullName,
      organizationId: req.organizationId,
    }).select('name').lean();

    return res.json({
      success: true,
      data: {
        name: fitnessStaff.fullName || "Staff",
        mobile: fitnessStaff.mobileNumber || "",
        email: fitnessStaff.emailId || "",
        role: user.role || fitnessStaff.role || "",
        assignedActivities: activities.map(a => a.name),
        profileImage: fitnessStaff.profilePhoto
          ? `${req.protocol}://${req.get("host")}${fitnessStaff.profilePhoto}`
          : ""
      }
    });
  } catch (err) {
    console.error("getProfile error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'date query param required (YYYY-MM-DD)' });
    }

    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });

    const fitnessStaff = await FitnessStaff.findOne({ mobileNumber: user.mobile }).lean();
    if (!fitnessStaff) return res.json({ attendance: [] });

    const activities = await Activity.find({
      staffName: fitnessStaff.fullName,
      organizationId,
    }).select('_id name').lean();

    if (activities.length === 0) return res.json({ attendance: [] });

    const activityIds = activities.map(a => a._id);

    
    const dayName = getDayNameFromDate(date);
    const dayField = dayName.toLowerCase() + 'ActivityId';

    const schedules = await SchoolAdmission.aggregate([
      { $match: { organizationId, status: 'Active' } },
      { $match: { 'timetable.0': { $exists: true } } },
      { $unwind: '$timetable' },
      { $match: { [`timetable.${dayField}`]: { $in: activityIds, $ne: null } } },
      {
        $group: {
          _id: {
            periodId: '$timetable.periodId',
            activityId: `$timetable.${dayField}`,
          },
          studentCount: { $sum: 1 },
          students: { $push: '$_id' },
        }
      },
      {
        $lookup: {
          from: 'timetables',
          localField: '_id.periodId',
          foreignField: '_id',
          as: 'period',
        }
      },
      { $unwind: { path: '$period', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'activities',
          localField: '_id.activityId',
          foreignField: '_id',
          as: 'activity',
        }
      },
      { $unwind: { path: '$activity', preserveNullAndEmptyArrays: true } },
      { $sort: { 'period.startTime': 1 } },
      {
        $project: {
          _id: 0,
          periodId: '$_id.periodId',
          periodName: { $ifNull: ['$period.name', ''] },
          startTime: { $ifNull: ['$period.startTime', ''] },
          endTime: { $ifNull: ['$period.endTime', ''] },
          activityId: '$_id.activityId',
          activityName: { $ifNull: ['$activity.name', ''] },
          studentCount: 1,
          students: 1,
        }
      },
    ]);

    const periodActivityPairs = schedules.map(s => ({
      periodId: s.periodId,
      activityId: s.activityId,
    }));

    const attendanceRecords = await SchoolAttendance.find({
      periodId: { $in: periodActivityPairs.map(p => p.periodId) },
      activityId: { $in: periodActivityPairs.map(p => p.activityId) },
      attendanceDate: date,
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
      const key = `${s.periodId.toString()}_${s.activityId.toString()}`;
      const counts = recordMap[key] || { present: 0, absent: 0 };
      return {
        periodId: s.periodId,
        periodName: s.periodName,
        startTime: s.startTime,
        endTime: s.endTime,
        activityId: s.activityId,
        activityName: s.activityName,
        day: dayName,
        totalStudents: s.studentCount,
        presentCount: counts.present,
        absentCount: counts.absent,
      };
    });

    res.json({ attendance: result });
  } catch (err) {
    console.error('getAttendance error:', err);
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

    result.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

    res.json({ students: result });
  } catch (err) {
    console.error('getAttendanceStudents error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentPeriods = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { admissionId, date } = req.query;

    if (!admissionId || !date) {
      return res.status(400).json({ message: 'admissionId and date query params required' });
    }

    const student = await SchoolAdmission.findOne({
      admissionId,
      organizationId,
      status: 'Active',
    }).lean();

    if (!student) {
      return res.status(404).json({ message: 'Student not found or inactive' });
    }

    const dayName = getDayNameFromDate(date);
    const dayField = dayName.toLowerCase() + 'ActivityId';

    const todayEntries = (student.timetable || []).filter(t => t[dayField] != null);

    if (todayEntries.length === 0) {
      return res.json({ periods: [] });
    }

    const periodIds = todayEntries.map(t => t.periodId);
    const activityIds = todayEntries.map(t => t[dayField]);

    const periods = await TimeTable.find({ _id: { $in: periodIds } }).select('name startTime endTime').lean();
    const activities = await Activity.find({ _id: { $in: activityIds } }).select('name').lean();

    const periodMap = {};
    for (const p of periods) periodMap[p._id.toString()] = p;
    const activityMap = {};
    for (const a of activities) activityMap[a._id.toString()] = a;

    const result = todayEntries
      .map(t => {
        const p = periodMap[t.periodId.toString()];
        const a = activityMap[t[dayField].toString()];
        if (!p || !a) return null;
        return {
          periodId: t.periodId,
          periodName: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          activityId: t[dayField],
          activityName: a.name,
        };
      })
      .filter(Boolean);

    res.json({ periods: result });
  } catch (err) {
    console.error('getStudentPeriods error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.scanMark = async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const { admissionId, periodId, activityId, date } = req.body;
    console.log("SCAN REQUEST", req.body);

    if (!admissionId || !periodId || !activityId || !date) {
      return res.status(400).json({ message: 'admissionId, periodId, activityId, and date are required' });
    }

    const dayName = getDayNameFromDate(date);

    const dayField = dayName.toLowerCase() + 'ActivityId';

    const student = await SchoolAdmission.findOne({
      admissionId,
      organizationId,
      status: 'Active',
    }).lean();
    console.log("STUDENT FOUND", {
      id: student?._id?.toString(),
      admissionId: student?.admissionId,
      fullName: student?.fullName
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found or inactive' });
    }

    const timetableEntry = (student.timetable || []).find(
      t => t.periodId.toString() === periodId && t[dayField] && t[dayField].toString() === activityId
    );

    if (!timetableEntry) {
      return res.status(400).json({ message: 'Student is not assigned to this period and activity' });
    }

    console.log("DUPLICATE QUERY", {
      studentId: student._id,
      periodId,
      activityId,
      attendanceDate: date,
      organizationId
    });
    const existing = await SchoolAttendance.findOne({
  studentId: student._id,
  periodId: new mongoose.Types.ObjectId(periodId),
  activityId: new mongoose.Types.ObjectId(activityId),
  attendanceDate: date,
  organizationId,
}).lean();
    console.log("EXISTING ATTENDANCE", existing);
    if (existing) {
      console.log(JSON.stringify(existing, null, 2));
    }

    if (existing) {
      console.log("ALREADY MARKED RESPONSE", {
        studentId: student._id?.toString(),
        admissionId: student.admissionId,
        fullName: student.fullName,
        existingStatus: existing.status,
        existingId: existing._id?.toString()
      });
      return res.json({
        success: true,
        alreadyMarked: true,
        message: 'Attendance already marked',
        student: { _id: student._id, admissionId: student.admissionId, fullName: student.fullName },
        status: existing.status,
      });
    }

    const user = await User.findById(req.user.id).lean();
    let markedBy = null;
    if (user) {
      const staff = await FitnessStaff.findOne({ mobileNumber: user.mobile }).lean();
      if (staff) markedBy = staff._id;
    }

    console.log("CREATING ATTENDANCE", {
      studentId: student._id?.toString(),
      admissionId: student.admissionId,
      periodId,
      activityId,
      attendanceDate: date,
      organizationId
    });

    try {
      const attendance = await SchoolAttendance.create({
        studentId: student._id,
        admissionId: student.admissionId,
        periodId: new mongoose.Types.ObjectId(periodId),
        activityId: new mongoose.Types.ObjectId(activityId),
        attendanceDate: date,
        day: dayName,
        status: 'Present',
        markedBy,
        organizationId,
      });

      console.log("ATTENDANCE CREATED", attendance._id?.toString());

      return res.json({
        success: true,
        alreadyMarked: false,
        message: 'Attendance marked successfully',
        student: { _id: student._id, admissionId: student.admissionId, fullName: student.fullName },
      });
    } catch (err) {
      console.error("ATTENDANCE CREATE ERROR", err);
      throw err;
    }
  } catch (err) {
    if (err.code === 11000) {
      console.log("DUPLICATE KEY 11000", {
        errorMessage: err.message,
        keyValue: err.keyValue
      });
      return res.json({ success: true, alreadyMarked: true, message: 'Attendance already marked' });
    }
    console.error('scanMark error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getEvents = eventController.getAllEvents;

exports.getEnquiries = schoolEnquiryController.getAllEnquiries;
exports.getEnquiryById = schoolEnquiryController.getEnquiryById;
exports.createEnquiry = schoolEnquiryController.createEnquiry;
exports.updateEnquiry = schoolEnquiryController.updateEnquiry;
exports.deleteEnquiry = schoolEnquiryController.deleteEnquiry;

exports.getFollowups = followupController.getAllFollowups;
exports.createFollowup = followupController.createFollowup;

exports.getAdmissions = schoolAdmissionController.getAllAdmissions;
exports.getAdmissionById = schoolAdmissionController.getAdmissionById;
exports.getAdmissionPayments = schoolAdmissionController.getAdmissionPayments;
exports.createAdmission = schoolAdmissionController.createAdmission;
exports.updateAdmission = schoolAdmissionController.updateAdmission;
exports.deleteAdmission = schoolAdmissionController.deleteAdmission;
exports.collectPayment = schoolAdmissionController.collectPayment;

exports.getStudents = studentController.getAllStudents;
exports.getStudentById = studentController.getStudentById;
exports.updateStudent = studentController.updateStudent;
exports.updateEmergencyContact = studentController.updateEmergencyContact;
exports.clearEmergencyContact = studentController.clearEmergencyContact;

exports.getServices = schoolServiceController.getServices;
exports.createService = schoolServiceController.createService;
exports.updateService = schoolServiceController.updateService;
exports.deleteService = schoolServiceController.deleteService;
exports.toggleServiceStatus = schoolServiceController.toggleStatus;

exports.getServiceBookings = schoolServiceBookingController.getBookings;
exports.createServiceBooking = schoolServiceBookingController.createBooking;
exports.cancelServiceBooking = schoolServiceBookingController.cancelBooking;
exports.getAvailableSeats = schoolServiceBookingController.getAvailableSeats;

exports.getFeeTypes = feeController.getFeeTypes;
exports.createFeeType = feeController.createFeeType;
exports.updateFeeType = feeController.updateFeeType;
exports.deleteFeeType = feeController.deleteFeeType;
exports.getAllotments = feeController.getAllotments;
exports.allotFee = feeController.allotFee;
exports.getPayments = feeController.getPayments;
exports.addPayment = feeController.addPayment;
exports.getFeeStats = feeController.getFeeStats;

exports.getHealthRecords = healthRecordController.getAllHealthRecords;
exports.getHealthRecordById = healthRecordController.getHealthRecordById;
exports.createHealthRecord = healthRecordController.createHealthRecord;
exports.updateHealthRecord = healthRecordController.updateHealthRecord;
exports.deleteHealthRecord = healthRecordController.deleteHealthRecord;

exports.getActivities = activityController.getAllActivities;

exports.getExpiring = renewalController.getExpiring;
exports.renew = renewalController.renew;

exports.getReports = schoolDashboardController.getSchoolDashboard;
