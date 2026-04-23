const mongoose = require('mongoose');

const accessRoleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  roleKey: {
    type: String,
    required: true,
    unique: true, // e.g. FITNESS_STAFF, ADMIN, etc.
  },
  permissions: {
    type: [String],
    default: [],
  },
  organizationId: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AccessRole', accessRoleSchema);