// // models/FitnessBooking.js
// const mongoose = require('mongoose');

// const bookingSchema = new mongoose.Schema({
//   activityId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'FitnessActivity',
//     required: true
//   },

//   slotId: {
//     type: mongoose.Schema.Types.ObjectId, // ✅ FIXED
//     required: true
//   },

//   date: {
//     type: String,
//     required: true
//   },

//   customerName: {
//     type: String,
//     required: true
//   },

//   phone: {
//     type: String,
//     required: true
//   },

//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports =
//   mongoose.models.FitnessBooking ||
//   mongoose.model('FitnessBooking', bookingSchema);










const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessActivity',
    required: true
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  date: {
    type: String,        // YYYY-MM-DD
    required: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessMember',   // Link to the member
    required: true
  },
  activityFeeIndex: {     // Which activityFee in the member's array (0, 1, ...)
    type: Number,
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: true
  },
  isException: {
    type: Boolean,
    default: false          // true = one-day slot change / override
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

// Compound index for fast availability checks
bookingSchema.index({ slotId: 1, date: 1 });
bookingSchema.index({ memberId: 1, activityFeeIndex: 1, date: 1 });

module.exports = mongoose.models.FitnessBooking || mongoose.model('FitnessBooking', bookingSchema);