const User = require('../models/User');
const AccessRole = require('../models/AccessRole');
const bcrypt = require('bcryptjs');

// ================= CREATE USER =================
// exports.createUser = async (req, res) => {
//   try {
//     const {
//       userId,
//       password,
//       fullName,
//       role,
//       mobile,
//       organizationId,
//       accessRoleId
//     } = req.body;

//     if (!userId || !password || !fullName || !mobile || !organizationId) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const existing = await User.findOne({ userId, organizationId });
//     if (existing) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       userId,
//       password: hashedPassword,
//       fullName,
//       role,
//       mobile,
//       organizationId,
//       accessRoleId: accessRoleId || null,
//       isActive: 'Yes'
//     });

//     res.json({ success: true, data: user });

//   } catch (err) {
//     console.error('createUser error:', err.message);
//     res.status(500).json({ message: 'Failed to create user' });
//   }
// };

exports.createUser = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      password,
      role,
      organizationId,
      accessRoleId
    } = req.body;

    if (!fullName || !mobile || !password || !organizationId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 🔥 Auto-generate userId
    const userId = `USR${Date.now()}`;

    const existing = await User.findOne({ mobile, organizationId });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this mobile' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      userId,
      password: hashedPassword,
      fullName,
      role: role || 'Gatekeeper',
      mobile,
      organizationId,
      userType: 'manual',       // ✅ IMPORTANT
      linkedId: null,           // ✅ IMPORTANT
      accessRoleId: accessRoleId || null,
      isActive: 'Yes'
    });

    res.json({
      success: true,
      message: 'Manual user created',
      data: user
    });

  } catch (err) {
    console.error('createUser error:', err.message);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// ================= GET USERS =================
// exports.getUsers = async (req, res) => {
//   try {
//     const users = await User.find({
//       organizationId: req.organizationId,
//       role: { $nin: ['Participant'] }   // 🔥 hide members
//     })
//       .select('-password')
//       .populate('accessRoleId', 'name permissions')
//       .lean();

//     res.json({ success: true, count: users.length, data: users });

//   } catch (err) {
//     console.error('getUsers error:', err.message);
//     res.status(500).json({ message: 'Failed to fetch users' });
//   }
// };

exports.getUsers = async (req, res) => {
  try {
    // STEP A: Get page + limit from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // STEP B: Base filter
    let filter = {
      organizationId: req.organizationId,
      role: { $nin: ['Participant'] }
    };

    // STEP C: Optional search filter
    if (req.query.search) {
      filter.fullName = {
        $regex: req.query.search,
        $options: "i"
      };
    }

    // STEP D: Total count BEFORE pagination
    const totalRecords = await User.countDocuments(filter);

    // STEP E: Fetch paginated users
    const users = await User.find(filter)
      .select("-password")
      .populate("accessRoleId", "name permissions")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // STEP F: Response
    res.json({
      success: true,
      data: users,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
        hasNextPage: page < Math.ceil(totalRecords / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    console.error("getUsers error:", err.message);
    res.status(500).json({
      message: "Failed to fetch users"
    });
  }
};

// ================= UPDATE USER =================
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true })
      .select('-password');

    res.json({ success: true, data: user });

  } catch (err) {
    console.error('updateUser error:', err.message);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// ================= DELETE USER =================
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res.json({ success: true, message: 'User deleted' });

  } catch (err) {
    console.error('deleteUser error:', err.message);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// ================= ASSIGN ROLE =================
exports.assignRole = async (req, res) => {
  try {
    const { userId, accessRoleId } = req.body;

    if (!userId || !accessRoleId) {
      return res.status(400).json({
        message: 'userId and accessRoleId are required'
      });
    }

    const role = await AccessRole.findById(accessRoleId);

    if (!role) {
      return res.status(404).json({ message: 'Access role not found' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { accessRoleId },
      { new: true }
    ).populate('accessRoleId', 'name permissions');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Role assigned successfully',
      data: user
    });

  } catch (err) {
    console.error('assignRole error:', err.message);
    res.status(500).json({ message: 'Failed to assign role' });
  }
};

// ================= UPDATE USER PERMISSIONS =================
// exports.updateUserPermissions = async (req, res) => {
//   try {
//     const { userId, customPermissions, removedPermissions } = req.body;

//     const user = await User.findByIdAndUpdate(
//       userId,
//       {
//         customPermissions: customPermissions || [],
//         removedPermissions: removedPermissions || []
//       },
//       { new: true }
//     );

//     res.json({
//       success: true,
//       data: user
//     });

//   } catch (err) {
//     console.error('updateUserPermissions error:', err.message);
//     res.status(500).json({ message: 'Failed to update permissions' });
//   }
// };

exports.updateUserPermissions = async (req, res) => {
  try {
    const { userId, customPermissions, removedPermissions } = req.body;

    const user = await User.findById(userId);

    // 🔥 ADD THIS BLOCK HERE
    if (user.role === 'Participant') {
      return res.status(403).json({
        message: 'Participant permissions cannot be modified'
      });
    }

    user.customPermissions = customPermissions || [];
    user.removedPermissions = removedPermissions || [];

    await user.save();

    res.json({
      success: true,
      data: user
    });

  } catch (err) {
    console.error('updateUserPermissions error:', err.message);
    res.status(500).json({ message: 'Failed to update permissions' });
  }
};