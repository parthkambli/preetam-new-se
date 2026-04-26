const mongoose = require('mongoose');
const dotenv = require('dotenv');

const connectDB = require('../config/db');
const User = require('../models/User');
const AccessRole = require('../models/AccessRole');

dotenv.config();

const fixUserRoles = async () => {
  try {
    await connectDB();

    const orgId = 'fitness';

    // 🔥 Get all roles
    const roles = await AccessRole.find({ organizationId: orgId });

    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.roleKey] = r._id;
    });

    console.log('ROLE MAP:', roleMap);

    // 🔥 Get users WITHOUT role
    const users = await User.find({
      organizationId: orgId,
      $or: [
        { accessRoleId: { $exists: false } },
        { accessRoleId: null }
      ]
    });

    console.log('Users to fix:', users.length);

    let updatedCount = 0;

    for (const user of users) {
      let roleKey = null;

      // 🔥 Map User.role → AccessRole.roleKey
      switch (user.role) {
        case 'FitnessStaff':
          roleKey = 'FITNESS_STAFF';
          break;
        case 'Admin':
          roleKey = 'ADMIN';
          break;
        case 'Participant':
          roleKey = 'PARTICIPANT';
          break;
        case 'SchoolStaff':
          roleKey = 'SCHOOL_STAFF';
          break;
        case 'Student':
          roleKey = 'STUDENT';
          break;
        default:
          console.log(`⚠️ Unknown role for user ${user._id}:`, user.role);
          continue;
      }

      const roleId = roleMap[roleKey];

      if (!roleId) {
        console.log(`❌ Role not found for key: ${roleKey}`);
        continue;
      }

      user.accessRoleId = roleId;

      // 🔥 Clean overrides (important)
      user.customPermissions = [];
      user.removedPermissions = [];

      await user.save();

      updatedCount++;
    }

    console.log(`✅ Updated users: ${updatedCount}`);

    process.exit();

  } catch (err) {
    console.error('❌ Script error:', err);
    process.exit(1);
  }
};

fixUserRoles();