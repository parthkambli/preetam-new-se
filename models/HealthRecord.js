// // models/HealthRecord.js
// const mongoose = require('mongoose');

// const healthRecordSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   date: {
//     type: Date,
//     required: true
//   },
//   time: {
//     type: String,
//     required: true
//   },
//   doctor: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   diagnosis: {
//     type: String,
//     trim: true
//   },
//   medications: {
//     type: String,
//     trim: true
//   },
//   status: {
//     type: String,
//     enum: ['Stable', 'Critical', 'Recovering', 'Under Observation'],
//     required: true,
//     default: 'Stable'
//   },
//   reportFile: {
//     type: String,           // path to uploaded report (PDF, image, etc.)
//     trim: true
//   },
//   organizationId: {
//     type: String,
//     required: true
//   },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// healthRecordSchema.pre('save', function (next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model('HealthRecord', healthRecordSchema);




const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  // Auto-generated Record ID (e.g., HR-0001)
  recordId: {
    type: String,
    unique: true,
    index: true
  },

  // Student reference
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    index: true
  },
  studentName: {
    type: String,
    trim: true
  },

  // Record details
  recordType: {
    type: String,
    enum: ['General Checkup', 'Vaccination', 'Dental', 'Eye', 'ENT', 'Blood Test', 'Other'],
    required: [true, 'Record type is required'],
    default: 'General Checkup'
  },
  recordDate: {
    type: Date,
    required: [true, 'Record date is required'],
    default: Date.now
  },
  time: {
    type: String,   // e.g. "10:30"
    trim: true
  },

  // Doctor & facility
  doctorName: {
    type: String,
    trim: true
  },
  hospitalName: {
    type: String,
    trim: true
  },

  // Vitals
  height: {
    type: Number  // cm
  },
  weight: {
    type: Number  // kg
  },
  bloodPressure: {
    type: String,
    trim: true    // e.g. "120/80"
  },
  temperature: {
    type: Number  // °F
  },
  pulseRate: {
    type: Number  // bpm
  },

  // Medical details
  diagnosis: {
    type: String,
    trim: true
  },
  treatment: {
    type: String,
    trim: true
  },
  prescription: {
    type: String,
    trim: true
  },

  // Status
  status: {
    type: String,
    enum: ['Stable', 'Critical', 'Recovering', 'Under Observation'],
    default: 'Normal'
  },

  // Follow-up & notes
  followUpDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },

  // Uploaded report — stored at uploads/student/health-report/<filename>
  reportFile: {
    type: String
  },
  reportFileName: {
    type: String  // original filename for display
  },

  // Organization
  organizationId: {
    type: String,
    required: [true, 'Organization ID is required'],
    index: true
  }
}, {
  timestamps: true  // adds createdAt & updatedAt automatically
});

// Pre-save: auto-generate recordId
healthRecordSchema.pre('save', async function (next) {
  if (!this.recordId) {
    const count = await mongoose.model('HealthRecord').countDocuments({
      organizationId: this.organizationId
    });
    const seq = (count + 1).toString().padStart(4, '0');
    this.recordId = `HR-${seq}`;
  }
  next();
});

// Indexes
healthRecordSchema.index({ organizationId: 1, studentId: 1 });
healthRecordSchema.index({ organizationId: 1, recordDate: -1 });
healthRecordSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);