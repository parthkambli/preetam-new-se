const mongoose = require('mongoose');
const dotenv = require('dotenv');

const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const seedUsersToDefaultPermissions = async () => {
  try {
    await connectDB();

    const result = await User.updateMany(
      { organizationId: 'fitness' }, // ⚠️ adjust if needed
      {
        $set: {
          customPermissions: [],
          removedPermissions: []
        }
      }
    );

    console.log('Users updated:', result.modifiedCount);

    process.exit();
  } catch (err) {
    console.error('Seeding error:', err.message);
    process.exit(1);
  }
};

seedUsersToDefaultPermissions();