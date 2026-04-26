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

    await Promise.all([
      User.deleteMany(),
      SOS.deleteMany(),
    ]);

    console.log('Cleared existing data');

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

    console.log('✅ Admin created: admin@sos.com / admin123');

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
        lat: 19.0795,
        lng: 72.8785,
        updatedAt: new Date(),
      },
      emergencyContacts: [
        { name: 'Brother', phone: '9123456790' },
      ],
    });

    const user3 = await User.create({
      name: 'Amit Verma',
      email: 'amit@test.com',
      phone: '9988776655',
      password: 'test123',
      role: 'user',
      location: {
        lat: 19.0810,
        lng: 72.8810,
        updatedAt: new Date(),
      },
      emergencyContacts: [
        { name: 'Mother', phone: '9988776656' },
      ],
    });

    const user4 = await User.create({
      name: 'Sneha More',
      email: 'sneha@test.com',
      phone: '8877665544',
      password: 'test123',
      role: 'user',
      location: {
        lat: 19.0770,
        lng: 72.8768,
        updatedAt: new Date(),
      },
      emergencyContacts: [
        { name: 'Father', phone: '8877665545' },
      ],
    });

    console.log('✅ 4 test users created (password: test123)');

    await SOS.create([
      {
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
        responders: [
          {
            user: user3._id,
            location: {
              lat: 19.0810,
              lng: 72.8810,
              updatedAt: new Date(),
            },
          },
        ],
      },
      {
        user: user2._id,
        incidentType: 'Accident / Crash',
        status: 'active',
        location: {
          lat: 19.0805,
          lng: 72.8792,
        },
        locationHistory: [
          { lat: 19.0805, lng: 72.8792 },
        ],
        verifications: [
          { user: user3._id, confirmed: true },
        ],
        responders: [
          {
            user: user4._id,
            location: {
              lat: 19.0770,
              lng: 72.8768,
              updatedAt: new Date(),
            },
          },
        ],
      },
      {
        user: user4._id,
        incidentType: 'Fire',
        status: 'responding',
        location: {
          lat: 19.0782,
          lng: 72.8774,
        },
        locationHistory: [
          { lat: 19.0782, lng: 72.8774 },
        ],
        verifications: [
          { user: user1._id, confirmed: true },
        ],
        responders: [
          {
            user: user2._id,
            location: {
              lat: 19.0795,
              lng: 72.8785,
              updatedAt: new Date(),
            },
          },
        ],
      },
    ]);

    console.log('✅ 3 nearby sample SOS incidents created');

    console.log('\n📋 Login credentials:');
    console.log('   Admin:   admin@sos.com    / admin123');
    console.log('   User 1:  rahul@test.com   / test123');
    console.log('   User 2:  priya@test.com   / test123');
    console.log('   User 3:  amit@test.com    / test123');
    console.log('   User 4:  sneha@test.com   / test123');

    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('❌ Seed error:', e);
    process.exit(1);
  }
}

seed();