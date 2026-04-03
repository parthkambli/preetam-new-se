// controllers/staffController.js
const Staff = require('../models/Staff');
const User = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// Common error handler
// This function is called whenever something goes wrong.
// It checks the type of error and sends back a helpful message.
const handleError = (res, err, customMessage = 'Server error') => {
  console.error('[StaffController Error]', err);

  // Mongoose validation error — e.g. a required field is missing
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed. Please check your inputs.', 
      errors 
    });
  }

  // MongoDB duplicate key — mobile or loginId already exists
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    let friendlyMessage = `A record with this ${field} already exists.`;
    
    if (field === 'mobile') {
      friendlyMessage = 'This mobile number is already registered to another staff member.';
    } else if (field === 'loginId') {
      friendlyMessage = 'This Login ID is already taken. Please use a different one.';
    } else if (field === 'email') {
      friendlyMessage = 'This email address is already registered.';
    }

    return res.status(409).json({ 
      success: false,
      message: friendlyMessage,
      field  // tells frontend which field caused the issue
    });
  }

  // Invalid MongoDB ObjectId — e.g. URL has a typo in the ID
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false,
      message: 'Invalid ID format. Please check the URL.' 
    });
  }

  // Generic server error
  res.status(500).json({ 
    success: false,
    message: customMessage,
    // Only show raw error details in development, not production
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Server-side validation helper
 * Run this before creating or updating a staff member.
 * Returns an array of error messages, empty array if all valid.
 */
const validateStaffData = (data) => {
  const errors = [];

  if (!data.fullName?.trim()) {
    errors.push('Full name is required.');
  } else if (data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  }

  if (!data.mobile?.trim()) {
    errors.push('Mobile number is required.');
  } else if (!/^\d{10}$/.test(data.mobile.trim())) {
    errors.push('Mobile number must be exactly 10 digits.');
  }

  if (!data.role) {
    errors.push('Role is required.');
  }

  if (data.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.push('Email address is not valid.');
  }

  if (data.salary !== undefined && data.salary !== '' && data.salary !== null) {
    const salaryNum = Number(data.salary);
    if (isNaN(salaryNum) || salaryNum < 0) {
      errors.push('Salary must be a positive number.');
    }
  }

  return errors;
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Get all staff
 */
exports.getAllStaff = async (req, res) => {
  try {
    const { name, mobile, role, employmentType, status } = req.query;

    const query = { organizationId: req.organizationId };

    if (name) query.fullName = { $regex: name, $options: 'i' };
    if (mobile) query.mobile = { $regex: mobile, $options: 'i' };
    if (role) query.role = role;
    if (employmentType) query.employmentType = employmentType;
    if (status) query.status = status;

    const staff = await Staff.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: staff.length,
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to fetch staff members. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Get single staff by ID
 */
exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    }).lean();

    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: 'Staff member not found. They may have been deleted.' 
      });
    }

    res.json({
      success: true,
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to fetch staff details. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Create new staff
 */
exports.createStaff = async (req, res) => {
  try {
    const data = req.body;

    // Run server-side validation
    const validationErrors = validateStaffData(data);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your inputs.',
        errors: validationErrors
      });
    }

    // Check file size if a photo was uploaded
    // (This is a backup — frontend validates too, but backend must also validate)
    if (req.file) {
      const maxSizeBytes = 2 * 1024 * 1024; // 2MB
      if (req.file.size > maxSizeBytes) {
        return res.status(413).json({
          success: false,
          message: `Photo is too large (${(req.file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 2MB.`
        });
      }

      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPG, PNG, or WebP images are allowed.'
        });
      }
    }

    let photoUrl = '';
    if (req.file) {
      photoUrl = `/uploads/staff/${req.file.filename}`;
    }

    const staff = new Staff({
      ...data,
      photo: photoUrl,
      organizationId: req.organizationId,
      fullName: data.fullName.trim(),
      mobile: data.mobile.trim(),
    });

    await staff.save();

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully.',
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to create staff member. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Update staff by ID
 */
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: 'Staff member not found. They may have been deleted.' 
      });
    }

    const updates = { ...req.body };

    // Validate the incoming data
    const validationErrors = validateStaffData({ ...staff.toObject(), ...updates });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors
      });
    }

    // Validate photo if uploaded
    if (req.file) {
      const maxSizeBytes = 2 * 1024 * 1024;
      if (req.file.size > maxSizeBytes) {
        return res.status(413).json({
          success: false,
          message: `Photo is too large (${(req.file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 2MB.`
        });
      }

      const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only JPG, PNG, or WebP images are allowed.'
        });
      }

      updates.photo = `/uploads/staff/${req.file.filename}`;
    }

    // These fields must never be changed after creation
    const forbiddenFields = ['_id', 'organizationId', 'createdAt', 'employeeId'];
    forbiddenFields.forEach(field => delete updates[field]);

    Object.assign(staff, updates);
    await staff.save();

    res.json({
      success: true,
      message: 'Staff updated successfully.',
      data: staff
    });

  } catch (err) {
    handleError(res, err, 'Failed to update staff member. Please try again.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * @desc    Delete staff by ID
 */
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.organizationId
    });

    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: 'Staff member not found. They may have already been deleted.' 
      });
    }

    // Also delete their login account
    await User.findOneAndDelete({ linkedId: staff._id });

    res.json({
      success: true,
      message: 'Staff member and their login account deleted successfully.'
    });

  } catch (err) {
    handleError(res, err, 'Failed to delete staff member. Please try again.');
  }
};