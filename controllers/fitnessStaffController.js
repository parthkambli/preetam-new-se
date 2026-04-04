// controllers/staff.controller.js

const Staff = require("../models/FitnessStaff");
const Role = require("../models/FitnessStaffRole");
const EmploymentType = require("../models/FitnessStaffEmpType");
const mongoose = require("mongoose");


// ─────────────────────────────────────────────────────────────
// 🔥 COMMON ERROR HANDLER
const handleError = (res, err, message = 'Server error') => {
  console.error('[FitnessStaff Error]', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      field
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  res.status(500).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};


// ─────────────────────────────────────────────────────────────
// 🔥 VALIDATION FUNCTION
const validateStaff = (data) => {
  const errors = [];

  if (!data.fullName?.trim()) {
    errors.push('Full name is required');
  }

  if (!data.mobile?.trim()) {
    errors.push('Mobile is required');
  } else if (!/^\d{10}$/.test(data.mobile)) {
    errors.push('Mobile must be 10 digits');
  }

  if (!data.role) {
    errors.push('Role is required');
  }

  if (!data.employmentType) {
    errors.push('Employment type is required');
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email');
  }

  return errors;
};


// ─────────────────────────────────────────────────────────────
// 🔥 CREATE STAFF
exports.createFitnessStaff = async (req, res) => {
  try {
    const data = req.body;

    // ✅ Validate input
    const errors = validateStaff(data);
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // ✅ Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(data.role)) {
      return res.status(400).json({ success: false, message: 'Invalid role ID' });
    }

    if (!mongoose.Types.ObjectId.isValid(data.employmentType)) {
      return res.status(400).json({ success: false, message: 'Invalid employment type ID' });
    }

    // ✅ Check role exists
    const roleExists = await Role.findById(data.role);
    if (!roleExists) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    // ✅ Check type exists
    const typeExists = await EmploymentType.findById(data.employmentType);
    if (!typeExists) {
      return res.status(404).json({ success: false, message: 'Employment type not found' });
    }

    // ✅ Photo validation
    let photoUrl = '';
    if (req.file) {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Only JPG, PNG, WEBP allowed'
        });
      }

      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Image must be < 2MB'
        });
      }

      photoUrl = `/uploads/staff/${req.file.filename}`;
    }

    // ✅ Generate employee ID
    const count = await Staff.countDocuments();
    const employeeId = 'EMP' + String(count + 1).padStart(4, '0');

    // ✅ Create
    const staff = await Staff.create({
      ...data,
      employeeId,
      photo: photoUrl,
      fullName: data.fullName.trim(),
      mobile: data.mobile.trim(),
      organizationId: req.organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to create staff');
  }
};


// ─────────────────────────────────────────────────────────────
// 🔥 GET ALL STAFF
exports.getFitnessStaff = async (req, res) => {
  try {
    const query = { organizationId: req.organizationId };

    const staff = await Staff.find(query)
      .populate('role', 'name')
      .populate('employmentType', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to fetch staff');
  }
};


// ─────────────────────────────────────────────────────────────
// 🔥 GET STAFF BY ID
exports.getFitnessStaffById = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    })
      .populate('role', 'name')
      .populate('employmentType', 'name');

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to fetch staff');
  }
};


// ─────────────────────────────────────────────────────────────
// 🔥 UPDATE STAFF
exports.updateFitnessStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    const updates = { ...req.body };

    // ✅ Validate
    const errors = validateStaff({ ...staff.toObject(), ...updates });
    if (errors.length) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // ✅ Photo update
    if (req.file) {
      const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid image type'
        });
      }

      updates.photo = `/uploads/staff/${req.file.filename}`;
    }

    // ❌ Prevent critical overwrite
    ['_id', 'organizationId', 'employeeId', 'createdAt'].forEach(f => delete updates[f]);

    Object.assign(staff, updates);
    await staff.save();

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to update staff');
  }
};


// ─────────────────────────────────────────────────────────────
// 🔥 DELETE STAFF
exports.deleteFitnessStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found'
      });
    }

    res.json({
      success: true,
      message: 'Staff deleted successfully'
    });

  } catch (err) {
    handleError(res, err, 'Failed to delete staff');
  }
};