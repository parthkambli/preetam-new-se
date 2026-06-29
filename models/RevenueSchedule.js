const mongoose = require('mongoose');

const revenueScheduleSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission',
    required: true,
  },
  organizationId: {
    type: String,
    required: true,
  },
  contractId: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    unique: true,
  },
  sourceType: {
    type: String,
    enum: ['Admission', 'Service'],
    required: true,
  },
  sourceReferenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  planName: {
    type: String,
    required: true,
  },
  grossAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Normal', 'Cancelled'],
    default: 'Normal',
  },
  cancelledAt: {
    type: Date,
  },
  createdBy: {
    type: String,
  },
  remarks: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

revenueScheduleSchema.index({ organizationId: 1, startDate: 1, endDate: 1 });
revenueScheduleSchema.index({ participantId: 1, createdAt: -1 });

module.exports = mongoose.model('RevenueSchedule', revenueScheduleSchema);
