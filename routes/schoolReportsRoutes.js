const express = require('express');
const authMiddleware = require('../middleware/auth');
const { allowPermissions } = require('../middleware/permissions');
const router = express.Router();

const SchoolReportsController = require('../controllers/schoolReportsController');

router.get(
  '/reports/dashboard',
  authMiddleware,
  allowPermissions('SCHOOL_VIEW_REPORTS'),
  SchoolReportsController.getDashboard
);

module.exports = router;
