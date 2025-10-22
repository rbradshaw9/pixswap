import { Schema, model, Document } from 'mongoose';

export interface INotification extends Document {
  userId: Schema.Types.ObjectId;
  type: 'friend_request' | 'friend_accepted' | 'comment' | 'like' | 'comment_like' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  fromUser?: Schema.Types.ObjectId;
  fromUsername?: string;
  metadata?: {
    contentId?: string;
    commentId?: string;
    requestId?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['friend_request', 'friend_accepted', 'comment', 'like', 'comment_like', 'system'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  actionUrl: {
    type: String,
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  fromUsername: {
    type: String,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 2592000, // Auto-delete after 30 days
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

export const Notification = model<INotification>('Notification', notificationSchema);
