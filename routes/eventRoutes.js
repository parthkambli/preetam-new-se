// routes/eventRoutes.js
const express = require('express');
const auth = require('../middleware/auth');

const {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');

const router = express.Router();

// Events Routes
router.get('/', auth, getAllEvents);
router.post('/', auth, createEvent);
router.put('/:id', auth, updateEvent);
router.delete('/:id', auth, deleteEvent);

module.exports = router;