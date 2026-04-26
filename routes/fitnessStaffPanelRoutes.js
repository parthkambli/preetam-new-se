// const express = require('express');
// const router = express.Router();

// const {
//   getMySchedule,
//   getAvailableActivities
// } = require('../controllers/fitnessStaffPanelController');

// const auth = require('../middleware/auth');

// router.get('/my-schedule', auth, getMySchedule);
// router.get('/available-activities', auth, getAvailableActivities);

// module.exports = router;



const express = require("express");
const router = express.Router();

const {
  getMySchedule,
  getAvailableActivities,
  getAttendanceByDate,
  getStaffProfile,
  getStaffEvents,
  handleQRScan,
  getAllMembersForStaff,
  getAllStaffForStaff
} = require("../controllers/fitnessStaffPanelController");

const auth = require("../middleware/auth");
const { allowPermissions } = require("../middleware/permissions");

router.get(
  "/my-schedule",
  auth,
  allowPermissions('VIEW_OWN_SCHEDULE'),
  getMySchedule
);

router.get(
  "/available-activities",
  auth,
  allowPermissions('VIEW_ACTIVITIES'),
  getAvailableActivities
);

router.get(
  "/attendance-by-date",
  auth,
  allowPermissions('VIEW_ATTENDANCE'),
  getAttendanceByDate
);

router.get(
  "/members",
  auth,
  allowPermissions("VIEW_PARTICIPANTS"),
  getAllMembersForStaff
);

router.get(
  "/staff",
  auth,
  allowPermissions("VIEW_STAFF"),
  getAllStaffForStaff
);

router.get(
  "/profile",
  auth,
  // allowPermissions('VIEW_OWN_SCHEDULE'),
  getStaffProfile
);

router.get(
  "/events",
  auth,
  allowPermissions('VIEW_EVENTS'),
  getStaffEvents
);

router.post(
  '/scan-qr',
   auth,
   allowPermissions('MARK_ATTENDANCE'),
   handleQRScan);

module.exports = router;