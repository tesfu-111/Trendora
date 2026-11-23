import mongoose, { Document, Schema, Types } from 'mongoose';
import type { DataSourceType, SocialPlatform } from './SocialAccount.ts';

export interface IPost extends Document {
  userId: Types.ObjectId;
  socialAccountId: Types.ObjectId;
  platform: SocialPlatform;
  title: string;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel' | 'short' | 'thread';
  thumbnailUrl: string;
  publishedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
  permalink: string;
  dataSource: DataSourceType;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
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
    title: {
      type: String,
      required: [true, 'Post title is required'],
      trim: true,
      maxlength: 160,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'carousel', 'short', 'thread'],
      default: 'image',
    },
    thumbnailUrl: {
      type: String,
      default: '',
    },
    publishedAt: {
      type: Date,
      required: true,
      default: Date.now,
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
    engagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    permalink: {
      type: String,
      default: '',
    },
    dataSource: {
      type: String,
      enum: ['none', 'api', 'manual', 'sample'],
      default: 'manual',
    },
  },
  {
    timestamps: true,
    collection: 'posts',
  }
);

postSchema.index({ userId: 1, publishedAt: -1 });
postSchema.index({ userId: 1, engagementRate: -1 });
postSchema.index({ userId: 1, platform: 1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
