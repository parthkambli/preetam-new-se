const express = require('express');
const {
  getAllStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  updateEmergencyContact,     
  clearEmergencyContact
} = require('../controllers/studentController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/students
// @desc    Get all students with filtering
// @access  Private
router.get('/', auth, getAllStudents);

// GET /api/students/:id
// @desc    Get single student by ID
// @access  Private
router.get('/:id', auth, getStudentById);

// PUT /api/students/:id
// @desc    Update student by ID
// @access  Private
router.put('/:id', auth, updateStudent);

// DELETE /api/students/:id
// @desc    Delete student by ID
// @access  Private
router.delete('/:id', auth, deleteStudent);

// Emergency Contact Routes
// PUT /api/students/:id/emergency-contact
// @desc    Update only emergency contact of a student
// @access  Private
router.put('/:id/emergency-contact', auth, updateEmergencyContact);

// DELETE /api/students/:id/emergency-contact
// @desc    Clear emergency contact of a student
// @access  Private
router.delete('/:id/emergency-contact', auth, clearEmergencyContact);

module.exports = router;
