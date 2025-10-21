import { Schema, model } from 'mongoose';
import { ISwap, SwapStatus } from '@/types';

const swapSchema = new Schema<ISwap>({
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaSubmitted: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    mediaReceived: {
      type: Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    revealedAt: {
      type: Date,
      default: null,
    },
  }],
  status: {
    type: String,
    enum: Object.values(SwapStatus),
    default: SwapStatus.PENDING,
  },
  matchedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 }, // TTL index
  },
  metadata: {
    category: {
      type: String,
      trim: true,
      default: null,
    },
    theme: {
      type: String,
      trim: true,
      default: null,
    },
    constraints: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
swapSchema.index({ status: 1, createdAt: -1 });
swapSchema.index({ 'participants.user': 1 });
// Note: expiresAt already has TTL index in field definition
swapSchema.index({ 'metadata.category': 1 });

// Validate participants array
swapSchema.pre('save', function(next: any) {
  if (this.participants.length > 2) {
    return next(new Error('Swap cannot have more than 2 participants'));
  }
  next();
});

export const Swap = model<ISwap>('Swap', swapSchema);