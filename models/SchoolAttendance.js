const mongoose = require('mongoose');

const schoolAttendanceSchema = new mongoose.Schema({
  studentId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'SchoolAdmission',
  required: true
},
admissionId: {
  type: String,
  required: true,
  index: true
},
  periodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeTable',
    required: true,
  },
  activityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity',
    required: true,
  },
  attendanceDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    default: 'Present',
  },
  markedAt: {
  type: Date,
  default: Date.now
},
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessStaff',
    default: null,
  },
  organizationId: {
    type: String,
    required: true,
  },
}, { timestamps: true });

schoolAttendanceSchema.index(
  { studentId: 1, periodId: 1, activityId: 1, attendanceDate: 1 },
  { unique: true }
);

schoolAttendanceSchema.index({
  attendanceDate: 1,
  organizationId: 1
});

schoolAttendanceSchema.index({
  periodId: 1,
  activityId: 1,
  attendanceDate: 1
});

schoolAttendanceSchema.index({
  studentId: 1,
  attendanceDate: 1
});

module.exports = mongoose.model('SchoolAttendance', schoolAttendanceSchema);
