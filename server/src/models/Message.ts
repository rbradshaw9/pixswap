import { Schema, model } from 'mongoose';
import { IMessage, MessageType, MessageStatus } from '@/types';

const messageSchema = new Schema<IMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
    index: true,
  },
  chatRoom: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: [true, 'Chat room is required'],
    index: true,
  },
  type: {
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  mediaUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: Object.values(MessageStatus),
    default: MessageStatus.SENT,
  },
  reactions: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emoji: {
      type: String,
      required: true,
      maxlength: [10, 'Emoji cannot exceed 10 characters'],
    },
  }],
  expiresAt: {
    type: Date,
    default: null,
    index: { expireAfterSeconds: 0 }, // TTL index
  },
  editedAt: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ expiresAt: 1 });

// Don't return deleted messages in queries by default
messageSchema.pre(/^find/, function(this: any) {
  this.find({ deletedAt: { $eq: null } });
});

export const Message = model<IMessage>('Message', messageSchema);