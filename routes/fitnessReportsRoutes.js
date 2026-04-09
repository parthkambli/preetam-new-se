const express = require('express');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

const FitnessReportsController = require('../controllers/fitnessReportsController');

router.get(
  '/reports/summary',
  authMiddleware,
  FitnessReportsController.getSummary
);

module.exports = router;