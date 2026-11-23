import mongoose, { Document, Schema, Types } from 'mongoose';
import type { SocialPlatform } from './SocialAccount.ts';

export interface IReport extends Document {
  userId: Types.ObjectId;
  title: string;
  reportType: 'weekly' | 'monthly' | 'followers' | 'engagement' | 'platform_comparison' | 'custom';
  dateRange: {
    startDate: Date;
    endDate: Date;
    preset: string;
  };
  platforms: SocialPlatform[];
  summaryMetrics: {
    totalFollowers: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
    totalPosts: number;
  };
  format: 'pdf' | 'csv';
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: 140,
    },
    reportType: {
      type: String,
      enum: ['weekly', 'monthly', 'followers', 'engagement', 'platform_comparison', 'custom'],
      required: true,
    },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      preset: { type: String, default: '30d' },
    },
    platforms: {
      type: [String],
      enum: ['facebook', 'instagram', 'tiktok', 'youtube', 'x'],
      default: ['facebook', 'instagram', 'tiktok', 'youtube', 'x'],
    },
    summaryMetrics: {
      totalFollowers: { type: Number, default: 0 },
      totalLikes: { type: Number, default: 0 },
      totalComments: { type: Number, default: 0 },
      totalShares: { type: Number, default: 0 },
      avgEngagementRate: { type: Number, default: 0 },
      totalPosts: { type: Number, default: 0 },
    },
    format: {
      type: String,
      enum: ['pdf', 'csv'],
      default: 'pdf',
    },
  },
  {
    timestamps: true,
    collection: 'reports',
  }
);

reportSchema.index({ userId: 1, createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);
