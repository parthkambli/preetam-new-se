const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Student', 'Participant', 'Admin'],
    default: 'Student'
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  userType: {
    type: String,
    enum: ['school', 'fitness'],
    required: true
  },
  linkedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    description: 'References Student or Admission _id'
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
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
// Note: userId and mobile already have unique: true which creates indexes
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, userType: 1 });
userSchema.index({ linkedId: 1 });

module.exports = mongoose.model('User', userSchema);
