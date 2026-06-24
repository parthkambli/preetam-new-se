const SchoolAdmission = require('../models/SchoolAdmission');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const FeePayment = require('../models/FeePayment');
const FeeAllotment = require('../models/FeeAllotment');
const SchoolAttendance = require('../models/SchoolAttendance');

const buildDateFilter = (field, fromDate, toDate) => {
  if (!fromDate && !toDate) return {};
  const filter = {};
  if (fromDate) filter.$gte = new Date(fromDate + "T00:00:00.000Z");
  if (toDate) filter.$lte = new Date(toDate + "T23:59:59.999Z");
  return { [field]: filter };
};

exports.getDashboard = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { fromDate, toDate } = req.query;

    const [totalEnquiries, totalAdmissions, activeParticipants, revenueAgg, pendingData] =
      await Promise.all([
        SchoolEnquiry.countDocuments({
          organizationId: orgId,
          ...buildDateFilter('date', fromDate, toDate),
        }),

        SchoolAdmission.countDocuments({
          organizationId: orgId,
          ...buildDateFilter('createdAt', fromDate, toDate),
        }),

        SchoolAdmission.countDocuments({
          organizationId: orgId,
          status: 'Active',
          ...buildDateFilter('createdAt', fromDate, toDate),
        }),

        FeePayment.aggregate([
          {
            $match: {
              organizationId: orgId,
              ...buildDateFilter('paymentDate', fromDate, toDate),
            },
          },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),

        FeeAllotment.aggregate([
          {
            $match: {
              organizationId: orgId,
              ...buildDateFilter('createdAt', fromDate, toDate),
            },
          },
          {
            $lookup: {
              from: 'feepayments',
              localField: '_id',
              foreignField: 'allotmentId',
              as: 'payments',
            },
          },
          {
            $addFields: {
              paid: { $sum: '$payments.amount' },
            },
          },
          {
            $addFields: {
              pending: {
                $max: [{ $subtract: ['$amount', '$paid'] }, 0],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalPending: { $sum: '$pending' },
            },
          },
        ]),
      ]);

    const totalRevenue = revenueAgg[0]?.total || 0;
    const pendingFees = pendingData[0]?.totalPending || 0;

    let todaysAttendance = 0;
    const attendanceMatch = { organizationId: orgId, status: 'Present' };

    if (fromDate || toDate) {
      const attFilter = {};
      if (fromDate) attFilter.$gte = fromDate;
      if (toDate) attFilter.$lte = toDate;
      attendanceMatch.attendanceDate = attFilter;
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      attendanceMatch.attendanceDate = `${y}-${m}-${d}`;
    }

    todaysAttendance = await SchoolAttendance.countDocuments(attendanceMatch);

    res.json({
      totalEnquiries,
      totalAdmissions,
      activeParticipants,
      totalRevenue,
      pendingFees,
      todaysAttendance,
      appliedFilter: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard summary' });
  }
};
