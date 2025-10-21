import { Schema, model } from 'mongoose';
import { IMedia, MediaType, MediaVisibility } from '@/types';

const mediaSchema = new Schema<IMedia>({
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required'],
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(MediaType),
    required: [true, 'Media type is required'],
  },
  url: {
    type: String,
    required: [true, 'Media URL is required'],
  },
  thumbnailUrl: {
    type: String,
    default: null,
  },
  caption: {
    type: String,
    maxlength: [500, 'Caption cannot exceed 500 characters'],
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  visibility: {
    type: String,
    enum: Object.values(MediaVisibility),
    default: MediaVisibility.PUBLIC,
  },
  expiresAt: {
    type: Date,
    default: null,
    index: { expireAfterSeconds: 0 }, // TTL index
  },
  isModerated: {
    type: Boolean,
    default: false,
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  metadata: {
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // for videos in seconds
      default: null,
    },
    dimensions: {
      width: {
        type: Number,
        required: true,
      },
      height: {
        type: Number,
        required: true,
      },
    },
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better query performance
mediaSchema.index({ owner: 1, createdAt: -1 });
mediaSchema.index({ visibility: 1, createdAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ moderationStatus: 1 });
// Note: expiresAt already has TTL index in field definition

// Virtual for likes count
mediaSchema.virtual('likesCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comments count
mediaSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

export const Media = model<IMedia>('Media', mediaSchema);