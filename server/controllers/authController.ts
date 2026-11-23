import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.ts';
import { env } from '../config/env.ts';
import { apiError, apiSuccess, type AuthenticatedRequest } from '../middleware/auth.ts';
import { createDefaultAccountsForUser } from '../utils/seedSampleData.ts';

function signToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

function sanitizeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  jobTitle: string;
  company: string;
  avatarUrl: string;
  themePreference: 'dark' | 'light';
  notifications: {
    weeklyDigest: boolean;
    milestoneAlerts: boolean;
    engagementDropAlerts: boolean;
    syncNotifications: boolean;
  };
  createdAt: Date;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    jobTitle: user.jobTitle,
    company: user.company,
    avatarUrl: user.avatarUrl,
    themePreference: user.themePreference,
    notifications: user.notifications,
    createdAt: user.createdAt,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, jobTitle, company } = req.body as {
      name: string;
      email: string;
      password: string;
      jobTitle?: string;
      company?: string;
    };

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      apiError(res, 'An account with this email already exists.', 409);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      jobTitle: jobTitle?.trim() || 'Social Media Strategist',
      company: company?.trim() || 'Independent Workspace',
      themePreference: 'dark',
    });

    await createDefaultAccountsForUser(String(user._id));

    const token = signToken(String(user._id));
    apiSuccess(
      res,
      {
        token,
        user: sanitizeUser(user),
      },
      'Account created successfully',
      201
    );
  } catch (err) {
    console.error('[Register Error]', err);
    apiError(res, 'Unable to register account.', 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      apiError(res, 'Invalid email or password.', 401);
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      apiError(res, 'Invalid email or password.', 401);
      return;
    }

    const token = signToken(String(user._id));
    apiSuccess(
      res,
      {
        token,
        user: sanitizeUser(user),
      },
      'Signed in successfully'
    );
  } catch (err) {
    console.error('[Login Error]', err);
    apiError(res, 'Unable to sign in.', 500);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  apiSuccess(res, { loggedOut: true }, 'Signed out successfully');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      apiSuccess(
        res,
        { emailSent: true },
        'If an account matches that email, password reset instructions have been generated.'
      );
      return;
    }

    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetTokenHash = tokenHash;
    user.resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    apiSuccess(
      res,
      {
        emailSent: true,
        ...(env.nodeEnv !== 'production' ? { devResetToken: rawToken } : {}),
      },
      'Password reset token generated. It expires in 30 minutes.'
    );
  } catch (err) {
    console.error('[Forgot Password Error]', err);
    apiError(res, 'Unable to process password reset request.', 500);
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, newPassword } = req.body as { token: string; newPassword: string };
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpires');

    if (!user) {
      apiError(res, 'Reset token is invalid or has expired.', 400);
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    apiSuccess(res, { reset: true }, 'Password has been reset. You can now sign in.');
  } catch (err) {
    console.error('[Reset Password Error]', err);
    apiError(res, 'Unable to reset password.', 500);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      apiError(res, 'User not found.', 404);
      return;
    }
    apiSuccess(res, { user: sanitizeUser(user) });
  } catch (err) {
    console.error('[GetMe Error]', err);
    apiError(res, 'Unable to load profile.', 500);
  }
}
