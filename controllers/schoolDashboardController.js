const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Event = require('../models/Event');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const ScheduledActivity = require('../models/ScheduledActivity');
const SchoolAttendance = require('../models/SchoolAttendance');
const StaffAttendance = require('../models/Staffattendance');
const FeeAllotment = require('../models/FeeAllotment');
const FeePayment = require('../models/FeePayment');

exports.getSchoolDashboard = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];

    const [
      totalParticipants,
      totalStaffCount,
      upcomingEvents,
      todayEnquiries,
      schedules,
      presentParticipantsAgg,
      staffPresentAgg,
      feeAllotAgg,
      feePaymentAgg,
      activityAttendanceAgg,
    ] = await Promise.all([
      Student.countDocuments({ organizationId: orgId }),

      Staff.countDocuments({ organizationId: orgId }),

      Event.countDocuments({ organizationId: orgId, date: { $gte: today } }),

      SchoolEnquiry.countDocuments({
        organizationId: orgId,
        createdAt: { $gte: today, $lt: tomorrow },
      }),

      ScheduledActivity.find({
        organizationId: orgId,
        date: { $gte: today, $lt: tomorrow },
      }).populate('activity').lean(),

      // Distinct students with Present status today
      SchoolAttendance.distinct('studentId', {
        organizationId: orgId,
        attendanceDate: todayStr,
        status: 'Present',
      }),

      // Staff present today
      StaffAttendance.countDocuments({
        organizationId: orgId,
        date: { $gte: today, $lt: tomorrow },
        status: 'Present',
      }),

      // Total fee amount from all FeeAllotments
      FeeAllotment.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Total fee collected from all FeePayments
      FeePayment.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Per-activity attendance today
      SchoolAttendance.aggregate([
        { $match: { organizationId: orgId, attendanceDate: todayStr } },
        {
          $group: {
            _id: '$activityId',
            present: {
              $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] },
            },
            absent: {
              $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'activities',
            localField: '_id',
            foreignField: '_id',
            as: 'activity',
          },
        },
        { $unwind: { path: '$activity', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            activityId: '$_id',
            activityName: { $ifNull: ['$activity.activityName', '$activity.name', 'Unknown'] },
            present: 1,
            absent: 1,
            total: { $add: ['$present', '$absent'] },
          },
        },
        { $sort: { present: -1 } },
      ]),
    ]);

    const participantsPresentToday = presentParticipantsAgg.length;
    const totalActiveParticipants = await Student.countDocuments({
      organizationId: orgId,
      status: 'Active',
    });
    const totalCheckinsToday = activityAttendanceAgg.reduce(
      (sum, a) => sum + a.present,
      0
    );

    const mostActive = activityAttendanceAgg[0] || null;

    const totalFeeAmount = feeAllotAgg[0]?.total || 0;
    const totalFeeCollected = feePaymentAgg[0]?.total || 0;

    res.status(200).json({
      totalParticipants,
      totalStaff: totalStaffCount,
      upcomingEvents,
      totalCheckinsToday,
      mostActiveProgram: mostActive
        ? { name: mostActive.activityName, count: mostActive.present }
        : { name: 'N/A', count: 0 },
      todayTotalEnquiries: todayEnquiries,
      participantsPresentToday,
      totalActiveParticipants,
      staffPresentToday: staffPresentAgg,
      totalStaffCount,
      totalFeeAmount,
      totalFeeCollected,
      todaysActivityAttendance: activityAttendanceAgg,
      todaysScheduleActives: schedules,
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({
      message: err.message || 'Failed to fetch school dashboard data',
    });
  }
};
