// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const Admin = require('../models/Admin');
// const User = require('../models/User');

// /**
//  * @desc    Authenticate admin user and generate JWT token
//  * @route   POST /api/auth/login
//  * @access  Public
//  * @body    { userId: string, password: string }
//  * @returns { token, organizations, defaultOrg, user }
//  */
// exports.login = async (req, res) => {
//   try {
//     const { userId, password } = req.body;

//     // Validate input
//     if (!userId || !password) {
//       return res.status(400).json({ message: 'User ID and password are required' });
//     }

//     // Try to find admin first
//     const admin = await Admin.findOne({ userId });
//     if (admin) {
//       // Admin authentication
//       const match = await bcrypt.compare(password, admin.password);
//       if (!match) {
//         return res.status(401).json({ message: 'Invalid credentials' });
//       }

//       // Generate JWT token for admin
//       const token = jwt.sign(
//         {
//           id: admin._id,
//           userId: admin.userId,
//           organizations: admin.allowedOrganizations
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: '24h' }
//       );

//       return res.json({
//         token,
//         organizations: admin.allowedOrganizations,
//         defaultOrg: admin.allowedOrganizations[0],
//         user: {
//           id: admin._id,
//           userId: admin.userId,
//           fullName: admin.fullName,
//           role: admin.role
//         }
//       });
//     }

//     // Try to find staff user
//     const user = await User.findOne({ userId, isActive: 'Yes' })
//       .populate('staffId');

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Staff authentication
//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Generate organizations based on staff role
//     const organizations = [];
//     if (user.organizationId === 'school') {
//       organizations.push({ 
//         id: 'school', 
//         name: 'Preetam Senior Citizen School',
//         label: 'Senior Citizen School'
//       });
//     } else if (user.organizationId === 'fitness') {
//       organizations.push({ 
//         id: 'fitness', 
//         name: 'Sport Fitness Club',
//         label: 'Sport Fitness Club'
//       });
//     }

//     const defaultOrg = organizations[0];

//     // Generate JWT token for staff
//     const token = jwt.sign(
//       {
//         id: user._id,
//         userId: user.userId,
//         role: user.role,
//         organizationId: user.organizationId
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     res.json({
//       token,
//       organizations,
//       defaultOrg,
//       user: {
//         id: user._id,
//         userId: user.userId,
//         fullName: user.fullName,
//         role: user.role,
//         userType: user.userType,
//         organizationId: user.organizationId,
//         staffId: user.staffId
//       }
//     });

//   } catch (err) {
//     console.error('Login error:', err.message);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// };

// /**
//  * @desc    Get current authenticated admin information
//  * @route   GET /api/auth/me
//  * @access  Private (Requires JWT token)
//  * @returns { user, organizations }
//  */
// exports.getMe = async (req, res) => {
//   try {
//     const admin = await Admin.findById(req.admin.id).select('-password');
    
//     res.json({
//       user: {
//         id: admin._id,
//         userId: admin.userId,
//         fullName: admin.fullName,
//         role: admin.role
//       },
//       organizations: admin.allowedOrganizations
//     });
//   } catch (err) {
//     console.error('Get me error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// };



/// OLD





// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const Admin = require('../models/Admin');
// const User = require('../models/User');

// /**
//  * Determines whether a given string looks like an email address.
//  */
// const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// /**
//  * Determines whether a given string looks like a mobile number (digits only, 10–15 chars).
//  */
// const isMobile = (value) => /^\d{10,15}$/.test(value);

// /**
//  * Build a Mongoose query filter that matches userId, email, or mobile
//  * depending on the shape of the identifier the user supplied.
//  */
// const buildUserIdentifierFilter = (identifier) => {
//   if (isEmail(identifier)) {
//     return { email: identifier.toLowerCase().trim(), isActive: 'Yes' };
//   }
//   if (isMobile(identifier)) {
//     return { mobile: identifier.trim(), isActive: 'Yes' };
//   }
//   // Fall back to userId
//   return { userId: identifier.trim(), isActive: 'Yes' };
// };

// /**
//  * @desc    Authenticate admin/staff and generate JWT token
//  * @route   POST /api/auth/login
//  * @access  Public
//  * @body    { userId: string, password: string }
//  *          `userId` may be a userId, email address, or mobile number.
//  * @returns { token, organizations, defaultOrg, user }
//  */
// exports.login = async (req, res) => {
//   try {
//     const { userId, password } = req.body;

//     if (!userId || !password) {
//       return res.status(400).json({ message: 'User ID and password are required' });
//     }

//     // ── 1. Admin check (admins only log in with userId, not email/mobile) ──────
//     const admin = await Admin.findOne({ userId });
//     if (admin) {
//       const match = await bcrypt.compare(password, admin.password);
//       if (!match) {
//         return res.status(401).json({ message: 'Invalid credentials' });
//       }

//       const token = jwt.sign(
//         {
//           id: admin._id,
//           userId: admin.userId,
//           organizations: admin.allowedOrganizations
//         },
//         process.env.JWT_SECRET,
//         { expiresIn: '24h' }
//       );

//       return res.json({
//         token,
//         organizations: admin.allowedOrganizations,
//         defaultOrg: admin.allowedOrganizations[0],
//         user: {
//           id: admin._id,
//           userId: admin.userId,
//           fullName: admin.fullName,
//           role: admin.role
//         }
//       });
//     }

//     // ── 2. Staff / User check — accepts userId, email, or mobile ─────────────
//     const filter = buildUserIdentifierFilter(userId);
//     const user = await User.findOne(filter).populate('staffId');

//     if (!user) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Build organizations list based on the user's organizationId
//     const organizations = [];
//     if (user.organizationId === 'school') {
//       organizations.push({
//         id: 'school',
//         name: 'Preetam Senior Citizen School',
//         label: 'Senior Citizen School'
//       });
//     } else if (user.organizationId === 'fitness') {
//       organizations.push({
//         id: 'fitness',
//         name: 'Sport Fitness Club',
//         label: 'Sport Fitness Club'
//       });
//     }

//     const defaultOrg = organizations[0];

//     const token = jwt.sign(
//       {
//         id: user._id,
//         userId: user.userId,
//         role: user.role,
//         organizationId: user.organizationId
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     return res.json({
//       token,
//       organizations,
//       defaultOrg,
//       user: {
//         id: user._id,
//         userId: user.userId,
//         fullName: user.fullName,
//         role: user.role,
//         userType: user.userType,
//         organizationId: user.organizationId,
//         staffId: user.staffId
//       }
//     });

//   } catch (err) {
//     console.error('Login error:', err.message);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// };

// /**
//  * @desc    Get current authenticated admin information
//  * @route   GET /api/auth/me
//  * @access  Private (Requires JWT token)
//  * @returns { user, organizations }
//  */
// exports.getMe = async (req, res) => {
//   try {
//     const admin = await Admin.findById(req.admin.id).select('-password');

//     res.json({
//       user: {
//         id: admin._id,
//         userId: admin.userId,
//         fullName: admin.fullName,
//         role: admin.role
//       },
//       organizations: admin.allowedOrganizations
//     });
//   } catch (err) {
//     console.error('Get me error:', err.message);
//     res.status(500).json({ message: 'Server error' });
//   }
// };













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
    const user = await User.findOne(filter).populate('staffId');

    if (user) {
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
          staffId: user.staffId
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