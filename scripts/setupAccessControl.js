// const mongoose = require('mongoose');
// const dotenv = require('dotenv');

// const connectDB = require('../config/db');
// const User = require('../models/User');
// const AccessRole = require('../models/AccessRole');
// const FitnessStaffRole = require('../models/FitnessStaffRole');

// dotenv.config();

// const ORG_ID = 'fitness';

// const DEFAULT_ROLES = [
//   {
//     name: 'Fitness Staff',
//     roleKey: 'FITNESS_STAFF',
//     permissions: [
//       'VIEW_OWN_SCHEDULE',
//       'VIEW_ACTIVITIES',
//       'VIEW_ATTENDANCE',
//       'VIEW_EVENTS'
//     ]
//   },
//   {
//     name: 'Participant',
//     roleKey: 'PARTICIPANT',
//     permissions: []
//   },
//   {
//     name: 'Admin',
//     roleKey: 'ADMIN',
//     permissions: [
//       'USER_MANAGE',
//       'VIEW_DASHBOARD',
//       'MANAGE_ATTENDANCE',
//       'MANAGE_ACTIVITIES',
//       'VIEW_REPORTS'
//     ]
//   }
// ];

// console.log('ROLE MAP:', roleMap);

// const ROLE_MAP = {
//   FitnessStaff: 'FITNESS_STAFF',
//   Admin: 'ADMIN',
//   Participant: 'PARTICIPANT',
//   SchoolStaff: 'SCHOOL_STAFF',
//   Student: 'STUDENT'
// };

// const run = async () => {
//   try {
//     await connectDB();

//     console.log('🚀 STARTING ACCESS CONTROL SETUP');

//     // =========================
//     // 1. UPSERT ROLES (NO DELETE)
//     // =========================
//     const roleMap = {};

//     for (const role of DEFAULT_ROLES) {
//       const existing = await AccessRole.findOne({
//         roleKey: role.roleKey,
//         organizationId: ORG_ID
//       });

//       if (existing) {
//         existing.name = role.name;
//         existing.permissions = role.permissions;
//         existing.isDefault = true;

//         await existing.save();
//         roleMap[role.roleKey] = existing._id;

//         console.log(`♻️ Updated role: ${role.roleKey}`);
//       } else {
//         const created = await AccessRole.create({
//           ...role,
//           organizationId: ORG_ID,
//           isDefault: true
//         });

//         roleMap[role.roleKey] = created._id;

//         console.log(`✅ Created role: ${role.roleKey}`);
//       }
//     }

//     console.log('ROLE MAP:', roleMap);

//     // =========================
//     // 2. FIX USERS
//     // =========================
//     const users = await User.find({ organizationId: ORG_ID });

//     let updated = 0;

//     for (const user of users) {
//       const roleKey = ROLE_MAP[user.role];

//       if (!roleKey) {
//         console.log(`⚠️ Skipping unknown role: ${user.role}`);
//         continue;
//       }

//       const roleId = roleMap[roleKey];

//       if (!roleId) {
//         console.log(`❌ Role not found for: ${roleKey}`);
//         continue;
//       }

//       user.accessRoleId = roleId;

//       // 🔥 IMPORTANT: reset overrides
//       user.customPermissions = [];
//       user.removedPermissions = [];

//       await user.save();

//       updated++;
//     }

//     console.log(`✅ Users updated: ${updated}`);

//     console.log('🎯 ACCESS CONTROL SETUP COMPLETE');

//     process.exit();

//   } catch (err) {
//     console.error('❌ ERROR:', err);
//     process.exit(1);
//   }
// };

// run();









const mongoose = require('mongoose');
const dotenv = require('dotenv');

const connectDB = require('../config/db');
const User = require('../models/User');
const AccessRole = require('../models/AccessRole');
const FitnessStaffRole = require('../models/FitnessStaffRole');
const FitnessStaff = require('../models/FitnessStaff'); // ✅ NEW

dotenv.config();

const ORG_ID = 'fitness';

const DEFAULT_ROLES = [
  {
    name: 'Fitness Staff',
    roleKey: 'FITNESS_STAFF',
    permissions: [
      'VIEW_OWN_SCHEDULE',
      'VIEW_ACTIVITIES',
      'VIEW_ATTENDANCE',
      'VIEW_EVENTS',
      'VIEW_STAFF',
      'VIEW_PARTICIPANTS'
    ]
  },
  {
    name: 'Participant',
    roleKey: 'PARTICIPANT',
    permissions: []
  },
  {
    name: 'Admin',
    roleKey: 'ADMIN',
    permissions: [
      'USER_MANAGE',
      'VIEW_DASHBOARD',
      'MANAGE_ATTENDANCE',
      'MANAGE_ACTIVITIES',
      'VIEW_REPORTS'
    ]
  }
];

const ROLE_MAP = {
  FitnessStaff: 'FITNESS_STAFF',
  Admin: 'ADMIN',
  Participant: 'PARTICIPANT',
  SchoolStaff: 'SCHOOL_STAFF',
  Student: 'STUDENT'
};

const run = async () => {
  try {
    await connectDB();

    console.log('🚀 STARTING ACCESS CONTROL SETUP');

    // =========================
    // 1. UPSERT DEFAULT ROLES
    // =========================
    const roleMap = {};

    for (const role of DEFAULT_ROLES) {
      const existing = await AccessRole.findOne({
        roleKey: role.roleKey,
        organizationId: ORG_ID
      });

      if (existing) {
        existing.name = role.name;
        existing.permissions = role.permissions;
        existing.isDefault = true;

        await existing.save();
        roleMap[role.roleKey] = existing._id;

        console.log(`♻️ Updated role: ${role.roleKey}`);
      } else {
        const created = await AccessRole.create({
          ...role,
          organizationId: ORG_ID,
          isDefault: true
        });

        roleMap[role.roleKey] = created._id;

        console.log(`✅ Created role: ${role.roleKey}`);
      }
    }

    console.log('DEFAULT ROLE MAP:', roleMap);

    // =========================
    // 1.5 SYNC FITNESS STAFF ROLES → ACCESS ROLES
    // =========================
    const staffRoles = await FitnessStaffRole.find();

    for (const staffRole of staffRoles) {
      const roleKey = staffRole.name.toUpperCase().replace(/\s+/g, '_');

      let existing = await AccessRole.findOne({
        roleKey,
        organizationId: ORG_ID
      });

      if (existing) {
        roleMap[roleKey] = existing._id;
        console.log(`♻️ AccessRole exists for: ${staffRole.name}`);
        continue;
      }

      const created = await AccessRole.create({
        name: staffRole.name,
        roleKey,
        organizationId: ORG_ID,
        permissions: [
          'VIEW_OWN_SCHEDULE',
          'VIEW_ACTIVITIES',
          'VIEW_ATTENDANCE',
          'VIEW_EVENTS'
        ],
        isDefault: false
      });

      roleMap[roleKey] = created._id;

      console.log(`✅ Created AccessRole for staff role: ${staffRole.name}`);
    }

    console.log('FINAL ROLE MAP:', roleMap);

    // =========================
    // 2. FIX USERS (UPDATED LOGIC)
    // =========================
    const users = await User.find({ organizationId: ORG_ID });

    let updated = 0;

    for (const user of users) {
      let roleKey = null;

      // 🔥 FITNESS STAFF → derive from staff.role
      if (user.role === 'FitnessStaff' && user.staffId) {
        const staff = await FitnessStaff.findById(user.staffId).lean();

        if (staff?.role) {
          roleKey = staff.role.toUpperCase().replace(/\s+/g, '_');
        } else {
          console.log(`⚠️ Staff role missing for user: ${user.userId}`);
        }
      }

      // 🔁 FALLBACK (Admin / Participant etc.)
      if (!roleKey) {
        roleKey = ROLE_MAP[user.role];
      }

      if (!roleKey) {
        console.log(`⚠️ Skipping unknown role: ${user.role}`);
        continue;
      }

      const roleId = roleMap[roleKey];

      if (!roleId) {
        console.log(`❌ AccessRole not found for: ${roleKey}`);
        continue;
      }

      user.accessRoleId = roleId;

      // 🔥 reset overrides (unchanged logic)
      user.customPermissions = [];
      user.removedPermissions = [];

      await user.save();

      updated++;
    }

    console.log(`✅ Users updated: ${updated}`);

    console.log('🎯 ACCESS CONTROL SETUP COMPLETE');

    process.exit();

  } catch (err) {
    console.error('❌ ERROR:', err);
    process.exit(1);
  }
};

run();