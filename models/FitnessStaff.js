// const mongoose = require('mongoose');

// const fitnessStaffSchema = new mongoose.Schema({

//   // ── Login Details ────────────────────────────────────────────────────────────
//   employeeId: {
//     type: String,
//     unique: true          // auto-generated, e.g. EMP-00127
//   },
//   loginId: {
//     type: String,
//     unique: true,
//     trim: true            // mobile or email used to log in
//   },
//   password: {
//     type: String,
//     default: 'EMP@1234'  // auto-generated default; should be hashed in production
//   },

//   // ── Basic Information ────────────────────────────────────────────────────────
//   fullName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   // References the StaffRole collection (NOT the User.role enum)
//   role: {
//     type: String,
//     // ref: 'StaffRole'
//   },
//   // References the EmploymentType collection
//   employmentType: {
//     type: String,
//     // ref: 'EmploymentType'
//   },
//   mobile: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     trim: true
//   },
//   gender: {
//     type: String,
//     enum: ['Male', 'Female', 'Other'],
//     default: 'Male'
//   },
//   dob: {
//     type: Date
//   },
//   joiningDate: {
//     type: Date
//   },
//   status: {
//     type: String,
//     enum: ['Active', 'Inactive'],
//     default: 'Active'
//   },
//   salary: {
//     type: Number       // optional
//   },
//   photo: {
//     type: String       // URL to uploaded photo
//   },

//   // ── Address ──────────────────────────────────────────────────────────────────
//   fullAddress: {
//     type: String
//   },

//   // ── Emergency Contact ────────────────────────────────────────────────────────
//   emergencyContactName: {
//     type: String
//   },
//   emergencyContactRelation: {
//     type: String
//   },
//   emergencyContactMobile: {
//     type: String
//   },

//   // ── System Fields ────────────────────────────────────────────────────────────

//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// // ── Auto-generate Employee ID before first save ───────────────────────────────
// fitnessStaffSchema.pre('save', async function (next) {
//   this.updatedAt = Date.now();

//   if (!this.employeeId) {
//     // Count existing staff and pad to get EMP-00123 style IDs
//     const count = await mongoose.model('Staff').countDocuments();
//     const padded = String(count + 1).padStart(5, '0');
//     this.employeeId = `EMP-${padded}`;
//   }

//   next();
// });

// // ── Indexes ───────────────────────────────────────────────────────────────────
// fitnessStaffSchema.index({ organizationId: 1, status: 1 });
// fitnessStaffSchema.index({ organizationId: 1, role: 1 });
// fitnessStaffSchema.index({ fullName: 'text' });
// fitnessStaffSchema.index({ createdAt: -1 });

// module.exports = mongoose.model('fitnessStaff', fitnessStaffSchema);









/**
 * FitnessStaff Mongoose Model
 * Represents a fitness staff member with all personal, professional, and emergency details.
 */

const mongoose = require("mongoose");

const fitnessStaffSchema = new mongoose.Schema(
  {
    // ─── Profile ───────────────────────────────────────────────────────────────
    profilePhoto: {
      type: String,
      default: null,
      trim: true,
    },

    // ─── Personal Information ──────────────────────────────────────────────────
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true,
    },

    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      index: true,
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["Male", "Female", "Other"],
        message: "Gender must be Male, Female, or Other",
      },
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    // ─── Employment Details ────────────────────────────────────────────────────
    joiningDate: {
      type: Date,
      required: [true, "Joining date is required"],
      index: true,
    },

    employmentType: {
      type: String,
      enum: {
        values: ["Full Time", "Part Time", "Contract"],
        message: "Employment type must be Full Time, Part Time, or Contract",
      },
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ["Active", "Inactive", "Terminated"],
        message: "Status must be Active, Inactive, or Terminated",
      },
      default: "Active",
      index: true,
    },

    salary: {
      type: Number,
      min: [0, "Salary cannot be negative"],
      default: null,
    },

    // ─── Login / Contact ───────────────────────────────────────────────────────
    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required (used as Login ID)"],
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },

    emailId: {
      type: String,
      unique: true,
      sparse: true,          // allows multiple null values despite unique index
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
      default: null,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    // ─── Address ───────────────────────────────────────────────────────────────
    fullAddress: {
      type: String,
      trim: true,
      default: null,
    },

    // ─── Emergency Contact ─────────────────────────────────────────────────────
    emergencyContactName: {
      type: String,
      trim: true,
      default: null,
    },

    emergencyRelation: {
      type: String,
      trim: true,
      default: null,
    },

    emergencyContactMobile: {
      type: String,
      trim: true,
      match: [/^\d{10,15}$/, "Emergency mobile number must be 10–15 digits"],
      default: null,
    },
  },
  {
    timestamps: true,   // adds createdAt and updatedAt automatically
    strict: true,       // reject fields not defined in schema
  }
);

// ─── Compound / Additional Indexes ──────────────────────────────────────────
// mobileNumber and emailId already have unique: true (creates unique index)
// Extra indexes for common query patterns:
fitnessStaffSchema.index({ fullName: "text", role: "text" }); // full-text search support
fitnessStaffSchema.index({ status: 1, joiningDate: -1 });     // list active staff by date

const FitnessStaff = mongoose.model("FitnessStaff", fitnessStaffSchema);

module.exports = FitnessStaff;