const express = require('express');
const router = express.Router();
const { getSchoolDashboard } = require('../controllers/schoolDashboardController');

router.get('/', getSchoolDashboard);

module.exports = router;