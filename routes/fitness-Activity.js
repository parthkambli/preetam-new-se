const express = require('express');
const router = express.Router();
const controller = require('../controllers/fitnessActivityController');

// ================= ACTIVITY =================
router.post('/', controller.createActivity);
router.get('/', controller.getActivities);

// ================= BOOKING =================
router.get('/availability', controller.getAvailability);
router.post('/book', controller.bookSlot);
router.get('/bookings', controller.getBookings);
router.get('/bookings/all', controller.getAllBookingsForDashboard);  // For Bookings  dashboard only...
router.delete('/bookings/:id', controller.cancelBooking); 

// ================= ID ROUTES (ALWAYS LAST) =================
router.get('/:id', controller.getActivityById);
router.put('/:id', controller.updateActivity);
router.delete('/:id', controller.deleteActivity);

module.exports = router;