const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { allowPermissions } = require("../middleware/permissions");

const {
  getMemberDashboard,
  getMemberProfile,
  getMemberMembershipSummary
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

module.exports = router;