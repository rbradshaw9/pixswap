import { Schema, model, Document } from 'mongoose';

// Track which content each user has seen to avoid showing duplicates
export interface IUserContentView extends Document {
  userId: string;
  contentId: string;
  viewedAt: Date;
}

const userContentViewSchema = new Schema<IUserContentView>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  contentId: {
    type: String,
    required: true,
    index: true,
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for efficient queries
userContentViewSchema.index({ userId: 1, contentId: 1 }, { unique: true });
userContentViewSchema.index({ userId: 1, viewedAt: -1 });

// TTL index - auto-delete views older than 30 days to keep collection manageable
userContentViewSchema.index({ viewedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const UserContentView = model<IUserContentView>('UserContentView', userContentViewSchema);
