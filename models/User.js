// const mongoose = require('mongoose');

// // const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['Student', 'Participant', 'Admin', 'SchoolStaff', 'FitnessStaff'],
//     default: 'Student'
//   },
//   mobile: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   fullName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   userType: {
//     type: String,
//     enum: ['school', 'fitness'],
//     required: true
//   },
//   linkedId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     description: 'References Student or Admission _id'
//   },
//   isActive: {
//     type: String,
//     enum: ['Yes', 'No'],
//     default: 'Yes'
//   },
//   organizationId: {
//     type: String,
//     required: true
//   },
//   staffId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Staff'
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

// userSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Indexes for better query performance
// // Note: userId and mobile already have unique: true which creates indexes
// userSchema.index({ organizationId: 1, role: 1 });
// userSchema.index({ organizationId: 1, userType: 1 });
// userSchema.index({ linkedId: 1 });

// // Prevent model overwrite by checking if it already exists
// module.exports = mongoose.models.User || mongoose.model('User', userSchema);












// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   userId: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['Student', 'Participant', 'Admin', 'SchoolStaff', 'FitnessStaff'],
//     default: 'Student'
//   },
//   mobile: {
//     type: String,
//     required: true,
//     unique: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     trim: true,
//     lowercase: true,
//     sparse: true,       // allows multiple null/empty values with unique index
//     unique: true,
//     default: null
//   },
//   fullName: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   userType: {
//     type: String,
//     enum: ['school', 'fitness'],
//     required: true
//   },
//   linkedId: {
//     type: mongoose.Schema.Types.ObjectId,
//     required: true,
//     description: 'References Student or Admission _id'
//   },
//   isActive: {
//     type: String,
//     enum: ['Yes', 'No'],
//     default: 'Yes'
//   },
//   organizationId: {
//     type: String,
//     required: true
//   },
//   staffId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Staff'
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

// userSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   // Store empty string email as null so sparse unique index works correctly
//   if (this.email === '') this.email = null;
//   next();
// });

// // Indexes for better query performance
// // Note: userId, mobile, email already have unique: true which creates indexes
// userSchema.index({ organizationId: 1, role: 1 });
// userSchema.index({ organizationId: 1, userType: 1 });
// userSchema.index({ linkedId: 1 });

// module.exports = mongoose.models.User || mongoose.model('User', userSchema);






























const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    trim: true
    // NO unique:true here — compound index neeche hai
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Student', 'Participant', 'Admin', 'SchoolStaff', 'FitnessStaff'],
    default: 'Student'
  },
  mobile: {
    type: String,
    required: true,
    trim: true
    // NO unique:true here — compound index neeche hai
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    default: null
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  userType: {
    type: String,
    enum: ['school', 'fitness', 'member'],
    required: true
  },
  linkedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    description: 'References Student, Admission, or FitnessMember _id'
  },
  isActive: {
    type: String,
    enum: ['Yes', 'No'],
    default: 'Yes'
  },
  organizationId: {
    type: String,
    required: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff'
  },
  accessRoleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AccessRole',
    default: null
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

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.email === '') this.email = null;
  next();
});

// userId unique per organization
userSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

// mobile unique per organization  
userSchema.index({ mobile: 1, organizationId: 1 }, { unique: true });

// email global sparse unique
userSchema.index({ email: 1 }, { unique: true, sparse: true });

// query performance
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, userType: 1 });
userSchema.index({ linkedId: 1 });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);