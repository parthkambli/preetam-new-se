const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const AccessRole = require('../models/AccessRole');

dotenv.config();

connectDB();

const seedRoles = async () => {
  await AccessRole.deleteMany({ organizationId: 'school' });

  await AccessRole.insertMany([
    {
      name: 'School Staff',
      roleKey: 'SCHOOL_STAFF',
      organizationId: 'school',
      permissions: [
        'SCHOOL_VIEW_ADMISSION',
        'SCHOOL_VIEW_FEES',
        'SCHOOL_VIEW_REPORTS',
        'SCHOOL_VIEW_ATTENDANCE',
      ],
      isDefault: true
    },
    {
      name: 'School Admin',
      roleKey: 'SCHOOL_ADMIN',
      organizationId: 'school',
      permissions: [
        'SCHOOL_VIEW_ADMISSION',
        'SCHOOL_ADD_ADMISSION',
        'SCHOOL_EDIT_ADMISSION',
        'SCHOOL_DELETE_ADMISSION',
        'SCHOOL_VIEW_FEES',
        'SCHOOL_VIEW_REPORTS',
        'SCHOOL_VIEW_ATTENDANCE',
        'SCHOOL_MARK_ATTENDANCE',
      ],
      isDefault: false
    },
    {
      name: 'Student',
      roleKey: 'STUDENT',
      organizationId: 'school',
      permissions: [],
      isDefault: true
    }
  ]);

  console.log('School access roles seeded');
  process.exit();
};

seedRoles();
