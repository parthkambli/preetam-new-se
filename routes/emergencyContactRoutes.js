// routes/emergencyContactRoutes.js
const express = require('express');
const auth = require('../middleware/auth');

const {
  getAllEmergencyContacts,
  saveEmergencyContact,
  deleteEmergencyContact
} = require('../controllers/emergencyContactController');

const router = express.Router();

router.get('/', auth, getAllEmergencyContacts);
router.post('/', auth, saveEmergencyContact);
router.put('/:id', auth, saveEmergencyContact);
router.delete('/:id', auth, deleteEmergencyContact);

module.exports = router;