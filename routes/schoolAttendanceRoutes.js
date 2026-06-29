const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAttendanceSummary,
  getAttendanceStudents,
  getActivityList,
} = require('../controllers/schoolAdminAttendanceController');

router.get('/summary', auth, getAttendanceSummary);
router.get('/students', auth, getAttendanceStudents);
router.get('/activities', auth, getActivityList);

module.exports = router;
