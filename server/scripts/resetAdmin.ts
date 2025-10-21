import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');

    const email = 'rbradshaw@gmail.com';
    
    // Delete existing user
    await User.deleteOne({ email });
    console.log('🗑️  Deleted existing user (if any)');

    // Create new admin user - let the pre-save hook hash the password
    const admin = new User({
      username: 'rbradshaw',
      email: email,
      password: 'PiR43Tx2-', // Plain text - will be hashed by pre-save hook
      bio: 'Admin',
      interests: [],
      isActive: true,
      isVerified: true,
      isAdmin: true,
      lastSeen: new Date(),
      blockedUsers: [],
    });

    await admin.save();
    console.log('✅ Created admin user:', admin.email);
    console.log('Username:', admin.username);
    console.log('Is Admin:', admin.isAdmin);
    console.log('Password hash exists:', !!admin.password);
    console.log('Password hash (first 20 chars):', admin.password?.substring(0, 20));

    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdmin();
