import { Schema, model } from 'mongoose';

export interface IContent {
  _id: string;
  userId: string;
  username?: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  isNSFW: boolean;
  isHidden: boolean;
  views: number;
  reactions: number;
  comments: number;
  savedForever: boolean;
  uploadedAt: Date;
  expiresAt?: Date;
  cloudinaryId?: string;
}

const contentSchema = new Schema<IContent>({
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

// Index for efficient content pool queries
contentSchema.index({ uploadedAt: -1 });
contentSchema.index({ userId: 1, uploadedAt: -1 });
contentSchema.index({ isNSFW: 1, expiresAt: 1 });

export const Content = model<IContent>('Content', contentSchema);
