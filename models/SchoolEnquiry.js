const mongoose = require('mongoose');

const schoolEnquirySchema = new mongoose.Schema({
  enquiryId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: {
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
    default: 'Male'
  },
  activity: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['Walk-in', 'App', 'Call', 'Website', 'Reference'],
    default: 'Walk-in'
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['New', 'Follow Up', 'Converted', 'Admitted'],
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

schoolEnquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
schoolEnquirySchema.index({ organizationId: 1, status: 1 });
schoolEnquirySchema.index({ organizationId: 1, source: 1 });
schoolEnquirySchema.index({ organizationId: 1, date: -1 });
schoolEnquirySchema.index({ contact: 1 });
schoolEnquirySchema.index({ name: 'text' });
schoolEnquirySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SchoolEnquiry', schoolEnquirySchema);
