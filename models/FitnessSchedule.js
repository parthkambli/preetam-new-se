const mongoose = require('mongoose');

const fitnessScheduleSchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessActivity',
    required: [true, 'Activity is required']
  },

  scheduleDate: {
    type: Date,
    required: [true, 'Schedule date is required']
  },

  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true
  },

  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true
  },

  place: {
    type: String,
    required: [true, 'Place is required'],
    trim: true
  },

  instructor: {
    type: String,
    required: [true, 'Instructor is required'],
    trim: true
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

// 🔄 Auto update updatedAt
fitnessScheduleSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports =
  mongoose.models.FitnessSchedule ||
  mongoose.model('FitnessSchedule', fitnessScheduleSchema);