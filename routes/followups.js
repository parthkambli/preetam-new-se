const express = require('express');
const {
  getAllFollowups,
  getUpcomingFollowups,
  createFollowup,
  deleteFollowup
} = require('../controllers/followupController');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/followups
// @desc    Get all followups with filtering
// @access  Private
router.get('/', auth, getAllFollowups);

// GET /api/followups/upcoming
// @desc    Get upcoming followups (nextVisit >= today)
// @access  Private
router.get('/upcoming', auth, getUpcomingFollowups);

// POST /api/followups
// @desc    Create new followup (also updates related enquiry status)
// @access  Private
router.post('/', auth, createFollowup);

// DELETE /api/followups/:id
// @desc    Delete followup by ID
// @access  Private
router.delete('/:id', auth, deleteFollowup);

module.exports = router;
