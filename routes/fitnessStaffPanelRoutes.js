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
  allowPermissions('MARK_ATTENDANCE'),
  getAttendanceByDate
);

router.get(
  "/profile",
  auth,
  allowPermissions('VIEW_OWN_SCHEDULE'),
  getStaffProfile
);

router.get(
  "/events",
  auth,
  allowPermissions('VIEW_EVENTS'),
  getStaffEvents
);

module.exports = router;