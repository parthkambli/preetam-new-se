const mongoose = require('mongoose');

const schoolReminderSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  type: {
    type: String,
    enum: ['OneTime', 'Daily'],
    required: true,
  },
  date: {
    type: Date,
    default: null,
  },
  time: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active'],
    default: 'Active',
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission',
    required: true,
  },
  organizationId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('SchoolReminder', schoolReminderSchema);
