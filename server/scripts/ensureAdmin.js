#!/usr/bin/env node

// This script can be run on Railway to ensure admin user exists
// Run with: node scripts/ensureAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable not set');
  process.exit(1);
}

async function ensureAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define schema with password hashing
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      bio: String,
      interests: [String],
      isActive: Boolean,
      isVerified: Boolean,
      isAdmin: Boolean,
      lastSeen: Date,
      blockedUsers: [mongoose.Schema.Types.ObjectId],
    }, { timestamps: true });

    userSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };

    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    });

    const User = mongoose.model('User', userSchema);

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'rbradshaw@gmail.com' });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      
      // Update admin flags if needed
      if (!existingAdmin.isAdmin || !existingAdmin.isVerified || !existingAdmin.isActive) {
        existingAdmin.isAdmin = true;
        existingAdmin.isVerified = true;
        existingAdmin.isActive = true;
        await existingAdmin.save();
        console.log('✅ Updated admin user flags');
      }
    } else {
      // Create new admin
      const admin = new User({
        username: 'rbradshaw',
        email: 'rbradshaw@gmail.com',
        password: 'PiR43Tx2-',
        bio: 'Admin',
        interests: [],
        isActive: true,
        isVerified: true,
        isAdmin: true,
        lastSeen: new Date(),
        blockedUsers: [],
      });

      await admin.save();
      console.log('✅ Created admin user:');
      console.log('   Email: rbradshaw@gmail.com');
      console.log('   Password: PiR43Tx2-');
    }

    // Verify password works
    const testUser = await User.findOne({ email: 'rbradshaw@gmail.com' }).select('+password');
    if (testUser && testUser.password) {
      const match = await testUser.comparePassword('PiR43Tx2-');
      console.log('   Password test:', match ? '✅ PASS' : '❌ FAIL');
      
      if (!match) {
        console.log('⚠️  Password mismatch! Recreating...');
        await User.deleteOne({ email: 'rbradshaw@gmail.com' });
        
        const newAdmin = new User({
          username: 'rbradshaw',
          email: 'rbradshaw@gmail.com',
          password: 'PiR43Tx2-',
          bio: 'Admin',
          interests: [],
          isActive: true,
          isVerified: true,
          isAdmin: true,
          lastSeen: new Date(),
          blockedUsers: [],
        });
        
        await newAdmin.save();
        console.log('✅ Recreated admin user with correct password');
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

ensureAdmin();
