const mongoose = require('mongoose');

const fitnessEnquirySchema = new mongoose.Schema({
  enquiryId: {
    type: String,
    unique: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  interestedActivity: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['Walk-in', 'App', 'Call', 'Website', 'Reference'],
    default: 'Walk-in'
  },
  enquiryDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['New', 'Follow-up', 'Converted', 'Admitted'],
    default: 'New'
  },
  remark: {
    type: String,
    default: ''
  },
  nextVisit: {
    type: Date
  },
  organizationId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

fitnessEnquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
fitnessEnquirySchema.index({ organizationId: 1, status: 1 });
fitnessEnquirySchema.index({ organizationId: 1, source: 1 });
fitnessEnquirySchema.index({ organizationId: 1, enquiryDate: -1 });
fitnessEnquirySchema.index({ mobile: 1 });
fitnessEnquirySchema.index({ fullName: 'text' });
fitnessEnquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('FitnessEnquiry', fitnessEnquirySchema);
