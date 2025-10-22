/**
 * Seed database with sample content for testing and initial deployment
 * Uses Cloudinary URLs to pre-populate the content pool
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Simple seed data - you can replace these with actual Cloudinary URLs
const SEED_CONTENT = [
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap1/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Beautiful landscape',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap2/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'City lights',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap3/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Nature walk',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap4/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Ocean waves',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap5/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Mountain view',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap6/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Urban exploration',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap7/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Street photography',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap8/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Sunset vibes',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap9/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Abstract art',
  },
  {
    mediaUrl: 'https://picsum.photos/seed/pixswap10/800/600',
    mediaType: 'image',
    isNSFW: false,
    caption: 'Minimalist design',
  },
];

const contentSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  username: {
    type: String,
  },
  mediaUrl: {
    type: String,
    required: true,
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  caption: {
    type: String,
    maxlength: 500,
  },
  isNSFW: {
    type: Boolean,
    default: false,
    index: true,
  },
  isHidden: {
    type: Boolean,
    default: false,
    index: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  reactions: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },
  savedForever: {
    type: Boolean,
    default: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  expiresAt: {
    type: Date,
    index: true,
  },
  cloudinaryId: {
    type: String,
  },
}, {
  timestamps: true,
});

const Content = mongoose.model('Content', contentSchema);

async function seedContent() {
  try {
    console.log('🌱 Starting content seeding...');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI or MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if seed content already exists
    const existingCount = await Content.countDocuments({ userId: 'seed-user' });
    if (existingCount > 0) {
      console.log(`ℹ️  Found ${existingCount} existing seed content items`);
      const answer = process.argv.includes('--force') ? 'yes' : 'no';
      
      if (answer === 'yes') {
        console.log('🗑️  Removing existing seed content...');
        await Content.deleteMany({ userId: 'seed-user' });
        console.log('✅ Removed existing seed content');
      } else {
        console.log('ℹ️  Skipping seed (use --force to override)');
        process.exit(0);
      }
    }

    // Create seed content
    console.log(`📦 Creating ${SEED_CONTENT.length} seed content items...`);
    const seedDocs = SEED_CONTENT.map((item, index) => ({
      _id: `seed-content-${Date.now()}-${index}`,
      userId: 'seed-user',
      username: 'PixSwap',
      mediaUrl: item.mediaUrl,
      mediaType: item.mediaType,
      caption: item.caption,
      isNSFW: item.isNSFW,
      isHidden: false,
      views: 0,
      reactions: 0,
      comments: 0,
      savedForever: true, // Keep seed content forever
      uploadedAt: new Date(),
      expiresAt: null, // Never expires
    }));

    await Content.insertMany(seedDocs);
    console.log(`✅ Successfully seeded ${seedDocs.length} content items`);

    // Display summary
    const totalContent = await Content.countDocuments();
    console.log('\n📊 Database Summary:');
    console.log(`   Total content: ${totalContent}`);
    console.log(`   Seed content: ${seedDocs.length}`);
    console.log(`   User content: ${totalContent - seedDocs.length}`);
    console.log('\n✅ Seeding complete!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed function
seedContent();
