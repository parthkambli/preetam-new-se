const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const AccessRole = require('../models/AccessRole');

dotenv.config();

connectDB();

const seedRoles = async () => {
  await AccessRole.deleteMany({});

  await AccessRole.insertMany([
    {
      name: 'Fitness Staff',
      roleKey: 'FITNESS_STAFF',
      organizationId: 'fitness',
      permissions: [
        'VIEW_OWN_SCHEDULE',
        'VIEW_ACTIVITIES',
        'MARK_ATTENDANCE',
        'VIEW_EVENTS'
      ],
      isDefault: true
    },
    {
      name: 'Admin',
      roleKey: 'ADMIN',
      organizationId: 'fitness',
      permissions: [
        'USER_MANAGE',
        'VIEW_DASHBOARD',
        'MANAGE_ATTENDANCE',
        'MANAGE_ACTIVITIES',
        'VIEW_REPORTS'
      ],
      isDefault: true
    }
  ]);

  console.log('Access roles seeded');
  process.exit();
};

seedRoles();