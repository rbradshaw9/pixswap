import { Schema, model } from 'mongoose';
import { IChatRoom, ChatRoomType } from '@/types';

const chatRoomSchema = new Schema<IChatRoom>({
  type: {
    type: String,
    enum: Object.values(ChatRoomType),
    required: [true, 'Chat room type is required'],
  },
  name: {
    type: String,
    trim: true,
    maxlength: [50, 'Chat room name cannot exceed 50 characters'],
    default: null,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    allowMediaSharing: {
      type: Boolean,
      default: true,
    },
    messageExpiry: {
      type: Number, // in seconds
      default: null,
    },
    maxParticipants: {
      type: Number,
      default: 100,
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required'],
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ type: 1, isActive: 1 });
chatRoomSchema.index({ lastActivity: -1 });
chatRoomSchema.index({ createdBy: 1 });

// Ensure direct chats have exactly 2 participants
chatRoomSchema.pre('save', function(next: any) {
  if (this.type === ChatRoomType.DIRECT && this.participants.length !== 2) {
    return next(new Error('Direct chat must have exactly 2 participants'));
  }
  next();
});

export const ChatRoom = model<IChatRoom>('ChatRoom', chatRoomSchema);