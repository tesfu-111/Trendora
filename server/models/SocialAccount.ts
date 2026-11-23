import mongoose, { Document, Schema, Types } from 'mongoose';

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x';
export type ConnectionStatus = 'disconnected' | 'oauth_pending' | 'manual' | 'sample' | 'connected';
export type DataSourceType = 'none' | 'api' | 'manual' | 'sample';

export interface ISocialAccount extends Document {
  userId: Types.ObjectId;
  platform: SocialPlatform;
  accountName: string;
  handle: string;
  connectionStatus: ConnectionStatus;
  dataSource: DataSourceType;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  postsCount: number;
  externalAccountId?: string;
  lastSyncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const socialAccountSchema = new Schema<ISocialAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'tiktok', 'youtube', 'x'],
      required: true,
    },
    accountName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    handle: {
      type: String,
      trim: true,
      default: '',
      maxlength: 100,
    },
    connectionStatus: {
      type: String,
      enum: ['disconnected', 'oauth_pending', 'manual', 'sample', 'connected'],
      default: 'disconnected',
    },
    dataSource: {
      type: String,
      enum: ['none', 'api', 'manual', 'sample'],
      default: 'none',
    },
    followers: {
      type: Number,
      default: 0,
      min: 0,
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
    engagementRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    externalAccountId: {
      type: String,
      default: '',
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'socialAccounts',
  }
);

socialAccountSchema.index({ userId: 1, platform: 1 });

export const SocialAccount = mongoose.model<ISocialAccount>('SocialAccount', socialAccountSchema);
