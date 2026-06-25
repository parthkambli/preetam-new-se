const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  cancelBooking,
  getAvailableSeats,
  getServiceStudents,
} = require('../controllers/schoolServiceBookingController');

// GET /api/school/service-bookings/students — must be before /seats/:serviceId
router.get('/students', getServiceStudents);

// GET /api/school/service-bookings/seats/:serviceId — must be before /:id
router.get('/seats/:serviceId', getAvailableSeats);

// GET /api/school/service-bookings
router.get('/', getBookings);

// POST /api/school/service-bookings
router.post('/', createBooking);

// PATCH /api/school/service-bookings/:id/cancel
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
