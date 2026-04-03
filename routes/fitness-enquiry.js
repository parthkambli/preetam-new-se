const express = require('express');
const {
  getAllEnquiries,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry
} = require('../controllers/fitnessEnquiryController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/fitness/enquiry
// @desc    Get all fitness enquiries with filtering
// @access  Private
router.get('/', auth, getAllEnquiries);

// GET /api/fitness/enquiry/:id
// @desc    Get single enquiry by ID
// @access  Private
router.get('/:id', auth, getEnquiryById);

// POST /api/fitness/enquiry
// @desc    Create new fitness enquiry
// @access  Private
router.post('/', auth, createEnquiry);

// PUT /api/fitness/enquiry/:id
// @desc    Update enquiry (add remark, change status)
// @access  Private
router.put('/:id', auth, updateEnquiry);

// DELETE /api/fitness/enquiry/:id
// @desc    Delete enquiry
// @access  Private
router.delete('/:id', auth, deleteEnquiry);

module.exports = router;
