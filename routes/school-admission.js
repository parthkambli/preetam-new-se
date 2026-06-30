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
const { allowPermissions } = require('../middleware/permissions');
const { upload, handleUpload } = require('../middleware/upload');


const router = express.Router();

// GET /api/school/admission
// @desc    Get all school admissions with filtering
// @access  Private
router.get('/', auth, allowPermissions('SCHOOL_VIEW_ADMISSION'), getAllAdmissions);

// GET /api/school/admission/:id
// @desc    Get single admission by ID
// @access  Private
router.get('/:id', auth, allowPermissions('SCHOOL_VIEW_ADMISSION'), getAdmissionById);

// POST /api/school/admission
// @desc    Create new admission (also creates Student and User records)
// @access  Private
// router.post('/', auth, createAdmission);
router.post(
  '/',
  auth,
  allowPermissions('SCHOOL_ADD_ADMISSION'),
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
  allowPermissions('SCHOOL_EDIT_ADMISSION'),
  handleUpload(upload.schoolAdmission),
  updateAdmission
);

// DELETE /api/school/admission/:id
// @desc    Delete admission by ID
// @access  Private
router.delete('/:id', auth, allowPermissions('SCHOOL_DELETE_ADMISSION'), deleteAdmission);

// POST /api/school/admission/:id/collect-payment
// @desc    Collect pending fee payment for an admission
// @access  Private
router.post('/:id/collect-payment', auth, allowPermissions('SCHOOL_EDIT_ADMISSION'), collectPayment);

// GET /api/school/admission/:id/payments
// @desc    Get payment history for an admission
// @access  Private
router.get('/:id/payments', auth, allowPermissions('SCHOOL_VIEW_ADMISSION'), getAdmissionPayments);

module.exports = router;
