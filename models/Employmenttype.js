const mongoose = require('mongoose');

// This is the "Add Employment Type" from the Staff page (e.g. Full Time, Part Time, Contract).

const employmentTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true         // e.g. "Full Time", "Part Time", "Contract"
  },
  organizationId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// One org should not have duplicate employment type names
employmentTypeSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('EmploymentType', employmentTypeSchema);