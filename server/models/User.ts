import mongoose, { Document, Schema } from 'mongoose';

export interface NotificationPreferences {
  weeklyDigest: boolean;
  milestoneAlerts: boolean;
  engagementDropAlerts: boolean;
  syncNotifications: boolean;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  jobTitle: string;
  company: string;
  avatarUrl: string;
  themePreference: 'dark' | 'light';
  notifications: NotificationPreferences;
  resetTokenHash?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    jobTitle: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Social Media Strategist',
    },
    company: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Independent Workspace',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    themePreference: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark',
    },
    notifications: {
      weeklyDigest: { type: Boolean, default: true },
      milestoneAlerts: { type: Boolean, default: true },
      engagementDropAlerts: { type: Boolean, default: true },
      syncNotifications: { type: Boolean, default: false },
    },
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetTokenExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model<IUser>('User', userSchema);
