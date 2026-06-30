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
const { allowPermissions } = require('../middleware/permissions');

const router = express.Router();

// Fee Types
router.get('/types', auth, allowPermissions('SCHOOL_VIEW_FEES'), getFeeTypes);
router.post('/types', auth, allowPermissions('SCHOOL_VIEW_FEES'), createFeeType);
router.put('/types/:id', auth, allowPermissions('SCHOOL_VIEW_FEES'), updateFeeType);
router.delete('/types/:id', auth, allowPermissions('SCHOOL_VIEW_FEES'), deleteFeeType);

// Fee Allotments
router.get('/allotments', auth, allowPermissions('SCHOOL_VIEW_FEES'), getAllotments);
router.post('/allotments', auth, allowPermissions('SCHOOL_VIEW_FEES'), allotFee);
router.put('/allotments/:id', auth, allowPermissions('SCHOOL_VIEW_FEES'), updateAllotment);

// Fee Payments
router.get('/payments', auth, allowPermissions('SCHOOL_VIEW_FEES'), getPayments);
router.post('/payments', auth, allowPermissions('SCHOOL_VIEW_FEES'), addPayment);

module.exports = router;