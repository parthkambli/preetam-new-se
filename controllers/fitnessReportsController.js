
const FitnessEnquiry = require('../models/FitnessEnquiry');
const FitnessMember = require('../models/FitnessMember');
const FeePayment = require('../models/FitnessFeePayment');
const FeeAllotment = require('../models/FitnessFeeAllotment');
const { buildDateMatch } = require('../helpers/dateFilterHelper');
const FitnessAttendance = require('../models/FitnessAttendance');

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Normalize date → remove time completely
const normalizeDate = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// Inclusive day difference (REAL FIX)
const diffDaysInclusive = (start, end) => {
  return Math.floor((end - start) / MS_PER_DAY) + 1;
};

const getPlanDurationDays = (plan) => {

  switch ((plan || "").toLowerCase()) {

    case "daily":
      return 1;

    case "hourly":
      return 1;

    case "weekly":
      return 7;

    case "monthly":
      return 30;

    case "quarterly":
      return 90;

    case "halfyearly":
    case "half-yearly":
      return 180;

    case "annual":
      return 365;

    default:
      return null;
  }
};


const getProratedAmount = (finalAmount, plan, startDate, endDate, from, to) => {
  if (!finalAmount || finalAmount <= 0) return 0;

  // No filter → full revenue
  if (!from && !to) return finalAmount;

  const filterStart = from ? normalizeDate(from) : null;
  const filterEnd   = to   ? normalizeDate(to)   : null;

  const memberStart = normalizeDate(startDate);
  const memberEnd   = normalizeDate(endDate);

  // Daily / Hourly → revenue only if startDate inside range
  if (plan === 'Daily' || plan === 'Hourly') {
    const inRange =
      (!filterStart || memberStart >= filterStart) &&
      (!filterEnd   || memberStart <= filterEnd);

    return inRange ? finalAmount : 0;
  }

  // Calculate overlap
  const overlapStart = filterStart
    ? new Date(Math.max(memberStart, filterStart))
    : memberStart;

  const overlapEnd = filterEnd
    ? new Date(Math.min(memberEnd, filterEnd))
    : memberEnd;

  if (overlapStart > overlapEnd) return 0;

  const overlapDays = diffDaysInclusive(overlapStart, overlapEnd);

  // 🔥 FIX: Use FIXED PLAN DURATION (not date difference)
  const planDays = getPlanDurationDays(plan);

  if (!planDays) return 0;

  const prorated = (finalAmount / planDays) * overlapDays;

  return Math.round(prorated * 100) / 100;
};



exports.getSummary = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { fromDate, toDate } = req.query;

    // ─────────────────────────────────────────────────────────────
    // Helper: Build date filter (SAFE)
    // ─────────────────────────────────────────────────────────────
    const buildDateFilter = (field) => {
      if (!fromDate && !toDate) return {};

      const filter = {};

      if (fromDate) {
        filter.$gte = new Date(fromDate + "T00:00:00.000Z");
      }

      if (toDate) {
        filter.$lte = new Date(toDate + "T23:59:59.999Z");
      }

      return { [field]: filter };
    };

    // ─────────────────────────────────────────────────────────────
    // 1. Total Enquiries
    // ─────────────────────────────────────────────────────────────
    const totalEnquiries = await FitnessEnquiry.countDocuments({
      organizationId: orgId,
      ...buildDateFilter("createdAt"),
    });

    // ─────────────────────────────────────────────────────────────
    // 2. Total Admissions
    // ─────────────────────────────────────────────────────────────
    const totalAdmissions = await FitnessMember.countDocuments({
      organizationId: orgId,
      ...buildDateFilter("createdAt"),
    });

    // ─────────────────────────────────────────────────────────────
    // 3. Active Participants
    // ─────────────────────────────────────────────────────────────
    const activeParticipants = await FitnessMember.countDocuments({
      organizationId: orgId,
      membershipStatus: "Active",
      ...buildDateFilter("createdAt"),
    });

    // ─────────────────────────────────────────────────────────────
    // 4. TODAY'S ATTENDANCE (DYNAMIC FIX)
    // ─────────────────────────────────────────────────────────────

    let attendanceFilter = {
      organizationId: orgId,
      status: "Present",
    };

    if (fromDate || toDate) {
      // If user selects range → use that
      Object.assign(attendanceFilter, buildDateFilter("attendanceDate"));
    } else {
      // Default → TODAY
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      attendanceFilter.attendanceDate = {
        $gte: start,
        $lte: end,
      };
    }

    const todaysAttendance = await FitnessAttendance.countDocuments(attendanceFilter);

    // ─────────────────────────────────────────────────────────────
    // 5. TOTAL REVENUE
    // ─────────────────────────────────────────────────────────────
    
    let totalRevenue = 0;

// NO FILTER = ACTUAL COLLECTED REVENUE
if (!fromDate && !toDate) {

  const revenueAgg = await FeePayment.aggregate([
    {
      $match: {
        organizationId: orgId,
        description: {
          $not: /^Booking:/
        }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$amount"
        }
      }
    }
  ]);

  totalRevenue = revenueAgg[0]?.total || 0;

} else {

  // DATE FILTER = PRORATED REVENUE

  const allMembers = await FitnessMember.find(
    { organizationId: orgId },
    "activityFees historyFees"
  ).lean();

  for (const member of allMembers) {

    const allFees = [
      ...(member.activityFees || []),
      ...(member.historyFees || [])
    ];

    for (const af of allFees) {

      if (af.paymentStatus !== "Paid") continue;
      if (!af.startDate || !af.endDate) continue;

      totalRevenue += getProratedAmount(
        af.finalAmount || af.planFee || 0,
        af.plan,
        af.startDate,
        af.endDate,
        fromDate,
        toDate
      );
    }
  }
}

totalRevenue = Math.round(totalRevenue * 100) / 100;

    // ─────────────────────────────────────────────────────────────
    // 5B. BOOKING REVENUE
    // ─────────────────────────────────────────────────────────────
    const bookingPayments = await FeePayment.aggregate([
      {
        $match: {
          organizationId: orgId,
          description: { $regex: /^Booking:/ },
          ...buildDateFilter("paymentDate"),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const bookingRevenue = bookingPayments[0]?.total || 0;
    totalRevenue += bookingRevenue;

    // ─────────────────────────────────────────────────────────────
    // 6. PENDING FEES
    // ─────────────────────────────────────────────────────────────
    const pendingData = await FeeAllotment.aggregate([
      {
        $match: {
          organizationId: orgId,
          ...buildDateFilter("createdAt"),
        },
      },
      {
        $lookup: {
          from: "fitnessfeepayments",
          localField: "_id",
          foreignField: "allotmentId",
          as: "payments",
        },
      },
      {
        $addFields: {
          paid: { $sum: "$payments.amount" },
        },
      },
      {
        $addFields: {
          pending: {
            $max: [{ $subtract: ["$amount", "$paid"] }, 0],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: "$pending" },
        },
      },
    ]);

    const pendingFees = pendingData[0]?.totalPending || 0;

    // ─────────────────────────────────────────────────────────────
    // RESPONSE
    // ─────────────────────────────────────────────────────────────
    res.json({
      totalEnquiries,
      totalAdmissions,
      activeParticipants,
      todaysAttendance, // ✅ FIXED
      totalRevenue,
      pendingFees,
      appliedFilter: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    });

  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};


