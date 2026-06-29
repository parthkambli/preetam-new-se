const express = require('express');
const auth = require('../middleware/auth');
const { getPeriodStudents } = require('../controllers/schoolPeriodStudentController');

const router = express.Router();

router.get('/', auth, getPeriodStudents);

module.exports = router;
