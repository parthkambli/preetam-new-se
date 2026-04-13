// const mongoose = require('mongoose');

// const fitnessFeePaymentSchema = new mongoose.Schema({
//   memberId: {   // Changed from studentId
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'FitnessMember',
//     required: true
//   },
//   allotmentId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'FitnessFeeAllotment'
//   },

//   description: String,
//   feePlan: String,
//   amount: { type: Number, required: true },
//   paymentDate: { type: Date, default: Date.now },
//   paymentMode: {
//     type: String,
//     enum: ['Cash', 'Cheque', 'Online', 'UPI', 'Bank Transfer'],
//     required: true
//   },
//   transactionId: String,
//   remarks: String,

//   organizationId: { type: String, required: true },
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('FitnessFeePayment', fitnessFeePaymentSchema);








// models/FitnessFeePayment.js
const mongoose = require('mongoose');

const fitnessFeePaymentSchema = new mongoose.Schema({
  memberId: {   
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessMember',
    required: false,        // ← Changed for walk-ins
    default: null
  },
  allotmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessFeeAllotment'
  },

  description: String,
  feePlan: String,
  amount: { type: Number, required: true },
  paymentDate: { type: Date, default: Date.now },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Cheque', 'Online', 'UPI', 'Bank Transfer'],
    required: true
  },
  transactionId: String,
  remarks: String,

  organizationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FitnessFeePayment', fitnessFeePaymentSchema);