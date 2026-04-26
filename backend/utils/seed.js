require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

const mongoose = require('mongoose');
const User = require('../models/User');
const SOS = require('../models/SOS');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // ─────────────────────────────────────────────
    // CLEAR EXISTING DATA
    // ─────────────────────────────────────────────
    await Promise.all([
      User.deleteMany(),
      SOS.deleteMany(),
    ]);
    console.log('Cleared existing data');

    // ─────────────────────────────────────────────
    // CREATE ADMIN (password will be hashed)
    // ─────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@sos.com',
      phone: '9000000001',
      password: 'admin123',
      role: 'admin',
      location: {
        lat: 19.0760,
        lng: 72.8777,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Admin created: admin@sos.com / admin123`);

    // ─────────────────────────────────────────────
    // CREATE USERS (IMPORTANT: use create, not insertMany)
    // ─────────────────────────────────────────────
    const user1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@test.com',
      phone: '9876543210',
      password: 'test123',
      role: 'user',
      location: {
        lat: 19.0820,
        lng: 72.8800,
        updatedAt: new Date(),
      },
      emergencyContacts: [
        { name: 'Family', phone: '9876543211' },
      ],
    });

    const user2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@test.com',
      phone: '9123456789',
      password: 'test123',
      role: 'user',
      location: {
        lat: 19.0700,
        lng: 72.8750,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ 2 test users created (password: test123)`);

    // ─────────────────────────────────────────────
    // CREATE SAMPLE SOS
    // ─────────────────────────────────────────────
    await SOS.create({
      user: user1._id,
      incidentType: 'Medical Emergency',
      status: 'active',
      location: {
        lat: 19.0790,
        lng: 72.8780,
      },
      locationHistory: [
        { lat: 19.0790, lng: 72.8780 },
      ],
      verifications: [
        { user: user2._id, confirmed: true },
      ],
    });

    console.log('✅ Sample SOS incident created');

    // ─────────────────────────────────────────────
    // FINAL OUTPUT
    // ─────────────────────────────────────────────
    console.log('\n📋 Login credentials:');
    console.log('   Admin:   admin@sos.com    / admin123');
    console.log('   User 1:  rahul@test.com   / test123');
    console.log('   User 2:  priya@test.com   / test123');

    await mongoose.disconnect();
    process.exit(0);

  } catch (e) {
    console.error('❌ Seed error:', e);
    process.exit(1);
  }
}

seed();