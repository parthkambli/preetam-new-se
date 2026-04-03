const mongoose = require('mongoose');

const followupSchema = new mongoose.Schema({
  enquiryType: {
    type: String,
    enum: ['school', 'fitness'],
    required: true
  },
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  personName: {
    type: String,
    required: true
  },
  mobile: {
    type: String,
    required: true
  },
  activity: {
    type: String
  },
  previousStatus: {
    type: String,
    enum: ['New', 'Follow Up', 'Follow-up', 'Converted', 'Admitted']
  },
  newStatus: {
    type: String,
    enum: ['New', 'Follow Up', 'Follow-up', 'Converted', 'Admitted'],
    required: true
  },
  remark: {
    type: String,
    required: true
  },
  nextVisit: {
    type: Date
  },
  followupDate: {
    type: Date,
    default: Date.now
  },
  organizationId: {
    type: String,
    required: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
followupSchema.index({ organizationId: 1, newStatus: 1 });
followupSchema.index({ organizationId: 1, followupDate: -1 });
followupSchema.index({ organizationId: 1, nextVisit: 1 });
followupSchema.index({ organizationId: 1, enquiryType: 1 });
followupSchema.index({ mobile: 1 });
followupSchema.index({ personName: 'text' });
followupSchema.index({ enquiryId: 1 });

module.exports = mongoose.model('Followup', followupSchema);
