require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      bio: String,
      interests: [String],
      isActive: { type: Boolean, default: true },
      isVerified: { type: Boolean, default: false },
      isAdmin: { type: Boolean, default: false },
      lastSeen: Date,
      blockedUsers: [mongoose.Schema.Types.ObjectId],
    }, { timestamps: true });

    const User = mongoose.model('User', userSchema);

    // Check if user exists
    const email = 'rbradshaw@gmail.com';
    const existing = await User.findOne({ email });
    
    if (existing) {
      // Update to admin
      existing.isAdmin = true;
      existing.isVerified = true;
      existing.isActive = true;
      await existing.save();
      console.log('✅ Updated existing user to admin:', email);
    } else {
      // Create new admin user
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash('PiR43Tx2-', salt);
      
      const admin = await User.create({
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
      console.log('✅ Created admin user:', admin.email);
    }

    await mongoose.disconnect();
    console.log('✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
