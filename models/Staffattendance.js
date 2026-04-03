const mongoose = require('mongoose');

// This powers the "View Attendance" page in the Staff section.
// Each document = one staff member's attendance for one day.

const staffAttendanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  date: {
    type: Date,
    required: true      // the calendar day for this record
  },
  inTime: {
    type: String        // e.g. "09:02 AM"  (stored as string to match UI)
  },
  outTime: {
    type: String        // e.g. "06:11 PM"
  },
  workingHours: {
    type: String        // e.g. "9h 09m" — calculated in controller before saving
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day', 'Leave'],
    default: 'Absent'
  },
  remarks: {
    type: String,
    default: ''
  },
  organizationId: {
    type: String,
    required: true
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

staffAttendanceSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// One attendance record per staff per day per org
staffAttendanceSchema.index(
  { organizationId: 1, staff: 1, date: 1 },
  { unique: true }
);
staffAttendanceSchema.index({ organizationId: 1, date: 1 });
staffAttendanceSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('StaffAttendance', staffAttendanceSchema);