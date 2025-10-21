import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

    // Create new admin user with hashed password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('PiR43Tx2-', salt);
    
    const admin = new User({
      username: 'rbradshaw',
      email: email,
      password: hashedPassword,
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
    console.log('Password hash (first 20 chars):', admin.password?.substring(0, 20));

    await mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdmin();
