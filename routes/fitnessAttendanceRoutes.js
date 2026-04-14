const express = require('express');
const router = express.Router();

const attendanceController = require('../controllers/fitnessAttendanceController');
const auth = require('../middleware/auth');

// ====================== PUBLIC ROUTE (Android Staff Scanner) ======================
router.get('/validate/:memberId', attendanceController.validateMemberQR);

// ====================== PROTECTED ROUTES (Require Login + Token) ======================
router.post('/mark', auth, attendanceController.markAttendance);
router.get('/summary', auth, attendanceController.getAttendanceSummary);
router.get('/details/:activityId/:date', auth, attendanceController.getStudentAttendance);

module.exports = router;