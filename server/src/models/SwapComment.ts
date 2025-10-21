import { Schema, model, Document } from 'mongoose';

export interface ISwapComment extends Document {
  contentId: string; // Reference to contentPool content ID
  author: Schema.Types.ObjectId;
  username: string; // Denormalized for faster access
  text: string;
  type: 'like' | 'comment';
  createdAt: Date;
  updatedAt: Date;
}

const swapCommentSchema = new Schema<ISwapComment>({
  contentId: {
    type: String,
    required: [true, 'Content ID is required'],
    index: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
    index: true,
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
  },
  text: {
    type: String,
    required: function(this: ISwapComment) {
      return this.type === 'comment';
    },
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
  },
  type: {
    type: String,
    enum: ['like', 'comment'],
    required: true,
    default: 'comment',
  },
}, {
  timestamps: true,
});

// Indexes for efficient queries
swapCommentSchema.index({ contentId: 1, createdAt: -1 });
swapCommentSchema.index({ author: 1, contentId: 1 });
swapCommentSchema.index({ type: 1, contentId: 1 });

export const SwapComment = model<ISwapComment>('SwapComment', swapCommentSchema);
