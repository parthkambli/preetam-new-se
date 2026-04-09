const mongoose = require('mongoose');

const fitnessFeeAllotmentSchema = new mongoose.Schema({
  memberId: {   // Changed from studentId
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessMember',
    required: true
  },

  feeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessFeeType',
    required: true
  },
  description: String,
  feePlan: {
    type: String,
    enum: ['Annual', 'Monthly', 'Weekly', 'Daily', 'Hourly'],
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
  responsibleStaff: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FitnessStaff',
  default: null
},

  organizationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

fitnessFeeAllotmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FitnessFeeAllotment', fitnessFeeAllotmentSchema);