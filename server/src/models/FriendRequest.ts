import { Schema, model, Document } from 'mongoose';

export interface IFriendRequest extends Document {
  fromUser: Schema.Types.ObjectId;
  toUser: Schema.Types.ObjectId;
  fromUsername: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  respondedAt?: Date;
}

const friendRequestSchema = new Schema<IFriendRequest>({
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  toUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  fromUsername: {
    type: String,
    required: true,
  },
  toUsername: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  respondedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
friendRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true }); // Prevent duplicate requests
friendRequestSchema.index({ toUser: 1, status: 1 }); // Get pending requests for a user
friendRequestSchema.index({ fromUser: 1, status: 1 }); // Get sent requests

export const FriendRequest = model<IFriendRequest>('FriendRequest', friendRequestSchema);
