const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({

  // ── Login Details ────────────────────────────────────────────────────────────
  employeeId: {
    type: String,
    unique: true          // auto-generated, e.g. EMP-00127
  },
  loginId: {
    type: String,
    unique: true,
    trim: true            // mobile or email used to log in
  },
  password: {
    type: String,
    default: 'EMP@1234'  // auto-generated default; should be hashed in production
  },

  // ── Basic Information ────────────────────────────────────────────────────────
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  // References the StaffRole collection (NOT the User.role enum)
  role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
    },
  // References the EmploymentType collection
  employmentType: {
    type: String,
    // ref: 'EmploymentType'
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dob: {
    type: Date
  },
  joiningDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  salary: {
    type: Number       // optional
  },
  photo: {
    type: String       // URL to uploaded photo
  },

  // ── Address ──────────────────────────────────────────────────────────────────
  fullAddress: {
    type: String
  },

  // ── Emergency Contact ────────────────────────────────────────────────────────
  emergencyContactName: {
    type: String
  },
  emergencyContactRelation: {
    type: String
  },
  emergencyContactMobile: {
    type: String
  },

  // ── System Fields ────────────────────────────────────────────────────────────
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

// ── Auto-generate Employee ID before first save ───────────────────────────────
staffSchema.pre('save', async function (next) {
  this.updatedAt = Date.now();

  if (!this.employeeId) {
    // Count existing staff and pad to get EMP-00123 style IDs
    const count = await mongoose.model('Staff').countDocuments();
    const padded = String(count + 1).padStart(5, '0');
    this.employeeId = `EMP-${padded}`;
  }

  next();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
staffSchema.index({ organizationId: 1, status: 1 });
staffSchema.index({ organizationId: 1, role: 1 });
staffSchema.index({ fullName: 'text' });
staffSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Staff', staffSchema);