const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission'
  },
  allotmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeAllotment'
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

module.exports = mongoose.model('FeePayment', feePaymentSchema);