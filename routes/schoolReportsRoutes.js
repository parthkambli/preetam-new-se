const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const SchoolReportsController = require('../controllers/schoolReportsController');

router.get(
  '/reports/dashboard',
  authMiddleware,
  SchoolReportsController.getDashboard
);

module.exports = router;
