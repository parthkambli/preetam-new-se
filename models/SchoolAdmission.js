const mongoose = require('mongoose');

const timetableRowSchema = new mongoose.Schema({
  periodId: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeTable' },
  mondayActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  tuesdayActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  wednesdayActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  thursdayActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  fridayActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  saturdayActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  sundayActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
}, { _id: false });

const serviceBookingSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  startDate: Date,
  endDate: Date,
  days: Number,
  perDayFee: Number,
  totalFee: Number,
}, { _id: false });

const paymentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  paymentDate: Date,
  paymentMode: { type: String, enum: ['Cash', 'Bank Transfer'] },
  description: String,
  responsibleStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'FitnessStaff' },
}, { _id: false });

const membershipHistorySchema = new mongoose.Schema({
  feeTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeType' },
  feePlan: String,
  startDate: Date,
  endDate: Date,
  renewedAt: { type: Date, default: Date.now },
}, { _id: false });

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
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'HalfYearly', 'Annual'],
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

  // Fee calculation fields (server-calculated, never trust frontend)
  feeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeType'
  },
  feeAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalFee: {
    type: Number,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  responsibleStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },

  // Embedded timetable (per-student)
  timetable: {
    type: [timetableRowSchema],
    default: []
  },
  services: {
    type: [serviceBookingSchema],
    default: []
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
    enum: ['Paid', 'Pending'],
    default: 'Pending'
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Bank Transfer']
  },
  paymentHistory: {
    type: [paymentHistorySchema],
    default: []
  },
  membershipHistory: {
    type: [membershipHistorySchema],
    default: []
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
  qrCode: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for remaining days (always computed)
const msPerDay = 1000 * 60 * 60 * 24;

schoolAdmissionSchema.virtual('feeRemainingDays').get(function() {
  if (!this.endDate) return '—';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);
  const start = this.startDate ? new Date(this.startDate) : null;
  if (start) start.setHours(0, 0, 0, 0);

  if (start && start.getTime() > now.getTime()) {
    const diff = Math.round((start.getTime() - now.getTime()) / msPerDay);
    return `Starts in ${diff}d`;
  }
  if (end < now) return 'Expired';
  const diff = Math.floor((end - now) / msPerDay);
  return `${diff}d`;
});

schoolAdmissionSchema.virtual('serviceRemainingDays').get(function() {
  if (!this.services || this.services.length === 0) return '—';
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let latestEnd = null;
  for (const svc of this.services) {
    if (svc.endDate) {
      const d = new Date(svc.endDate);
      if (!latestEnd || d > latestEnd) latestEnd = d;
    }
  }
  if (!latestEnd) return '—';
  if (latestEnd < now) return 'Expired';
  const diff = Math.floor((latestEnd - now) / msPerDay);
  return `${diff}d`;
});

// Generate sequential admission ID before save (PSCYYYYMMDD-001)
schoolAdmissionSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();

  if (!this.admissionId || this.admissionId.startsWith('PSC') === false) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const prefix = `PSC${y}${m}${d}-`;

    const last = await mongoose.model('SchoolAdmission')
      .findOne({ admissionId: new RegExp(`^${prefix}`) })
      .sort({ admissionId: -1 })
      .select('admissionId')
      .lean();

    let seq = 1;
    if (last) {
      const parts = last.admissionId.split('-');
      seq = parseInt(parts[1], 10) + 1;
    }
    this.admissionId = `${prefix}${String(seq).padStart(3, '0')}`;
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
