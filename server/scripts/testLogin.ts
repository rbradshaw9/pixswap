import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    const email = 'rbradshaw@gmail.com';
    const password = 'PiR43Tx2-';

    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      await mongoose.connection.close();
      return;
    }

    console.log('User found:');
    console.log('  Email:', user.email);
    console.log('  Username:', user.username);
    console.log('  Is Admin:', user.isAdmin);
    console.log('  Is Active:', user.isActive);
    console.log('  Password hash exists:', !!user.password);
    console.log('  Password hash:', user.password?.substring(0, 30) + '...\n');

    // Test password comparison
    const isMatch = await user.comparePassword(password);
    console.log('Password comparison result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');

    if (!isMatch) {
      console.log('\n🔍 Testing with different variations:');
      
      const variations = [
        'PiR43Tx2-',
        'pir43tx2-',
        'PIR43TX2-',
        ' PiR43Tx2-',
        'PiR43Tx2- ',
      ];

      for (const variant of variations) {
        const result = await user.comparePassword(variant);
        console.log(`  "${variant}": ${result ? '✅' : '❌'}`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLogin();
