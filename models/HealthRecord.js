// models/HealthRecord.js
const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  doctor: {
    type: String,
    required: true,
    trim: true
  },
  diagnosis: {
    type: String,
    trim: true
  },
  medications: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['Stable', 'Critical', 'Improving', 'Under Observation'],
    required: true,
    default: 'Stable'
  },
  reportFile: {
    type: String,           // path to uploaded report (PDF, image, etc.)
    trim: true
  },
  organizationId: {
    type: String,
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

healthRecordSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);