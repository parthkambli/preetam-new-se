const express = require('express');
const {
  getFeeTypes,
  createFeeType,
  updateFeeType,
  deleteFeeType,

  getAllotments,
  allotFee,
  updateAllotment,

  getPayments,
  addPayment
} = require('../controllers/feeController');

const auth = require('../middleware/auth');

const router = express.Router();

// Fee Types
router.get('/types', auth, getFeeTypes);
router.post('/types', auth, createFeeType);
router.put('/types/:id', auth, updateFeeType);
router.delete('/types/:id', auth, deleteFeeType);

// Fee Allotments
router.get('/allotments', auth, getAllotments);
router.post('/allotments', auth, allotFee);
router.put('/allotments/:id', auth, updateAllotment);

// Fee Payments
router.get('/payments', auth, getPayments);
router.post('/payments', auth, addPayment);

module.exports = router;