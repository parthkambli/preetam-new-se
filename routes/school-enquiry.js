const express = require('express');
const {
  getAllEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
  getEnquiriesForAdmission
} = require('../controllers/schoolEnquiryController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/school/enquiry
// @desc    Get all school enquiries with filtering
// @access  Private
router.get('/', auth, getAllEnquiries);

// GET /api/school/enquiry/admission-list
// @desc    Get enquiries for admission dropdown (status != Admitted)
// @access  Private
router.get('/admission-list', auth, getEnquiriesForAdmission);

// GET /api/school/enquiry/:id
// @desc    Get single enquiry by ID
// @access  Private
router.get('/:id', auth, getEnquiryById);

// POST /api/school/enquiry
// @desc    Create new school enquiry
// @access  Private
router.post('/', auth, createEnquiry);

// PUT /api/school/enquiry/:id
// @desc    Update enquiry (add remark, change status)
// @access  Private
router.put('/:id', auth, updateEnquiry);

// DELETE /api/school/enquiry/:id
// @desc    Delete enquiry
// @access  Private
router.delete('/:id', auth, deleteEnquiry);

module.exports = router;
