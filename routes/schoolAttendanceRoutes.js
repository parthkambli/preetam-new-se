const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { allowPermissions } = require('../middleware/permissions');
const {
  getAttendanceSummary,
  getAttendanceStudents,
  getActivityList,
} = require('../controllers/schoolAdminAttendanceController');

router.get('/summary', auth, allowPermissions('SCHOOL_VIEW_ATTENDANCE'), getAttendanceSummary);
router.get('/students', auth, allowPermissions('SCHOOL_VIEW_ATTENDANCE'), getAttendanceStudents);
router.get('/activities', auth, allowPermissions('SCHOOL_VIEW_ATTENDANCE'), getActivityList);

module.exports = router;
