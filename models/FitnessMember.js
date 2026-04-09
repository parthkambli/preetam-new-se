const mongoose = require('mongoose');

const fitnessMemberSchema = new mongoose.Schema({
  // Auto-generated Member ID (e.g., MEM-CLUB-0001)
  memberId: {
    type: String,
    unique: true,
    index: true
  },

  // Personal Information
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Mobile must be a valid 10-digit number'],
    // unique: true
  },
  email: {
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  age: {
    type: Number,
    min: [0, 'Age cannot be negative'],
    max: [120, 'Age cannot exceed 120']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  address: {
    type: String,
    trim: true
  },
 responsibleStaff: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FitnessStaff',
  default: null

  },
  photo: {
    type: String // Path to uploaded image (e.g., /uploads/members/abc123.jpg)
  },

  // Membership & Activity
  activity: {
    type: String,
    required: [true, 'Activity is required'],
    trim: true
  },
  plan: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
    default: 'Monthly'
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date
  },

  // Plan & Fee Details
  planDuration: {
    type: String,
    enum: ['1 Month', '3 Months', '6 Months', '12 Months'],
    default: '1 Month'
  },
  planFee: {
    type: Number,
    min: [0, 'Plan fee cannot be negative'],
    default: 0
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    default: 0
  },
  finalAmount: {
    type: Number,
    min: [0, 'Final amount cannot be negative'],
    default: 0
  },
  paymentDate: {
    type: Date
  },
  planNotes: {
    type: String,
    trim: true
  },

  // Login Details (stored directly in member - no User model linkage as per requirement)
  userId: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },

  // Link to enquiry (optional - for "Add from Enquiry" feature)
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessEnquiry',
    default: null
  },

  // Organization & timestamps
  organizationId: {
    type: String,
    required: [true, 'Organization ID is required'],
    index: true
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

// Pre-save: Generate memberId if not provided
fitnessMemberSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();

  if (!this.memberId) {
    const count = await mongoose.model('FitnessMember').countDocuments({
      organizationId: this.organizationId
    });
    const seq = (count + 1).toString().padStart(4, '0');
    this.memberId = `MEM-CLUB-${seq}`;
  }

  // Auto-calculate finalAmount if not set
  if (this.planFee !== undefined && this.discount !== undefined) {
    this.finalAmount = Math.max(0, this.planFee - this.discount);
  }

  next();
});


// ✅ Add this compound unique index (Best Practice)
fitnessMemberSchema.index(
  { organizationId: 1, mobile: 1 }, 
  { unique: true }
);

// Indexes for performance
fitnessMemberSchema.index({ organizationId: 1, status: 1 });
// fitnessMemberSchema.index({ organizationId: 1, mobile: 1 });
fitnessMemberSchema.index({ organizationId: 1, memberId: 1 });
fitnessMemberSchema.index({ name: 'text' }); // name field is used
fitnessMemberSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FitnessMember', fitnessMemberSchema);