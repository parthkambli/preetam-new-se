const express = require('express');
const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
} = require('../controllers/fitnessMemberController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.get('/', auth, getAllMembers);
router.get('/:id', auth, getMemberById);
router.post('/', auth, createMember);
router.put('/:id', auth, updateMember);
router.delete('/:id', auth, deleteMember);

module.exports = router;