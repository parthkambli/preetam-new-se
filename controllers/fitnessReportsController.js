const FitnessEnquiry = require('../models/FitnessEnquiry');
const FitnessMember = require('../models/FitnessMember');
const FeePayment = require('../models/FitnessFeePayment');
const FeeAllotment = require('../models/FitnessFeeAllotment');

exports.getSummary = async (req, res) => {
  try {
    const orgId = req.organizationId;


    // 🔹 Total Enquiries
    const totalEnquiries = await FitnessEnquiry.countDocuments({
      organizationId: orgId
    });

    // 🔹 Total Admissions (Members)
    const totalAdmissions = await FitnessMember.countDocuments({
      organizationId: orgId
    });

    // 🔹 Active Participants
    const activeParticipants = await FitnessMember.countDocuments({
      organizationId: orgId,
      status: 'Active'
    });

    // 🔹 Total Revenue (sum of all payments)
    const revenueData = await FeePayment.aggregate([
      { $match: { organizationId: orgId } },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalRevenue = revenueData[0]?.total || 0;

    // 🔹 Pending Fees (Allotment - Paid)
    const pendingData = await FeeAllotment.aggregate([
      { $match: { organizationId: orgId } },
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
          pending: { $subtract: ['$amount', '$paid'] }
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

    res.json({
      totalEnquiries,
      totalAdmissions,
      activeParticipants,
      totalRevenue,
      pendingFees
    });

  } catch (err) {
    console.error("Summary error:", err);
    res.status(500).json({ message: "Failed to fetch summary" });
  }
};