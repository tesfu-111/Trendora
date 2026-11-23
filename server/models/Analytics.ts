import mongoose, { Document, Schema, Types } from 'mongoose';
import type { DataSourceType, SocialPlatform } from './SocialAccount.ts';

export interface IAnalytics extends Document {
  userId: Types.ObjectId;
  socialAccountId: Types.ObjectId;
  platform: SocialPlatform;
  date: Date;
  followers: number;
  followersGained: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  engagementRate: number;
  postsPublished: number;
  dataSource: DataSourceType;
  createdAt: Date;
  updatedAt: Date;
}

const analyticsSchema = new Schema<IAnalytics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    socialAccountId: {
      type: Schema.Types.ObjectId,
      ref: 'SocialAccount',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'tiktok', 'youtube', 'x'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    followers: {
      type: Number,
      required: true,
      min: 0,
    },
    followersGained: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    comments: {
      type: Number,
      default: 0,
      min: 0,
    },
    shares: {
      type: Number,
      default: 0,
      min: 0,
    },
    impressions: {
      type: Number,
      default: 0,
      min: 0,
    },
    reach: {
      type: Number,
      default: 0,
      min: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    postsPublished: {
      type: Number,
      default: 0,
      min: 0,
    },
    dataSource: {
      type: String,
      enum: ['none', 'api', 'manual', 'sample'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
    collection: 'analytics',
  }
);

analyticsSchema.index({ userId: 1, socialAccountId: 1, date: 1 }, { unique: true });

export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema);
