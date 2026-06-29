const SchoolAdmission = require('../models/SchoolAdmission');
const SchoolEnquiry = require('../models/SchoolEnquiry');
const FeePayment = require('../models/FeePayment');
const FeeAllotment = require('../models/FeeAllotment');
const SchoolAttendance = require('../models/SchoolAttendance');
const RevenueSchedule = require('../models/RevenueSchedule');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const normalizeDate = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const diffDaysInclusive = (start, end) => {
  return Math.floor((end - start) / MS_PER_DAY) + 1;
};

const prorateRevenue = (amount, startDate, endDate, from, to) => {
  if (!amount || amount <= 0 || !startDate || !endDate) return 0;

  const s = normalizeDate(startDate);
  const e = normalizeDate(endDate);
  const totalDays = diffDaysInclusive(s, e);
  if (totalDays <= 0) return 0;

  if (!from && !to) return amount;

  const fStart = from ? normalizeDate(from) : null;
  const fEnd = to ? normalizeDate(to) : null;

  const overlapStart = fStart ? new Date(Math.max(s.getTime(), fStart.getTime())) : s;
  const overlapEnd = fEnd ? new Date(Math.min(e.getTime(), fEnd.getTime())) : e;

  if (overlapStart > overlapEnd) return 0;

  const overlapDays = diffDaysInclusive(overlapStart, overlapEnd);
  return Math.round((amount / totalDays) * overlapDays * 100) / 100;
};

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

    const [totalEnquiries, totalAdmissions, activeParticipants, pendingData] =
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

    const pendingFees = pendingData[0]?.totalPending || 0;

    // ── Revenue: from RevenueSchedule (append-only contract records) ──
    let totalRevenue = 0;
    try {
      const match = { organizationId: orgId, status: { $ne: 'Cancelled' } };
      if (fromDate || toDate) {
        if (fromDate) {
          match.endDate = { $gte: new Date(fromDate + "T00:00:00.000Z") };
        }
        if (toDate) {
          match.startDate = { $lte: new Date(toDate + "T23:59:59.999Z") };
        }
      }

      const schedules = await RevenueSchedule.find(match).lean();

      for (const s of schedules) {
        totalRevenue += prorateRevenue(s.netAmount, s.startDate, s.endDate, fromDate, toDate);
      }
      totalRevenue = Math.round(totalRevenue * 100) / 100;
    } catch (revErr) {
      console.error('Revenue calculation error:', revErr.message);
    }

    // ── Attendance ──
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
