const mongoose = require('mongoose');

const fitnessAttendanceSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessMember',
    required: true,
    index: true
  },

  // activity: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'FitnessActivity',
  //   required: true
  // },

  activity: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FitnessActivity',
  default: null
},

  // Critical: Link to exact activityFee entry inside member.activityFees[]
  // activityFeeId: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   required: true,
  //   index: true
  // },

  activityFeeId: {
  type: mongoose.Schema.Types.ObjectId,
  default: null,
  index: true
},

  attendanceDate: {
    type: Date,
    required: true,
    default: () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
  },

 markedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FitnessStaff',
  default: null
},

  status: {
    type: String,
    enum: ['Present', 'Absent'],
    default: 'Present'
  },

  notes: {
    type: String,
    trim: true,
    default: ''
  },

  organizationId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Unique index: One attendance per member + activity + date
fitnessAttendanceSchema.index(
  { member: 1, activity: 1, attendanceDate: 1, organizationId: 1 },
  { unique: true }
);

module.exports = mongoose.model('FitnessAttendance', fitnessAttendanceSchema);