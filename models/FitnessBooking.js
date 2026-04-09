// models/FitnessBooking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessActivity',
    required: true
  },

  slotId: {
    type: mongoose.Schema.Types.ObjectId, // ✅ FIXED
    required: true
  },

  date: {
    type: String,
    required: true
  },

  customerName: {
    type: String,
    required: true
  },

  phone: {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports =
  mongoose.models.FitnessBooking ||
  mongoose.model('FitnessBooking', bookingSchema);