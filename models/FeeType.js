const mongoose = require('mongoose');

const feeTypeSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['School', 'Residency', 'DayCare'],
    required: true
  },
  annual: { type: Number, default: 0 },
  monthly: { type: Number, default: 0 },
  weekly: { type: Number, default: 0 },
  daily: { type: Number, default: 0 },

  organizationId: {
    type: String,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

feeTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FeeType', feeTypeSchema);