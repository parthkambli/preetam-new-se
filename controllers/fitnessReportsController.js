// const FitnessEnquiry = require('../models/FitnessEnquiry');
// const FitnessMember = require('../models/FitnessMember');
// const FeePayment = require('../models/FitnessFeePayment');
// const FeeAllotment = require('../models/FitnessFeeAllotment');

// exports.getSummary = async (req, res) => {
//   try {
//     const orgId = req.organizationId;


//     // 🔹 Total Enquiries
//     const totalEnquiries = await FitnessEnquiry.countDocuments({
//       organizationId: orgId
//     });

//     // 🔹 Total Admissions (Members)
//     const totalAdmissions = await FitnessMember.countDocuments({
//       organizationId: orgId
//     });

//     // 🔹 Active Participants
//     const activeParticipants = await FitnessMember.countDocuments({
//       organizationId: orgId,
//       status: 'Active'
//     });

//     // 🔹 Total Revenue (sum of all payments)
//     const revenueData = await FeePayment.aggregate([
//       { $match: { organizationId: orgId } },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$amount' }
//         }
//       }
//     ]);

//     const totalRevenue = revenueData[0]?.total || 0;

//     // 🔹 Pending Fees (Allotment - Paid)
//     const pendingData = await FeeAllotment.aggregate([
//       { $match: { organizationId: orgId } },
//       {
//         $lookup: {
//           from: 'fitnessfeepayments',
//           localField: '_id',
//           foreignField: 'allotmentId',
//           as: 'payments'
//         }
//       },
//       {
//         $addFields: {
//           paid: { $sum: '$payments.amount' }
//         }
//       },
//       {
//         $addFields: {
//           pending: { $subtract: ['$amount', '$paid'] }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           totalPending: { $sum: '$pending' }
//         }
//       }
//     ]);

//     const pendingFees = pendingData[0]?.totalPending || 0;

//     res.json({
//       totalEnquiries,
//       totalAdmissions,
//       activeParticipants,
//       totalRevenue,
//       pendingFees
//     });

//   } catch (err) {
//     console.error("Summary error:", err);
//     res.status(500).json({ message: "Failed to fetch summary" });
//   }
// };






const FitnessEnquiry = require('../models/FitnessEnquiry');
const FitnessMember = require('../models/FitnessMember');
const FeePayment = require('../models/FitnessFeePayment');
const FeeAllotment = require('../models/FitnessFeeAllotment');
const { buildDateMatch } = require('../helpers/dateFilterHelper');

// ── Proration helper (inline) ──────────────────────────────────────────────
// Calculates how much of a membership's fee falls within the filter range.
// Weekly/Monthly/Annual → prorated by day overlap
// Daily/Hourly          → full amount if startDate falls within range
// No date filter        → full amount always


// const getProratedAmount = (finalAmount, plan, startDate, endDate, from, to) => {
//   if (!finalAmount || finalAmount <= 0) return 0;

//   // No filter → count everything
//   if (!from && !to) return finalAmount;

//   const filterStart = from
//     ? (() => { const d = new Date(from); d.setHours(0, 0, 0, 0); return d; })()
//     : null;
//   const filterEnd = to
//     ? (() => { const d = new Date(to); d.setHours(23, 59, 59, 999); return d; })()
//     : null;

//   // Daily / Hourly → count full amount only if startDate is within range
//   if (plan === 'Daily' || plan === 'Hourly') {
//     const s = new Date(startDate);
//     const inRange = (!filterStart || s >= filterStart) &&
//                     (!filterEnd   || s <= filterEnd);
//     return inRange ? finalAmount : 0;
//   }

//   // Weekly / Monthly / Annual → prorate by day overlap
//   const memberStart = new Date(startDate);
//   const memberEnd   = new Date(endDate);

//   const overlapStart = filterStart
//     ? new Date(Math.max(memberStart.getTime(), filterStart.getTime()))
//     : memberStart;
//   const overlapEnd = filterEnd
//     ? new Date(Math.min(memberEnd.getTime(), filterEnd.getTime()))
//     : memberEnd;

//   // No overlap
//   if (overlapStart > overlapEnd) return 0;

//   const totalDays   = (memberEnd - memberStart)     / (1000 * 60 * 60 * 24);
//   const overlapDays = (overlapEnd - overlapStart)   / (1000 * 60 * 60 * 24);

//   if (totalDays <= 0) return 0;

//   return Math.round((finalAmount / totalDays) * overlapDays * 100) / 100;
// };



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
  switch (plan) {
    case 'Weekly': return 7;
    case 'Monthly': return 30;
    case 'Annual': return 365;
    default: return null;
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

    // ── Extract optional date range from query params ──────────────────────
    // Frontend sends: GET /api/reports/summary?fromDate=2026-01-01&toDate=2026-01-31
    // If omitted, no date filter is applied (show everything till date).
    const { fromDate, toDate } = req.query;

    // ── 1. Total Enquiries ─────────────────────────────────────────────────
    // Filtered by enquiry creation date when a range is selected.
    const enquiryMatch = buildDateMatch(
      { organizationId: orgId },
      'createdAt',
      fromDate,
      toDate
    );
    const totalEnquiries = await FitnessEnquiry.countDocuments(enquiryMatch);

    // ── 2. Total Admissions (Members) ──────────────────────────────────────
    // Filtered by member join / creation date.
    const admissionMatch = buildDateMatch(
      { organizationId: orgId },
      'createdAt',
      fromDate,
      toDate
    );
    const totalAdmissions = await FitnessMember.countDocuments(admissionMatch);

    // ── 3. Active Participants ─────────────────────────────────────────────
    // Count members whose status is Active and who joined within the range.
    const activeMatch = buildDateMatch(
      { organizationId: orgId, status: 'Active' },
      'createdAt',
      fromDate,
      toDate
    );
    
    
const activeParticipants = await FitnessMember.countDocuments({
  organizationId: orgId,
  membershipStatus: "Active"
});


// ── 4. Total Revenue (Prorated) ────────────────────────────────────────
    // Source of truth: FitnessMember.activityFees
    // Only count fees where paymentStatus === 'Paid'
    // Prorate Weekly/Monthly/Annual by day overlap with filter range
    // Daily/Hourly count full amount if startDate falls in filter range
    const allMembers = await FitnessMember.find(
      { organizationId: orgId },
      'activityFees'
    ).lean();

    let totalRevenue = 0;
    for (const member of allMembers) {
      for (const af of member.activityFees || []) {
        // Only count paid activities
        if (af.paymentStatus !== 'Paid') continue;
        if (!af.startDate || !af.endDate)  continue;

        totalRevenue += getProratedAmount(
          af.finalAmount,
          af.plan,
          af.startDate,
          af.endDate,
          fromDate,
          toDate
        );
      }
    }
    totalRevenue = Math.round(totalRevenue * 100) / 100;

    // ── 5. Pending Fees ────────────────────────────────────────────────────
    // Allotment amount minus sum of payments already made.
    // When a date range is selected, only allotments created in that range
    // are considered; payments are still summed in full so the pending
    // balance for that cohort is accurate.
    const allotmentMatch = buildDateMatch(
      { organizationId: orgId },
      'createdAt',
      fromDate,
      toDate
    );
    const pendingData = await FeeAllotment.aggregate([
      { $match: allotmentMatch },
      {
        $lookup: {
          from: 'fitnessfeepayments',
          localField: '_id',
          foreignField: 'allotmentId',
          as: 'payments'
        }
      },
      {
        $addFields: {
          paid: { $sum: '$payments.amount' }
        }
      },
      {
        $addFields: {
          pending: {
            $max: [{ $subtract: ['$amount', '$paid'] }, 0] // floor at 0
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPending: { $sum: '$pending' }
        }
      }
    ]);
    const pendingFees = pendingData[0]?.totalPending || 0;

    // ── Response ───────────────────────────────────────────────────────────
    res.json({
      totalEnquiries,
      totalAdmissions,
      activeParticipants,
      totalRevenue,
      pendingFees,
      // echo back so the frontend can confirm what range was applied
      appliedFilter: {
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
    });

  } catch (err) {
    console.error('Summary error:', err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
};