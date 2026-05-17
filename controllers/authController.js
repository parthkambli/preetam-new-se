











///// NEW  

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const User = require('../models/User');

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isMobile = (value) => /^\d{10,15}$/.test(value);

const buildUserIdentifierFilter = (identifier) => {
  if (isEmail(identifier)) {
    return { email: identifier.toLowerCase().trim(), isActive: 'Yes' };
  }
  if (isMobile(identifier)) {
    return { mobile: identifier.trim(), isActive: 'Yes' };
  }
  return { userId: identifier.trim(), isActive: 'Yes' };
};

exports.login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    // ── 1. Admin check ─────────────────────────────────────────────────────
    const admin = await Admin.findOne({ userId });
    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const token = jwt.sign(
        {
          id: admin._id,
          userId: admin.userId,
          organizations: admin.allowedOrganizations
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.json({
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
    }

    // ── 2. Staff / User check ──────────────────────────────────────────────
    const filter = buildUserIdentifierFilter(userId);
    const user = await User.findOne(filter)
      .populate('staffId')
      .populate('accessRoleId', 'name permissions') // ✅ CRITICAL
      .lean();

    if (user) {
      // Block Participant login from web
      if (
        req.headers['x-platform'] === 'web' &&
        user.role === 'Participant'
      ) {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const organizations = [];
      if (user.organizationId === 'school') {
        organizations.push({
          id: 'school',
          name: 'Preetam Senior Citizen School',
          label: 'Senior Citizen School'
        });
      } else if (user.organizationId === 'fitness') {
        organizations.push({
          id: 'fitness',
          name: 'Sport Fitness Club',
          label: 'Sport Fitness Club'
        });
      }

      const defaultOrg = organizations[0];
      const token = jwt.sign(
        {
          id: user._id,
          userId: user.userId,
          role: user.role,
          organizationId: user.organizationId
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        organizations,
        defaultOrg,
        user: {
          id: user._id,
          userId: user.userId,
          fullName: user.fullName,
          role: user.role,
          userType: user.userType,
          organizationId: user.organizationId,
          staffId: user.staffId,

          // 🔥 ADD THESE
          accessRoleId: user.accessRoleId || null,
          customPermissions: user.customPermissions || [],
          removedPermissions: user.removedPermissions || []
        }
      });
    }

    // ── 3. FitnessMember direct check (fallback) ───────────────────────────
    const FitnessMember = require('../models/FitnessMember');

    const memberFilter = isMobile(userId)
      ? { mobile: userId.trim() }
      : { userId: userId.trim() };

    const member = await FitnessMember.findOne(memberFilter);

    if (member) {

      // Block member login from web
      if (req.headers['x-platform'] === 'web') {
        return res.status(401).json({
          message: 'Invalid credentials'
        });
      }

      // Support both plain text (old) and bcrypt hashed (new) passwords
      let match = false;
      if (member.password.startsWith('$2')) {
        match = await bcrypt.compare(password, member.password);
      } else {
        match = (password === member.password);
      }

      if (!match) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const organizations = [{
        id: 'fitness',
        name: 'Sport Fitness Club',
        label: 'Sport Fitness Club'
      }];
      const defaultOrg = organizations[0];

      const token = jwt.sign(
        {
          id: member._id,
          userId: member.userId || member.mobile,
          role: 'Participant',
          organizationId: 'fitness',
          userType: 'member',
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        organizations,
        defaultOrg,
        user: {
          id: member._id,
          userId: member.userId || member.mobile,
          fullName: member.name,
          role: 'Participant',
          userType: 'member',
          organizationId: 'fitness',
        }
      });
    }

    // ── 4. Nothing matched ─────────────────────────────────────────────────
    return res.status(401).json({ message: 'Invalid credentials' });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

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







exports.memberMobileLogin = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        message: 'Mobile number is required'
      });
    }

    // Optional mobile validation
    if (!/^\d{10,15}$/.test(mobile)) {
      return res.status(400).json({
        message: 'Invalid mobile number'
      });
    }

    const FitnessMember = require('../models/FitnessMember');

    // Find member by mobile
    const member = await FitnessMember.findOne({
      mobile: mobile.trim()
    });

    if (!member) {
      return res.status(404).json({
        message: 'Member not found'
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: member._id,
        userId: member.userId || member.mobile,
        role: 'Participant',
        organizationId: 'fitness',
        userType: 'member',
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // mobile app should usually use longer expiry
    );

    return res.json({
      success: true,
      token,
      user: {
        id: member._id,
        userId: member.userId || member.mobile,
        fullName: member.name,
        mobile: member.mobile,
        role: 'Participant',
        userType: 'member',
        organizationId: 'fitness',
      }
    });

  } catch (err) {
    console.error('Member mobile login error:', err);

    res.status(500).json({
      message: 'Server error during member login'
    });
  }
};