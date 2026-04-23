const mongoose = require('mongoose');

const fitnessFeeTypeSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Visitor', 'Residency', 'Membership Pass'],
    required: true
  },
  annual: { type: Number, default: 0 },
  halfYearly: { type: Number, default: 0 },   
  quarterly: { type: Number, default: 0 }, 
  monthly: { type: Number, default: 0 },
  weekly: { type: Number, default: 0 },
  daily: { type: Number, default: 0 },
  hourly: { type: Number, default: 0 },   // Extra field needed for fitness

  organizationId: {
    type: String,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

fitnessFeeTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FitnessFeeType', fitnessFeeTypeSchema);