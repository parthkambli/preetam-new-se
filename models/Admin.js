const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
  fullName: {
    type: String,
    required: true
  },
  allowedOrganizations: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    label: { type: String, required: true }
  }],
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Admin', adminSchema);
