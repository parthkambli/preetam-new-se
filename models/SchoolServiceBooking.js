const mongoose = require('mongoose');

const schoolServiceBookingSchema = new mongoose.Schema({
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission',
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  studentName: {
    type: String,
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
  duration: {
    type: Number,
    required: true,
  },
  perDayFee: {
    type: Number,
    required: true,
  },
  totalFee: {
    type: Number,
    required: true,
  },
  paidAmount: {
    type: Number,
    default: 0,
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer'],
  },
  paymentDate: Date,
  responsibleStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessStaff',
  },
  organizationId: {
    type: String,
    required: true,
  },
  isFromAdmission: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['Active', 'Cancelled'],
    default: 'Active',
  },
  dates: [Date],
}, {
  timestamps: true,
});

schoolServiceBookingSchema.index({ organizationId: 1, status: 1 });
schoolServiceBookingSchema.index({ serviceId: 1, status: 1 });
schoolServiceBookingSchema.index({ serviceId: 1, startDate: 1, endDate: 1 });
schoolServiceBookingSchema.index({ organizationId: 1, serviceId: 1, status: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('SchoolServiceBooking', schoolServiceBookingSchema);
