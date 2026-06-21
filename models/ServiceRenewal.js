const mongoose = require('mongoose');

const serviceRenewalSchema = new mongoose.Schema({
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission',
    required: true,
  },
  serviceIndex: { type: Number, required: true },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
  },
  oldStartDate: Date,
  oldEndDate: Date,
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

module.exports = mongoose.model('ServiceRenewal', serviceRenewalSchema);
