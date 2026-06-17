const mongoose = require('mongoose');

const timeTableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Period name is required'],
    trim: true,
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true,
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true,
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
  },
  organizationId: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

timeTableSchema.index({ organizationId: 1 });

timeTableSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('TimeTable', timeTableSchema);
