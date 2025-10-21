#!/usr/bin/env node

// Quick admin user creator - can be run with: node createAdminQuick.js <mongodb_uri>

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.argv[2] || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Please provide MongoDB URI as argument or MONGODB_URI env var');
  console.log('Usage: node createAdminQuick.js "mongodb://..."');
  process.exit(1);
}

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define schema
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

    // Add password comparison method
    userSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };

    // Add pre-save hook to hash password
    userSchema.pre('save', async function(next) {
      if (!this.isModified('password')) return next();
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    });

    const User = mongoose.model('User', userSchema);

    // Delete existing admin
    await User.deleteOne({ email: 'rbradshaw@gmail.com' });
    console.log('🗑️  Deleted existing admin user');

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
    console.log('   Is Admin: true');

    // Verify immediately
    const testUser = await User.findOne({ email: 'rbradshaw@gmail.com' }).select('+password');
    if (testUser) {
      const match = await testUser.comparePassword('PiR43Tx2-');
      console.log('   Password test:', match ? '✅ PASS' : '❌ FAIL');
    }

    await mongoose.disconnect();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
