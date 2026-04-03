const express = require('express');
const auth = require('../middleware/auth');

const {
  getAllActivities,
  createActivity,
  updateActivity,
  deleteActivity
} = require('../controllers/activityController');

const {
  getAllScheduled,
  createScheduled,
  getScheduledById,
  updateScheduled,
  deleteScheduled
} = require('../controllers/scheduledActivityController');

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// MASTER ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', auth, getAllActivities);           // GET all master activities
router.post('/', auth, createActivity);            // Create master activity
router.put('/:id', auth, updateActivity);          // Update master activity
router.delete('/:id', auth, deleteActivity);       // Delete master activity

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULED ACTIVITIES
// ─────────────────────────────────────────────────────────────────────────────
router.get('/scheduled', auth, getAllScheduled);
router.post('/scheduled', auth, createScheduled);
router.get('/scheduled/:id', auth, getScheduledById);
router.put('/scheduled/:id', auth, updateScheduled);
router.delete('/scheduled/:id', auth, deleteScheduled);

module.exports = router;