import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { User } from '../src/models/User';

dotenv.config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email: 'rbradshaw@gmail.com' });
    
    if (user) {
      console.log('\nAdmin user found:');
      console.log('Email:', user.email);
      console.log('Username:', user.username);
      console.log('Is Admin:', user.isAdmin);
      console.log('Password hash:', user.password);
    } else {
      console.log('\nNo user found with email rbradshaw@gmail.com');
    }

    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAdmin();
