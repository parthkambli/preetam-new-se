const express = require('express');
const {
  getAllAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  deleteAdmission
} = require('../controllers/schoolAdmissionController');
const auth = require('../middleware/auth');

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
router.post('/', auth, createAdmission);

// PUT /api/school/admission/:id
// @desc    Update admission by ID
// @access  Private
router.put('/:id', auth, updateAdmission);

// DELETE /api/school/admission/:id
// @desc    Delete admission by ID
// @access  Private
router.delete('/:id', auth, deleteAdmission);

module.exports = router;
