const Student = require('../models/Student');
const Staff = require('../models/Staff');
const Event = require('../models/Event');
const Activity = require('../models/Activity');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const ScheduledActivity = require('../models/ScheduledActivity');

exports.getSchoolDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const totalParticipants = await Student.countDocuments();
    const totalStaff = await Staff.countDocuments();

    const upcomingEvents = await Event.countDocuments({
      date: { $gte: today }
    });

    const totalActivityCheckins = await Activity.countDocuments();

    const mostActiveProgramData = await Activity.aggregate([
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const mostActiveProgram =
      mostActiveProgramData.length > 0
        ? {
            name: mostActiveProgramData[0]._id,
            count: mostActiveProgramData[0].count
          }
        : {
            name: 'N/A',
            count: 0
          };

    const todayTotalEnquiries = await SchoolEnquiry.countDocuments({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    });

    const todaysScheduleActives = await ScheduledActivity.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('activity');

    res.status(200).json({
      totalParticipants,
      totalStaff,
      upcomingEvents,
      totalActivityCheckins,
      mostActiveProgram,
      todayTotalEnquiries,
      todaysScheduleActives
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || 'Failed to fetch school dashboard data'
    });
  }
};