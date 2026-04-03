const mongoose = require('mongoose');

const feeAllotmentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission'
  },

  feeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeType'
  },
  description: String,           // e.g. "Senior Citizen Happiness School"
  feePlan: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Annual'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['Pending', 'Partially Paid', 'Paid'],
    default: 'Pending'
  },

  organizationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

feeAllotmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FeeAllotment', feeAllotmentSchema);