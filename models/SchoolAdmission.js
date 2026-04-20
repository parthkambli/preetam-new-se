const mongoose = require('mongoose');

const schoolAdmissionSchema = new mongoose.Schema({
  // Personal Information
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
    // required: true
  },
  photo: {
    type: String // URL to uploaded photo
  },
  
  // Health Information
  physicalDisability: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  mainIllness: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String
  },
  doctorName: {
    type: String
  },
  doctorVillage: {
    type: String
  },
  doctorMobile: {
    type: String
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
  healthDetails: {
    type: String,
    default: ''
  },
  medicalReports: {
    type: [String] // URL to uploaded reports
  },
  
  // Education & Service
  education: {
    type: String
  },
  educationPlace: {
    type: String
  },
  yearsOfService: {
    type: String
  },
  servicePlace: {
    type: String
  },
  occupationType: {
    type: String,
    enum: ['Government', 'Private', 'Retired', 'Self Employed']
  },
  
  // Daily Routine
  wakeUpTime: {
    type: String
  },
  breakfastTime: {
    type: String
  },
  lunchTime: {
    type: String
  },
  dinnerTime: {
    type: String
  },
  behaviour: {
    type: String,
    enum: ['Calm', 'Angry', 'Moderate', 'Strict']
  },
  hobbies: {
    type: [String],
    default: []
  },
  games: {
    type: [String],
    default: []
  },
  
  // Emergency Contact
  // Emergency Contact Fields (Flat - Matches your UI perfectly)
  primaryContactName: {
    type: String,
    trim: true
  },
  primaryRelation: {
    type: String,
    trim: true
  },
  primaryPhone: {
    type: String,
    trim: true
  },
  secondaryContactName: {
    type: String,
    trim: true
  },
  secondaryRelation: {
    type: String,
    trim: true
  },
  secondaryPhone: {
    type: String,
    trim: true
  },
  villageCity: { type: String, trim: true },
  alternateContact: { type: String, trim: true },
  
  // Declaration
  declarationDate: {
    type: Date
  },
  declarationPlace: {
    type: String
  },
  signature: {
    type: String
  },
  
  // Login & Admission Details
  loginMobile: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  role: {
    type: String,
    default: 'Participant'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  admissionId: {
    type: String,
    unique: true
  },
  assignedCaregiver: {
    type: String
  },
  feePlan: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Annual'],
    default: 'Monthly'
  },
  instituteType: {
    type: String,
    enum: ['School', 'Residency','DayCare'],
    default: 'School'
  },
  amount: {
    type: Number
  },
  messFacility: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  residency: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'No'
  },
  paymentDate: {
    type: Date
  },
  feeDescription: {
    type: String,
    default: 'Senior Citizen Happiness School (Age 55+)'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial'],
    default: 'Pending'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer']
  },
  nextDueDate: {
    type: Date
  },
  feeRemarks: {
    type: String,
    default: ''
  },
  
  // System fields
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SchoolEnquiry',
    default: null
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

// Generate admission ID before save
schoolAdmissionSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  if (!this.admissionId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    this.admissionId = `PSC${dateStr}-${randomNum}`;
  }
  
  next();
});

// Indexes for better query performance
schoolAdmissionSchema.index({ organizationId: 1, status: 1 });
schoolAdmissionSchema.index({ organizationId: 1, feePlan: 1 });
schoolAdmissionSchema.index({ organizationId: 1, paymentStatus: 1 });
schoolAdmissionSchema.index({ mobile: 1 });
schoolAdmissionSchema.index({ fullName: 'text' });
schoolAdmissionSchema.index({ createdAt: -1 });
// Note: loginMobile and admissionId already have unique: true which creates indexes

module.exports = mongoose.model('SchoolAdmission', schoolAdmissionSchema);
