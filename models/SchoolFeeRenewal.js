const mongoose = require('mongoose');

const schoolFeeRenewalSchema = new mongoose.Schema({
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission',
    required: true,
  },
  oldFeePlan: String,
  oldStartDate: Date,
  oldEndDate: Date,
  newFeePlan: { type: String, required: true },
  newStartDate: { type: Date, required: true },
  newEndDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Pending',
  },
  organizationId: { type: String, required: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SchoolFeeRenewal', schoolFeeRenewalSchema);
