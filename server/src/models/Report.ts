import { Schema, model } from 'mongoose';
import { IReport, ReportType, ReportStatus } from '@/types';

const reportSchema = new Schema<IReport>({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter is required'],
    index: true,
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reportedContent: {
    type: Schema.Types.ObjectId,
    refPath: 'contentType',
    default: null,
  },
  contentType: {
    type: String,
    enum: ['user', 'media', 'message', 'comment'],
    required: [true, 'Content type is required'],
  },
  type: {
    type: String,
    enum: Object.values(ReportType),
    required: [true, 'Report type is required'],
  },
  description: {
    type: String,
    required: [true, 'Report description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  status: {
    type: String,
    enum: Object.values(ReportStatus),
    default: ReportStatus.PENDING,
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  resolution: {
    type: String,
    trim: true,
    maxlength: [500, 'Resolution cannot exceed 500 characters'],
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
reportSchema.index({ reporter: 1, createdAt: -1 });
reportSchema.index({ reportedUser: 1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ type: 1 });
reportSchema.index({ reviewedBy: 1 });

export const Report = model<IReport>('Report', reportSchema);