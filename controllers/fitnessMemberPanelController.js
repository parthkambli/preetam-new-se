const FitnessMember = require("../models/FitnessMember");
const FitnessBooking = require("../models/FitnessBooking");
const FitnessFeePayment = require("../models/FitnessFeePayment");
const FitnessActivity = require("../models/FitnessActivity");


// ============================================
// MEMBER DASHBOARD
// GET /api/fitness/member-panel/dashboard
// ============================================
exports.getMemberDashboard = async (req, res) => {
  try {
    const memberId = req.user.id;
    const organizationId = req.organizationId;

    const member = await FitnessMember.findById(memberId)
      .populate("activityFees.activity")
      .populate("membershipPass")
      .lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    // Active memberships only
    const activeMemberships = (member.activityFees || []).filter(
      item => item.membershipStatus === "Active"
    );

    // Upcoming bookings
    const bookings = await FitnessBooking.find({
      memberId: member._id
    })
      .populate("activityId")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Recent payments
    const recentPayments = await FitnessFeePayment.find({
      memberId: member._id,
      organizationId
    })
      .sort({ paymentDate: -1 })
      .limit(5)
      .lean();

    // Pending dues calculation
    let pendingDues = 0;

    for (const item of member.activityFees || []) {
      if (item.paymentStatus === "Pending") {
        pendingDues += Number(item.finalAmount || 0);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Dashboard fetched successfully",
      data: {
        member: {
          id: member._id,
          memberId: member.memberId,
          name: member.name,
          mobile: member.mobile,
          email: member.email || "",
          photo: member.photo || "",
          membershipStatus: member.membershipStatus
        },

        membershipSummary: {
          totalActiveMemberships: activeMemberships.length,
          pendingDues,
          isPassMember: !!member.membershipPass,
          numberOfPersons: member.numberOfPersons || 1
        },

        activeMemberships: activeMemberships.map(item => ({
          activityName: item.activity?.name || "Membership Pass",
          plan: item.plan,
          startDate: item.startDate,
          endDate: item.endDate,
          finalAmount: item.finalAmount,
          paymentStatus: item.paymentStatus,
          membershipStatus: item.membershipStatus
        })),

        recentBookings: bookings.map(item => ({
          bookingId: item._id,
          activityName: item.activityId?.name || "N/A",
          bookingDate: item.date,
          customerName: item.customerName,
          phone: item.phone
        })),

        recentPayments: recentPayments.map(item => ({
          paymentId: item._id,
          amount: item.amount,
          paymentMode: item.paymentMode,
          paymentDate: item.paymentDate,
          description: item.description || "",
          source: "Razorpay Booking Payment"
        }))
      }
    });

  } catch (error) {
    console.error("getMemberDashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard"
    });
  }
};


// ============================================
// MEMBER PROFILE
// GET /api/fitness/member-panel/profile
// ============================================
exports.getMemberProfile = async (req, res) => {
  try {
    const member = await FitnessMember.findById(req.user.id)
      .select("-password")
      .lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: member
    });

  } catch (error) {
    console.error("getMemberProfile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    });
  }
};


// ============================================
// MEMBERSHIP SUMMARY
// GET /api/fitness/member-panel/membership
// ============================================
exports.getMemberMembershipSummary = async (req, res) => {
  try {
    const member = await FitnessMember.findById(req.user.id)
      .populate("activityFees.activity")
      .populate("membershipPass")
      .lean();

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Membership summary fetched successfully",
      data: {
        isPassMember: !!member.membershipPass,
        numberOfPersons: member.numberOfPersons || 1,
        membershipStatus: member.membershipStatus,
        memberships: member.activityFees || []
      }
    });

  } catch (error) {
    console.error("getMemberMembershipSummary error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch membership summary"
    });
  }
};