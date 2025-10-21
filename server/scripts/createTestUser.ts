import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();

async function createTestUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Delete test user if exists
    await User.deleteOne({ email: 'test@test.com' });
    
    // Create test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@test.com',
      password: 'test123',
      bio: 'Test',
      interests: [],
      isActive: true,
      isVerified: true,
      isAdmin: false,
      lastSeen: new Date(),
      blockedUsers: [],
    });

    await testUser.save();
    console.log('✅ Created test user');
    console.log('  Email: test@test.com');
    console.log('  Password: test123\n');

    // Test login immediately
    const user = await User.findOne({ email: 'test@test.com' }).select('+password');
    if (user) {
      const isMatch = await user.comparePassword('test123');
      console.log('Password test:', isMatch ? '✅ PASS' : '❌ FAIL');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done! Try logging in with: test@test.com / test123');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
