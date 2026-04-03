const mongoose = require('mongoose');

// This is the "Add Role" from the Staff page (e.g. Caregiver, Nurse, Trainer).
// It is COMPLETELY SEPARATE from the role field in the User schema (Student/Admin/Participant).

const staffRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true         // e.g. "Caregiver", "Nurse", "Trainer", "Teacher"
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

// One org should not have duplicate role names
staffRoleSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('StaffRole', staffRoleSchema);