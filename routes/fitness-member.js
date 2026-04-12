const express = require('express');
const {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  renewMember   
} = require('../controllers/fitnessMemberController');

const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.get('/', auth, getAllMembers);
router.post('/', auth, createMember);

// Renew route
router.post('/:id/renew', auth, renewMember);  

router.get('/:id', auth, getMemberById);
router.put('/:id', auth, updateMember);
router.delete('/:id', auth, deleteMember);

module.exports = router;