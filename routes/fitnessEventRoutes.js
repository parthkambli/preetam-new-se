const express = require('express');
const auth = require('../middleware/auth');
const {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/fitnessEventController');

const router = express.Router();

router.get('/',     auth, getAllEvents);
router.post('/',    auth, createEvent);
router.put('/:id',  auth, updateEvent);
router.delete('/:id', auth, deleteEvent);

module.exports = router;