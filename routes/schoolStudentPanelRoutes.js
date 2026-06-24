const express = require('express');
const { getProfile, getTimetable } = require('../controllers/schoolStudentPanelController');
const router = express.Router();

router.get('/profile', getProfile);
router.get('/timetable', getTimetable);

module.exports = router;
