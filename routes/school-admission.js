const express = require('express');
const {
  getAllAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  collectPayment,
  getAdmissionPayments
} = require('../controllers/schoolAdmissionController');
const auth = require('../middleware/auth');
const { upload, handleUpload } = require('../middleware/upload');


const router = express.Router();

// GET /api/school/admission
// @desc    Get all school admissions with filtering
// @access  Private
router.get('/', auth, getAllAdmissions);

// GET /api/school/admission/:id
// @desc    Get single admission by ID
// @access  Private
router.get('/:id', auth, getAdmissionById);

// POST /api/school/admission
// @desc    Create new admission (also creates Student and User records)
// @access  Private
// router.post('/', auth, createAdmission);
router.post(
  '/',
  auth,
  handleUpload(upload.schoolAdmission),
  createAdmission
);

// PUT /api/school/admission/:id
// @desc    Update admission by ID
// @access  Private
// router.put('/:id', auth, updateAdmission);
router.put(
  '/:id',
  auth,
  handleUpload(upload.schoolAdmission),
  updateAdmission
);

// DELETE /api/school/admission/:id
// @desc    Delete admission by ID
// @access  Private
router.delete('/:id', auth, deleteAdmission);

// POST /api/school/admission/:id/collect-payment
// @desc    Collect pending fee payment for an admission
// @access  Private
router.post('/:id/collect-payment', auth, collectPayment);

// GET /api/school/admission/:id/payments
// @desc    Get payment history for an admission
// @access  Private
router.get('/:id/payments', auth, getAdmissionPayments);

module.exports = router;
