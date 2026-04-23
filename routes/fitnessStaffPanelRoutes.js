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

router.get("/my-schedule", auth, getMySchedule);
router.get("/available-activities", auth, getAvailableActivities);

router.get('/attendance-by-date', auth, getAttendanceByDate );

router.get("/profile", auth, getStaffProfile);

router.get("/events", auth, getStaffEvents);

module.exports = router;