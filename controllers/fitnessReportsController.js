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
    const activeParticipants = await FitnessMember.countDocuments(activeMatch);

    // ── 4. Total Revenue ───────────────────────────────────────────────────
    // Sum of payment amounts on a daily basis within the selected range.
    // paidAt (or createdAt if paidAt is absent) is used as the date field.
    // If no date selected → sum of ALL payments till date.
    const revenueMatch = buildDateMatch(
      { organizationId: orgId },
      'paidAt',       // use the actual payment date, not record creation date
      fromDate,
      toDate
    );
    const revenueData = await FeePayment.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

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