const express = require('express');
const {
  getFitnessFeeTypes,      
  createFitnessFeeType,
  updateFitnessFeeType,
  deleteFitnessFeeType,

  getFitnessAllotments,
  allotFitnessFee,
  updateFitnessAllotment,

  getFitnessPayments,
  addFitnessPayment
} = require('../controllers/fitnessFeeController');

const auth = require('../middleware/auth');

const router = express.Router();

// Fitness Fee Types
router.get('/types', auth, getFitnessFeeTypes);
router.post('/types', auth, createFitnessFeeType);
router.put('/types/:id', auth, updateFitnessFeeType);
router.delete('/types/:id', auth, deleteFitnessFeeType);

// Fitness Fee Allotments
router.get('/allotments', auth, getFitnessAllotments);
router.post('/allotments', auth, allotFitnessFee);
router.put('/allotments/:id', auth, updateFitnessAllotment);

// Fitness Fee Payments
router.get('/payments', auth, getFitnessPayments);
router.post('/payments', auth, addFitnessPayment);

module.exports = router;