const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    trim: true
  },
  admissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolAdmission',
    required: true,
    unique: true
  },
  
  // Personal Information (copied from admission for quick access)
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  dob: {
    type: Date
  },
  aadhaar: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  fullAddress: {
    type: String,
    required: true
  },
  photo: {
    type: String
  },

  // Health Information
  bloodGroup: {
    type: String
  },
  physicalDisability: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  seriousDisease: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  regularMedication: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  doctorName: {
    type: String
  },
  doctorMobile: {
    type: String
  },

  // Emergency Contact
// Updated to match your Emergency Contacts page UI
  primaryContactName: { type: String, trim: true },
  primaryRelation: { type: String, trim: true },
  primaryPhone: { type: String, trim: true },

  secondaryContactName: { type: String, trim: true },
  secondaryRelation: { type: String, trim: true },
  secondaryPhone: { type: String, trim: true },

  // Optional extra fields from admission
  villageCity: { type: String, trim: true },
  alternateContact: { type: String, trim: true },

  // Academic & Activity Details
  feePlan: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Annual'],
    default: 'Monthly'
  },
  amount: {
    type: Number,
    default: 0
  },
  assignedCaregiver: {
    type: String
  },
  hobbies: {
    type: [String],
    default: []
  },
  games: {
    type: [String],
    default: []
  },
  behaviour: {
    type: String,
    enum: ['Calm', 'Angry', 'Moderate', 'Strict']
  },

  // System fields
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
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

// Generate student ID before save
studentSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();

  if (!this.studentId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.studentId = `STU${dateStr}-${randomNum}`;
  }

  next();
});

// Indexes for better query performance
studentSchema.index({ organizationId: 1, status: 1 });
studentSchema.index({ organizationId: 1, feePlan: 1 });
studentSchema.index({ mobile: 1 });
studentSchema.index({ fullName: 'text' });
studentSchema.index({ createdAt: -1 });
// Note: studentId and admissionId already have unique: true which creates indexes

module.exports = mongoose.model('Student', studentSchema);
