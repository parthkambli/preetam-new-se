const mongoose = require('mongoose');

const fitnessActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
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

fitnessActivitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports =
  mongoose.models.FitnessActivity ||
  mongoose.model('FitnessActivity', fitnessActivitySchema);