// // controllers/fitnessAttendanceController.js
// const FitnessMember = require('../models/FitnessMember');
// const FitnessAttendance = require('../models/FitnessAttendance');
// const mongoose = require('mongoose');

// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// const getTodayStart = () => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   return today;
// };

// // 1. Validate QR Code - Called by Staff Android App after scanning
// exports.validateMemberQR = async (req, res) => {
//   try {
//     const { memberId } = req.params;
//     const { organizationId } = req.query;

//     if (!memberId || !organizationId) {
//       return res.status(400).json({ error: 'memberId and organizationId are required' });
//     }

//     const member = await FitnessMember.findOne({ 
//       memberId, 
//       organizationId 
//     }).populate('activityFees.activity', 'name activityName');

//     if (!member) return res.status(404).json({ error: 'Member not found' });

//     const activeActivities = member.activityFees
//       .filter(af => af.membershipStatus === 'Active')
//       .map(af => ({
//         activityFeeId: af._id,
//         activityId: af.activity?._id,
//         activityName: af.activity?.name || af.activity?.activityName,
//         plan: af.plan,
//         endDate: af.endDate
//       }));

//     res.json({
//       valid: true,
//       member: {
//         _id: member._id,
//         memberId: member.memberId,
//         name: member.name,
//         photo: member.photo,
//         mobile: member.mobile
//       },
//       activeActivities
//     });
//   } catch (err) {
//     console.error('validateMemberQR error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // 2. Mark Attendance - Called by Staff App
// // controllers/fitnessAttendanceController.js
// exports.markAttendance = async (req, res) => {
//   try {
//     const { memberId, activityFeeId, activityId, status = 'Present', notes } = req.body;
    
//     const organizationId = req.organizationId;
//     const markedBy = req.admin?._id || req.admin?.id;   // Try both possible structures

//     // === DEBUG (Keep temporarily) ===
//     console.log("=== Mark Attendance Debug ===");
//     console.log("organizationId from middleware:", organizationId);
//     console.log("req.admin:", req.admin);
//     console.log("markedBy:", markedBy);
//     console.log("Body:", req.body);
//     // ================================

//     if (!memberId || !activityFeeId || !activityId || !organizationId || !markedBy) {
//       return res.status(400).json({ 
//         error: 'Missing required fields',
//         debug: {
//           hasMemberId: !!memberId,
//           hasActivityFeeId: !!activityFeeId,
//           hasActivityId: !!activityId,
//           hasOrgId: !!organizationId,
//           hasMarkedBy: !!markedBy,
//           adminStructure: req.admin ? Object.keys(req.admin) : null
//         }
//       });
//     }

//     const member = await FitnessMember.findOne({ memberId, organizationId });
//     if (!member) return res.status(404).json({ error: 'Member not found' });

//     const activityFee = member.activityFees.id(activityFeeId);
//     if (!activityFee || activityFee.membershipStatus !== 'Active') {
//       return res.status(400).json({ error: 'This activity is not active for the member today' });
//     }

//     const today = getTodayStart();

//     const attendance = await FitnessAttendance.findOneAndUpdate(
//       { member: member._id, activity: activityId, activityFeeId, attendanceDate: today },
//       { 
//         member: member._id, 
//         activity: activityId, 
//         activityFeeId, 
//         attendanceDate: today, 
//         markedBy, 
//         status, 
//         notes: notes || '', 
//         organizationId 
//       },
//       { upsert: true, new: true, runValidators: true }
//     );

//     res.json({ success: true, attendance, message: `Marked as ${status}` });

//   } catch (err) {
//     if (err.code === 11000) return res.status(409).json({ error: 'Attendance already marked for today' });
//     console.error('markAttendance error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // 3. Attendance Summary (for your Web Admin Table)
// exports.getAttendanceSummary = async (req, res) => {
//   try {
//     const { fromDate, toDate, activity } = req.query;
//     const organizationId = req.organizationId;

//     const match = { organizationId };

//     if (fromDate || toDate) {
//       match.attendanceDate = {};
//       if (fromDate) match.attendanceDate.$gte = new Date(fromDate);
//       if (toDate) match.attendanceDate.$lte = new Date(toDate);
//     }
//     if (activity) match.activity = mongoose.Types.ObjectId(activity);

//     const summary = await FitnessAttendance.aggregate([
//       { $match: match },
//       {
//         $group: {
//           _id: { activity: "$activity", attendanceDate: "$attendanceDate" },
//           total: { $sum: 1 },
//           present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
//           absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } }
//         }
//       },
//       { $sort: { "_id.attendanceDate": -1 } },
//       {
//         $lookup: {
//           from: 'fitnessactivities',
//           localField: '_id.activity',
//           foreignField: '_id',
//           as: 'activityInfo'
//         }
//       },
//       { $unwind: '$activityInfo' },
//       {
//         $project: {
//           activity: '$activityInfo.name',
//           date: '$_id.attendanceDate',
//           total: 1,
//           present: 1,
//           absent: 1,
//           activityId: '$_id.activity'
//         }
//       }
//     ]);

//     res.json(summary);
//   } catch (err) {
//     console.error('getAttendanceSummary error:', err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// // 4. Get Detailed Student Attendance
// exports.getStudentAttendance = async (req, res) => {
//   try {
//     const { activityId, date } = req.params;
//     const organizationId = req.organizationId;

//     const records = await FitnessAttendance.find({
//       activity: activityId,
//       attendanceDate: new Date(date).setHours(0, 0, 0, 0),
//       organizationId
//     })
//     .populate('member', 'name memberId photo')
//     .populate('markedBy', 'fullName name')
//     .sort({ createdAt: -1 });

//     res.json(records);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

















///////////////////



// controllers/fitnessAttendanceController.js
const FitnessMember = require('../models/FitnessMember');
const FitnessAttendance = require('../models/FitnessAttendance');
const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getValidatedPageAndLimit = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  let limit = parseInt(query.limit, 10) || 10;
  if (limit < 5) limit = 5;
  if (limit > 100) limit = 100;

  return { page, limit };
};

// 1. Validate QR Code - Called by Staff Android App after scanning
exports.validateMemberQR = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { organizationId } = req.query;

    if (!memberId || !organizationId) {
      return res.status(400).json({ error: 'memberId and organizationId are required' });
    }

    const member = await FitnessMember.findOne({
      memberId,
      organizationId
    }).populate('activityFees.activity', 'name activityName');

    if (!member) return res.status(404).json({ error: 'Member not found' });

    const activeActivities = member.activityFees
      .filter(af => af.membershipStatus === 'Active')
      .map(af => ({
        activityFeeId: af._id,
        activityId: af.activity?._id,
        activityName: af.activity?.name || af.activity?.activityName,
        plan: af.plan,
        endDate: af.endDate
      }));

    res.json({
      valid: true,
      member: {
        _id: member._id,
        memberId: member.memberId,
        name: member.name,
        photo: member.photo,
        mobile: member.mobile
      },
      activeActivities
    });
  } catch (err) {
    console.error('validateMemberQR error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 2. Mark Attendance - Called by Staff App
exports.markAttendance = async (req, res) => {
  try {
    const { memberId, activityFeeId, activityId, status = 'Present', notes } = req.body;

    const organizationId = req.organizationId;
    const markedBy = req.admin?._id || req.admin?.id;

    console.log("=== Mark Attendance Debug ===");
    console.log("organizationId from middleware:", organizationId);
    console.log("req.admin:", req.admin);
    console.log("markedBy:", markedBy);
    console.log("Body:", req.body);

    if (!memberId || !activityFeeId || !activityId || !organizationId || !markedBy) {
      return res.status(400).json({
        error: 'Missing required fields',
        debug: {
          hasMemberId: !!memberId,
          hasActivityFeeId: !!activityFeeId,
          hasActivityId: !!activityId,
          hasOrgId: !!organizationId,
          hasMarkedBy: !!markedBy,
          adminStructure: req.admin ? Object.keys(req.admin) : null
        }
      });
    }

    const member = await FitnessMember.findOne({ memberId, organizationId });
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const activityFee = member.activityFees.id(activityFeeId);
    if (!activityFee || activityFee.membershipStatus !== 'Active') {
      return res.status(400).json({ error: 'This activity is not active for the member today' });
    }

    const today = getTodayStart();

    const attendance = await FitnessAttendance.findOneAndUpdate(
      { member: member._id, activity: activityId, activityFeeId, attendanceDate: today, organizationId },
      {
        member: member._id,
        activity: activityId,
        activityFeeId,
        attendanceDate: today,
        markedBy,
        status,
        notes: notes || '',
        organizationId
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, attendance, message: `Marked as ${status}` });

  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Attendance already marked for today' });
    console.error('markAttendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Attendance Summary (for your Web Admin Table) - PAGINATION ADDED
exports.getAttendanceSummary = async (req, res) => {
  try {
    const { fromDate, toDate, activity } = req.query;
    const organizationId = req.organizationId;
    const { page, limit } = getValidatedPageAndLimit(req.query);
    const skip = (page - 1) * limit;

    const match = { organizationId };

    if (fromDate || toDate) {
      match.attendanceDate = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        match.attendanceDate.$gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        match.attendanceDate.$lte = end;
      }
    }

    if (activity && isValidObjectId(activity)) {
      match.activity = new mongoose.Types.ObjectId(activity);
    }

    const countPipeline = [
      { $match: match },
      {
        $group: {
          _id: { activity: "$activity", attendanceDate: "$attendanceDate" }
        }
      },
      { $count: "total" }
    ];

    const summaryPipeline = [
      { $match: match },
      {
        $group: {
          _id: { activity: "$activity", attendanceDate: "$attendanceDate" },
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } }
        }
      },
      { $sort: { "_id.attendanceDate": -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'fitnessactivities',
          localField: '_id.activity',
          foreignField: '_id',
          as: 'activityInfo'
        }
      },
      {
        $unwind: {
          path: '$activityInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          activity: { $ifNull: ['$activityInfo.name', 'Unknown Activity'] },
          date: '$_id.attendanceDate',
          total: 1,
          present: 1,
          absent: 1,
          activityId: '$_id.activity'
        }
      }
    ];

    const [countResult, summary] = await Promise.all([
      FitnessAttendance.aggregate(countPipeline),
      FitnessAttendance.aggregate(summaryPipeline)
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      count: summary.length,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data: summary
    });
  } catch (err) {
    console.error('getAttendanceSummary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Get Detailed Student Attendance - PAGINATION ADDED
exports.getStudentAttendance = async (req, res) => {
  try {
    const { activityId, date } = req.params;
    const { fromDate, toDate } = req.query;
    const organizationId = req.organizationId;
    const { page, limit } = getValidatedPageAndLimit(req.query);
    const skip = (page - 1) * limit;

    const query = {
      activity: activityId,
      organizationId
    };

  // ✅ exact date OR date range
if (date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  query.attendanceDate = { $gte: start, $lte: end };
}
else if (fromDate || toDate) {
  query.attendanceDate = {};

  if (fromDate) {
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    query.attendanceDate.$gte = start;
  }

  if (toDate) {
    const end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
    query.attendanceDate.$lte = end;
  }
}

    const [records, total] = await Promise.all([
      FitnessAttendance.find(query)
        .populate('member', 'name memberId photo')
        .populate('markedBy', 'fullName name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      FitnessAttendance.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      count: records.length,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data: records
    });
  } catch (err) {
    console.error('getStudentAttendance error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};