import { Schema, model, Document } from 'mongoose';

export interface ICommentLike extends Document {
  commentId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  username: string;
  createdAt: Date;
}

const commentLikeSchema = new Schema<ICommentLike>({
  commentId: {
    type: Schema.Types.ObjectId,
    ref: 'SwapComment',
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  username: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Compound index to prevent duplicate likes
commentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });

export const CommentLike = model<ICommentLike>('CommentLike', commentLikeSchema);
