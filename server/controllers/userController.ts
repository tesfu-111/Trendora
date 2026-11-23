import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.ts';
import { apiError, apiSuccess, type AuthenticatedRequest } from '../middleware/auth.ts';

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { name, email, jobTitle, company } = req.body as {
      name?: string;
      email?: string;
      jobTitle?: string;
      company?: string;
    };

    const user = await User.findById(req.userId);
    if (!user) {
      apiError(res, 'User not found.', 404);
      return;
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const exists = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
      if (exists) {
        apiError(res, 'That email address is already in use.', 409);
        return;
      }
      user.email = email.toLowerCase().trim();
    }

    if (name !== undefined) user.name = name.trim();
    if (jobTitle !== undefined) user.jobTitle = jobTitle.trim();
    if (company !== undefined) user.company = company.trim();

    await user.save();

    apiSuccess(
      res,
      {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          company: user.company,
          avatarUrl: user.avatarUrl,
          themePreference: user.themePreference,
          notifications: user.notifications,
          createdAt: user.createdAt,
        },
      },
      'Profile updated'
    );
  } catch (err) {
    console.error('[Update Profile Error]', err);
    apiError(res, 'Unable to update profile.', 500);
  }
}

export async function uploadAvatar(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.file) {
      apiError(res, 'Please select an image file (PNG, JPG, or WebP under 2MB).', 400);
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      apiError(res, 'User not found.', 404);
      return;
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();

    apiSuccess(res, { avatarUrl }, 'Profile photo updated');
  } catch (err) {
    console.error('[Upload Avatar Error]', err);
    apiError(res, 'Unable to upload profile photo.', 500);
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await User.findById(req.userId).select('+passwordHash');
    if (!user) {
      apiError(res, 'User not found.', 404);
      return;
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      apiError(res, 'Current password is incorrect.', 401);
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    apiSuccess(res, { updated: true }, 'Password changed successfully');
  } catch (err) {
    console.error('[Change Password Error]', err);
    apiError(res, 'Unable to change password.', 500);
  }
}

export async function updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { themePreference, notifications } = req.body as {
      themePreference?: 'dark' | 'light';
      notifications?: {
        weeklyDigest?: boolean;
        milestoneAlerts?: boolean;
        engagementDropAlerts?: boolean;
        syncNotifications?: boolean;
      };
    };

    const user = await User.findById(req.userId);
    if (!user) {
      apiError(res, 'User not found.', 404);
      return;
    }

    if (themePreference === 'dark' || themePreference === 'light') {
      user.themePreference = themePreference;
    }

    if (notifications) {
      user.notifications = {
        weeklyDigest: notifications.weeklyDigest ?? user.notifications.weeklyDigest,
        milestoneAlerts: notifications.milestoneAlerts ?? user.notifications.milestoneAlerts,
        engagementDropAlerts: notifications.engagementDropAlerts ?? user.notifications.engagementDropAlerts,
        syncNotifications: notifications.syncNotifications ?? user.notifications.syncNotifications,
      };
    }

    await user.save();

    apiSuccess(
      res,
      {
        themePreference: user.themePreference,
        notifications: user.notifications,
      },
      'Preferences saved'
    );
  } catch (err) {
    console.error('[Update Preferences Error]', err);
    apiError(res, 'Unable to save preferences.', 500);
  }
}
