const mongoose = require('mongoose');

const scheduledActivitySchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,        // e.g. "07:00 AM"
    required: true
  },
  place: {
    type: String,
    required: true
  },
  instructorName: {
    type: String,
    required: true
  },
  organizationId: {
    type: String,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

scheduledActivitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ScheduledActivity', scheduledActivitySchema);