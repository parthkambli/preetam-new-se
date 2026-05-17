const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { allowPermissions } = require("../middleware/permissions");


const {
  getMemberDashboard,
  getMemberProfile,
  getMemberMembershipSummary,
  getAvailableActivities,
  createMemberBooking,
  getMemberBookings,
  getMemberPayments,
  getActivityFeePlans,
  createMembershipOrder,
  verifyMembershipPayment,
  createRenewalOrder,
  verifyRenewalPayment,
  getMemberMemberships,
  getMemberAttendance,
  createMembershipPassOrder,
  verifyMembershipPassPayment
} = require("../controllers/fitnessMemberPanelController");

// ===============================
// MEMBER DASHBOARD
// ===============================
router.get(
  "/dashboard",
  auth,
  allowPermissions("VIEW_OWN_PROFILE"),
  getMemberDashboard
);


// ===============================
// MEMBER PROFILE
// ===============================
router.get(
  "/profile",
  auth,
  allowPermissions("VIEW_OWN_PROFILE"),
  getMemberProfile
);


// ===============================
// MEMBERSHIP SUMMARY
// ===============================
router.get(
  "/membership",
  auth,
  allowPermissions("VIEW_MEMBERSHIP"),
  getMemberMembershipSummary
);


//===============================
// Available activities
// ===============================

router.get(
  "/available-activities",
  auth,
  allowPermissions("VIEW_ACTIVITIES"),
  getAvailableActivities
);


//===============================
// Booking activities
// ===============================

router.post(
  "/book-slot",
  auth,
  allowPermissions("BOOK_ACTIVITY"),
  createMemberBooking
);

//===============================
// Booking History
// ===============================
router.get(
  "/bookings",
  auth,
  allowPermissions("VIEW_BOOKINGS"),
  getMemberBookings
);


//===============================
// Payment  History
// ===============================

router.get(
  "/payments",
  auth,
  allowPermissions("VIEW_PAYMENTS"),
  getMemberPayments
);

//===============================
// Activity fees
// ===============================

router.get(
  "/activity-fees/:activityId",
  auth,
  allowPermissions("VIEW_ACTIVITIES"),
  getActivityFeePlans
);


//===============================
// Razorpay membership purchase order
// ===============================

router.post(
  "/create-membership-order",
  auth,
  allowPermissions("BOOK_ACTIVITY"),
  createMembershipOrder
);

//===============================
// Razorpay  payment verification
// ===============================

router.post(
  "/verify-membership-payment",
  auth,
  allowPermissions("BOOK_ACTIVITY"),
  verifyMembershipPayment
);

//===============================
// Renewal order
// ===============================

router.post(
  "/create-renewal-order",
  auth,
  allowPermissions("VIEW_MEMBERSHIP"),
  createRenewalOrder
);


//===============================
// Verify Renewal order
// ===============================

router.post(
  "/verify-renewal-payment",
  auth,
  allowPermissions("VIEW_MEMBERSHIP"),
  verifyRenewalPayment
);


//===============================
// Membership status
// ===============================


router.get(
  "/memberships",
  auth,
  allowPermissions("VIEW_MEMBERSHIP"),
  getMemberMemberships
);



//===============================
// Member Profile routes
// ===============================

router.get(
  "/profile",
  auth,
  allowPermissions("VIEW_OWN_PROFILE"),
  getMemberProfile
);
module.exports = router;

//===============================
// Member Attendence routes
// ===============================

router.get(
  "/attendance",
  auth,
  allowPermissions("VIEW_OWN_PROFILE"),
  getMemberAttendance
);


router.post(
  "/create-membership-pass-order",
  auth,
  allowPermissions("BOOK_ACTIVITY"),
  createMembershipPassOrder
);

router.post(
  "/verify-membership-pass-payment",
  auth,
  allowPermissions("BOOK_ACTIVITY"),
  verifyMembershipPassPayment
);