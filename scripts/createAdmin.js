const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const Admin = require('../models/Admin');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existing = await Admin.findOne({ userId: 'admin123' });
    if (existing) {
      console.log('Admin already exists');
      process.exit(0);
    }

    // Hash password
    const hashed = await bcrypt.hash('admin@preetam2025', 10);

    // Create admin
    await Admin.create({
      userId: 'admin123',
      password: hashed,
      fullName: 'Super Admin',
      allowedOrganizations: [
        { id: 'school', name: 'Preetam Senior Citizen School', label: 'Senior Citizen School' },
        { id: 'fitness', name: 'Sport Fitness Club', label: 'Sport Fitness Club' }
      ],
      role: 'superadmin'
    });

    console.log('✅ Admin created successfully!');
    console.log('User ID: admin123');
    console.log('Password: admin@preetam2025');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
  }
}

createAdmin();
