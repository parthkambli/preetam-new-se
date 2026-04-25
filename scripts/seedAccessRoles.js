const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const AccessRole = require('../models/AccessRole');

dotenv.config();

connectDB();
// Do not run it will delete all the roles and re-create the default ones. Only run if you want to reset the roles to default.

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
        'VIEW_ATTENDANCE',
        'VIEW_EVENTS'
      ],
      isDefault: true
    },
    {
      name: 'Participant',
      roleKey: 'PARTICIPANT',
      organizationId: 'fitness',
      permissions: [],
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