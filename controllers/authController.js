const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * @desc    Authenticate admin user and generate JWT token
 * @route   POST /api/auth/login
 * @access  Public
 * @body    { userId: string, password: string }
 * @returns { token, organizations, defaultOrg, user }
 */
exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    // Validate input
    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    // Find admin by userId
    const admin = await Admin.findOne({ userId });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin._id,
        userId: admin.userId,
        organizations: admin.allowedOrganizations
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send response
    res.json({
      token,
      organizations: admin.allowedOrganizations,
      defaultOrg: admin.allowedOrganizations[0],
      user: {
        id: admin._id,
        userId: admin.userId,
        fullName: admin.fullName,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Get current authenticated admin information
 * @route   GET /api/auth/me
 * @access  Private (Requires JWT token)
 * @returns { user, organizations }
 */
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    
    res.json({
      user: {
        id: admin._id,
        userId: admin.userId,
        fullName: admin.fullName,
        role: admin.role
      },
      organizations: admin.allowedOrganizations
    });
  } catch (err) {
    console.error('Get me error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};
