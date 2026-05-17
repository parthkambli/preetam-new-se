// const mongoose = require('mongoose');

// const fitnessMemberSchema = new mongoose.Schema({
//   // Auto-generated Member ID (e.g., MEM-CLUB-0001)
//   memberId: {
//     type: String,
//     unique: true,
//     index: true
//   },

//   // Personal Information
//   name: {
//     type: String,
//     required: [true, 'Full name is required'],
//     trim: true
//   },
//   mobile: {
//     type: String,
//     required: [true, 'Mobile number is required'],
//     trim: true,
//     match: [/^\d{10}$/, 'Mobile must be a valid 10-digit number'],
//     // unique: true
//   },
//   email: {
//     type: String,
//     trim: true,
//     match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
//   },
//   age: {
//     type: Number,
//     min: [0, 'Age cannot be negative'],
//     max: [120, 'Age cannot exceed 120']
//   },
//   gender: {
//     type: String,
//     enum: ['Male', 'Female', 'Other'],
//     required: [true, 'Gender is required']
//   },
//   address: {
//     type: String,
//     trim: true
//   },
//  responsibleStaff: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'Staff',
//   default: null

//   },
//   photo: {
//     type: String // Path to uploaded image (e.g., /uploads/members/abc123.jpg)
//   },

//   // Membership & Activity
//   activity: {
//     type: String,
//     required: [true, 'Activity is required'],
//     trim: true
//   },
//   plan: {
//     type: String,
//     enum: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly'],
//     default: 'Monthly'
//   },
//   membershipStatus: {
//     type: String,
//     enum: ['Active', 'Inactive'],
//     default: 'Active'
//   },
//   status: {
//     type: String,
//     enum: ['Active', 'Inactive'],
//     default: 'Active'
//   },
//   startDate: {
//     type: Date,
//     required: [true, 'Start date is required']
//   },
//   endDate: {
//     type: Date
//   },

//   // Plan & Fee Details
//   planDuration: {
//     type: String,
//     enum: ['1 Month', '3 Months', '6 Months', '12 Months'],
//     default: '1 Month'
//   },
//   planFee: {
//     type: Number,
//     min: [0, 'Plan fee cannot be negative'],
//     default: 0
//   },
//   discount: {
//     type: Number,
//     min: [0, 'Discount cannot be negative'],
//     default: 0
//   },
//   finalAmount: {
//     type: Number,
//     min: [0, 'Final amount cannot be negative'],
//     default: 0
//   },
//   paymentDate: {
//     type: Date
//   },
//   planNotes: {
//     type: String,
//     trim: true
//   },

//   // Login Details (stored directly in member - no User model linkage as per requirement)
//   userId: {
//     type: String,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required']
//   },

//   // Link to enquiry (optional - for "Add from Enquiry" feature)
//   enquiryId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'FitnessEnquiry',
//     default: null
//   },

//   // Organization & timestamps
//   organizationId: {
//     type: String,
//     required: [true, 'Organization ID is required'],
//     index: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // Pre-save: Generate memberId if not provided
// fitnessMemberSchema.pre('save', async function (next) {
//   this.updatedAt = Date.now();

//   if (!this.memberId) {
//     const count = await mongoose.model('FitnessMember').countDocuments({
//       organizationId: this.organizationId
//     });
//     const seq = (count + 1).toString().padStart(4, '0');
//     this.memberId = `MEM-CLUB-${seq}`;
//   }

//   // Auto-calculate finalAmount if not set
//   if (this.planFee !== undefined && this.discount !== undefined) {
//     this.finalAmount = Math.max(0, this.planFee - this.discount);
//   }

//   next();
// });


// // ✅ Add this compound unique index (Best Practice)
// fitnessMemberSchema.index(
//   { organizationId: 1, mobile: 1 }, 
//   { unique: true }
// );

// // Indexes for performance
// fitnessMemberSchema.index({ organizationId: 1, status: 1 });
// // fitnessMemberSchema.index({ organizationId: 1, mobile: 1 });
// fitnessMemberSchema.index({ organizationId: 1, memberId: 1 });
// fitnessMemberSchema.index({ name: 'text' }); // name field is used
// fitnessMemberSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('FitnessMember', fitnessMemberSchema);










const mongoose = require('mongoose');

// ── Sub-schema for each activity + fee entry ──────────────────────────────
const activityFeeSchema = new mongoose.Schema({
  activity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessActivity',
    default: null,
    validate: {
    validator: function(v) {
      // Required only when feeType (membership pass) is not set
      if (!this.feeType && !v) return false;
      return true;
    },
    message: 'Activity is required when no membership pass is selected.',
  }
    // required: [true, 'Activity is required for each entry'],
  },
  feeType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessFeeType',
    default: null,
  },
  plan: {
    type: String,
    enum: ['Annual', 'halfYearly', 'quarterly', 'Monthly', 'Weekly', 'Daily', 'Hourly'],   // ← Updated
    default: 'Monthly',
  },
  planFee: { type: Number, default: 0, min: [0, 'Plan fee cannot be negative'] },
  discount: { type: Number, default: 0, min: [0, 'Discount cannot be negative'] },
  finalAmount: { type: Number, default: 0, min: [0, 'Final amount cannot be negative'] },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Paid',
  },
 paymentMode: {
  type: String,
  enum: ['Cash', 'Bank Transfer', ''],
  default: '',
},
  paymentDate: { type: Date, default: null },
  planNotes: { type: String, trim: true, default: '' },
  startDate: {
    type: Date,
    required: [true, 'Start date is required for each activity'],
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required for each activity'],
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Inactive',
  },
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessStaff',
    default: null,
  },

  slot: {
    slotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FitnessSlot',
      default: null,
    },
    label: {
      type: String,
      default: '',
    },
  },

  // Reference to auto-created fee allotment (for Allot Fees / Add Payments sync)
  allotmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessFeeAllotment',
    default: null,
  },
}, { _id: true });

// ── Main member schema ────────────────────────────────────────────────────
const fitnessMemberSchema = new mongoose.Schema({
  memberId: { type: String, unique: true, index: true },

  // Personal
  name: { type: String, required: [true, 'Full name is required'], trim: true },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^\d{10}$/, 'Mobile must be a valid 10-digit number'],
  },
  email: {
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  age: { type: Number, min: [1, 'Age must be at least 1'], max: [120, 'Age cannot exceed 120'] },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: [true, 'Gender is required'] },
  address: { type: String, trim: true },
  photo: { type: String },

  // Activities & fees (new multi-activity structure)
  activityFees: { type: [activityFeeSchema], default: [] },

  // Overall membership status (computed from activityFees)
  membershipStatus: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Inactive',
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },

  // Login
  userId: { type: String, trim: true },
  password: { type: String, required: [true, 'Password is required'] },

  // Link to enquiry
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FitnessEnquiry',
    default: null,
  },

  membershipPass: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'FitnessFeeType',
  default: null,
},
numberOfPersons: {
  type: Number,
  default: 1
},

qrCode: {
  type: String,
  default: ""
},

  organizationId: { type: String, required: [true, 'Organization ID is required'], index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ── Pre-save hooks ────────────────────────────────────────────────────────
// fitnessMemberSchema.pre('save', async function (next) {
//   this.updatedAt = Date.now();

//   // Auto-generate memberId
//   if (!this.memberId) {
//     const count = await mongoose.model('FitnessMember').countDocuments({
//       organizationId: this.organizationId,
//     });
//     const seq = (count + 1).toString().padStart(4, '0');
//     this.memberId = `MEM-CLUB-${seq}`;
//   }

//   // Recompute finalAmount and membershipStatus for each activityFee entry
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);

//   let anyActive = false;

//   for (const af of this.activityFees) {
//     // Auto-calc final amount
//     const fee  = Number(af.planFee)  || 0;
//     const disc = Number(af.discount) || 0;
//     af.finalAmount = Math.max(0, fee - disc);

//     // Activity-level status: active only if today is between start/end AND payment is Paid
//     if (af.startDate && af.endDate) {
//       const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
//       const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);
//       const withinDates = today >= start && today <= end;
//       const paid        = af.paymentStatus === 'Paid';
//       af.membershipStatus = (withinDates && paid) ? 'Active' : 'Inactive';
//       if (af.membershipStatus === 'Active') anyActive = true;
//     } else {
//       af.membershipStatus = 'Inactive';
//     }
//   }

//   // Overall membership status = Active if ANY activity is active
//   this.membershipStatus = anyActive ? 'Active' : 'Inactive';

//   next();
// });

fitnessMemberSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();

  // Only generate memberId if it's a NEW document
  if (this.isNew && !this.memberId) {
    // const count = await mongoose.model('FitnessMember').countDocuments({
    //   organizationId: this.organizationId,
    // });
    // const seq = (count + 1).toString().padStart(4, '0');
    // this.memberId = `MEM-CLUB-${seq}`;

    const lastMember = await mongoose.model('FitnessMember')
  .findOne({ organizationId: this.organizationId })
  .sort({ createdAt: -1 });

let nextNumber = 1;

if (lastMember && lastMember.memberId) {
  const lastNum = parseInt(lastMember.memberId.split('-').pop());
  if (!isNaN(lastNum)) {
    nextNumber = lastNum + 1;
  }
}

this.memberId = `MEM-CLUB-${String(nextNumber).padStart(4, '0')}`;
  }

  // Rest of your status computation logic...
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let anyActive = false;

  for (const af of this.activityFees) {
    const fee  = Number(af.planFee)  || 0;
    const disc = Number(af.discount) || 0;
    af.finalAmount = Math.max(0, fee - disc);

    if (af.startDate && af.endDate) {
      const start = new Date(af.startDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(af.endDate);   end.setHours(23, 59, 59, 999);
      const withinDates = today >= start && today <= end;
      const paid = af.paymentStatus === 'Paid';
      af.membershipStatus = (withinDates && paid) ? 'Active' : 'Inactive';
      if (af.membershipStatus === 'Active') anyActive = true;
    } else {
      af.membershipStatus = 'Inactive';
    }
  }

  this.membershipStatus = anyActive ? 'Active' : 'Inactive';

  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────
fitnessMemberSchema.index({ organizationId: 1, mobile: 1 }, { unique: true });
fitnessMemberSchema.index({ organizationId: 1, status: 1 });
fitnessMemberSchema.index({ organizationId: 1, memberId: 1 });
fitnessMemberSchema.index({ name: 'text' });
fitnessMemberSchema.index({ createdAt: -1 });

module.exports = mongoose.model('FitnessMember', fitnessMemberSchema);