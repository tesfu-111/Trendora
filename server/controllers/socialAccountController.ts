import type { Response } from 'express';
import { Types } from 'mongoose';
import { SocialAccount, type SocialPlatform } from '../models/SocialAccount.ts';
import { Analytics } from '../models/Analytics.ts';
import { Post } from '../models/Post.ts';
import { Report } from '../models/Report.ts';
import { env } from '../config/env.ts';
import { apiError, apiSuccess, type AuthenticatedRequest } from '../middleware/auth.ts';
import {
  ALL_PLATFORMS,
  createDefaultAccountsForUser,
  seedSampleWorkspaceForUser,
} from '../utils/seedSampleData.ts';

export async function getSocialAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    await createDefaultAccountsForUser(userId);

    const accounts = await SocialAccount.find({ userId }).sort({ platform: 1 }).lean();

    const enriched = accounts.map((acc) => {
      const cfg = env.platforms[acc.platform as SocialPlatform];
      return {
        ...acc,
        id: String(acc._id),
        apiIntegration: {
          credentialsConfigured: cfg.configured,
          requiredEnvVars: cfg.requiredVars,
          scopes: cfg.scopes,
          docsUrl: cfg.docsUrl,
          callbackUrl: `${env.appUrl}/api/social-accounts/${acc.platform}/callback`,
        },
      };
    });

    apiSuccess(res, { accounts: enriched });
  } catch (err) {
    console.error('[Get Social Accounts Error]', err);
    apiError(res, 'Unable to load social accounts.', 500);
  }
}

export async function initiatePlatformOAuth(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const platform = req.params.platform as SocialPlatform;
    if (!ALL_PLATFORMS.includes(platform)) {
      apiError(res, 'Unsupported social platform.', 400);
      return;
    }

    const cfg = env.platforms[platform];
    if (!cfg.configured) {
      apiError(
        res,
        `Official ${platform.toUpperCase()} API credentials are not configured on this server (${cfg.requiredVars.join(', ')}). Trendora will never fake a live connection. Configure official OAuth credentials in .env or record verified snapshots manually.`,
        412,
        {
          credentialsConfigured: false,
          requiredEnvVars: cfg.requiredVars,
          docsUrl: cfg.docsUrl,
        }
      );
      return;
    }

    const redirectUri = encodeURIComponent(`${env.appUrl}/api/social-accounts/${platform}/callback`);
    const scopeParam = encodeURIComponent(cfg.scopes.join(' '));
    const state = Buffer.from(`${req.userId}:${platform}:${Date.now()}`).toString('base64url');
    const authUrl = `${cfg.oauthBase}?client_id=${encodeURIComponent(cfg.clientId)}&redirect_uri=${redirectUri}&response_type=code&scope=${scopeParam}&state=${state}`;

    apiSuccess(res, { authUrl, platform, credentialsConfigured: true });
  } catch (err) {
    console.error('[Initiate OAuth Error]', err);
    apiError(res, 'Unable to prepare OAuth authorization URL.', 500);
  }
}

export async function upsertManualAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const platform = req.params.platform as SocialPlatform;
    if (!ALL_PLATFORMS.includes(platform)) {
      apiError(res, 'Unsupported social platform.', 400);
      return;
    }

    const { accountName, handle, followers, likes, comments, shares, engagementRate } = req.body as {
      accountName: string;
      handle: string;
      followers: number;
      likes: number;
      comments?: number;
      shares?: number;
      engagementRate: number;
    };

    const userId = new Types.ObjectId(req.userId);
    const account = await SocialAccount.findOneAndUpdate(
      { userId, platform },
      {
        $set: {
          accountName: accountName.trim(),
          handle: handle.trim(),
          connectionStatus: 'manual',
          dataSource: 'manual',
          followers: Number(followers) || 0,
          likes: Number(likes) || 0,
          comments: Number(comments) || 0,
          shares: Number(shares) || 0,
          engagementRate: Number(engagementRate) || 0,
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);

    await Analytics.findOneAndUpdate(
      { userId, socialAccountId: account._id, date: today },
      {
        $set: {
          platform,
          followers: account.followers,
          followersGained: 0,
          likes: account.likes,
          comments: account.comments,
          shares: account.shares,
          impressions: Math.max(account.followers, (account.likes + account.comments) * 12),
          reach: Math.max(Math.round(account.followers * 0.7), (account.likes + account.comments) * 9),
          engagementRate: account.engagementRate,
          postsPublished: 0,
          dataSource: 'manual',
        },
      },
      { upsert: true }
    );

    apiSuccess(res, { account }, 'Manual account snapshot saved');
  } catch (err) {
    console.error('[Upsert Manual Account Error]', err);
    apiError(res, 'Unable to save account snapshot.', 500);
  }
}

export async function disconnectSocialAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const platform = req.params.platform as SocialPlatform;
    if (!ALL_PLATFORMS.includes(platform)) {
      apiError(res, 'Unsupported social platform.', 400);
      return;
    }

    const userId = new Types.ObjectId(req.userId);
    const account = await SocialAccount.findOneAndUpdate(
      { userId, platform },
      {
        $set: {
          accountName: '',
          handle: '',
          connectionStatus: 'disconnected',
          dataSource: 'none',
          followers: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagementRate: 0,
          postsCount: 0,
          lastSyncedAt: null,
        },
      },
      { new: true }
    );

    await Promise.all([
      Analytics.deleteMany({ userId, platform }),
      Post.deleteMany({ userId, platform }),
    ]);

    apiSuccess(res, { account }, `${platform} disconnected and metrics cleared`);
  } catch (err) {
    console.error('[Disconnect Account Error]', err);
    apiError(res, 'Unable to disconnect social account.', 500);
  }
}

export async function createSocialAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const platform = req.body.platform as SocialPlatform;
    if (!ALL_PLATFORMS.includes(platform)) {
      apiError(res, 'Unsupported social platform.', 400);
      return;
    }

    const { accountName, handle, followers, likes, comments, shares, engagementRate } = req.body as {
      accountName: string;
      handle: string;
      followers: number;
      likes: number;
      comments?: number;
      shares?: number;
      engagementRate: number;
    };

    const userId = new Types.ObjectId(req.userId);
    const account = await SocialAccount.create({
      userId,
      platform,
      accountName: accountName.trim(),
      handle: handle.trim(),
      connectionStatus: 'manual',
      dataSource: 'manual',
      followers: Number(followers) || 0,
      likes: Number(likes) || 0,
      comments: Number(comments) || 0,
      shares: Number(shares) || 0,
      engagementRate: Number(engagementRate) || 0,
      lastSyncedAt: new Date(),
    });

    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);

    await Analytics.findOneAndUpdate(
      { userId, socialAccountId: account._id, date: today },
      {
        $set: {
          platform,
          followers: account.followers,
          followersGained: 0,
          likes: account.likes,
          comments: account.comments,
          shares: account.shares,
          impressions: Math.max(account.followers, (account.likes + account.comments) * 12),
          reach: Math.max(Math.round(account.followers * 0.7), (account.likes + account.comments) * 9),
          engagementRate: account.engagementRate,
          postsPublished: 0,
          dataSource: 'manual',
        },
      },
      { upsert: true }
    );

    apiSuccess(res, { account: { ...account.toObject(), id: String(account._id) } }, 'Social account added', 201);
  } catch (err) {
    console.error('[Create Social Account Error]', err);
    apiError(res, 'Unable to add social account.', 500);
  }
}

export async function updateSocialAccountById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const accountId = req.params.id;
    const { accountName, handle, followers, likes, comments, shares, engagementRate } = req.body as {
      accountName: string;
      handle: string;
      followers: number;
      likes: number;
      comments?: number;
      shares?: number;
      engagementRate: number;
    };

    const account = await SocialAccount.findOneAndUpdate(
      { _id: accountId, userId },
      {
        $set: {
          accountName: accountName.trim(),
          handle: handle.trim(),
          connectionStatus: 'manual',
          dataSource: 'manual',
          followers: Number(followers) || 0,
          likes: Number(likes) || 0,
          comments: Number(comments) || 0,
          shares: Number(shares) || 0,
          engagementRate: Number(engagementRate) || 0,
          lastSyncedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!account) {
      apiError(res, 'Social account not found.', 404);
      return;
    }

    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);

    await Analytics.findOneAndUpdate(
      { userId, socialAccountId: account._id, date: today },
      {
        $set: {
          platform: account.platform,
          followers: account.followers,
          followersGained: 0,
          likes: account.likes,
          comments: account.comments,
          shares: account.shares,
          impressions: Math.max(account.followers, (account.likes + account.comments) * 12),
          reach: Math.max(Math.round(account.followers * 0.7), (account.likes + account.comments) * 9),
          engagementRate: account.engagementRate,
          postsPublished: 0,
          dataSource: 'manual',
        },
      },
      { upsert: true }
    );

    apiSuccess(res, { account: { ...account.toObject(), id: String(account._id) } }, 'Social account updated');
  } catch (err) {
    console.error('[Update Social Account Error]', err);
    apiError(res, 'Unable to update social account.', 500);
  }
}

export async function deleteSocialAccountById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const target = await SocialAccount.findOne({ _id: req.params.id, userId });
    if (!target) {
      apiError(res, 'Social account not found.', 404);
      return;
    }

    const samePlatformCount = await SocialAccount.countDocuments({ userId, platform: target.platform });

    if (samePlatformCount > 1) {
      await SocialAccount.deleteOne({ _id: target._id, userId });
      await Promise.all([
        Analytics.deleteMany({ userId, socialAccountId: target._id }),
        Post.deleteMany({ userId, socialAccountId: target._id }),
      ]);
      apiSuccess(res, { deleted: true }, `${target.accountName || target.platform} removed`);
      return;
    }

    // Keep base platform slot in disconnected state
    target.accountName = '';
    target.handle = '';
    target.connectionStatus = 'disconnected';
    target.dataSource = 'none';
    target.followers = 0;
    target.likes = 0;
    target.comments = 0;
    target.shares = 0;
    target.engagementRate = 0;
    target.postsCount = 0;
    target.lastSyncedAt = null;
    await target.save();

    await Promise.all([
      Analytics.deleteMany({ userId, platform: target.platform }),
      Post.deleteMany({ userId, platform: target.platform }),
    ]);

    apiSuccess(res, { account: target }, `${target.platform} disconnected and metrics cleared`);
  } catch (err) {
    console.error('[Delete Social Account Error]', err);
    apiError(res, 'Unable to remove social account.', 500);
  }
}

export async function loadSampleWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    await seedSampleWorkspaceForUser(req.userId!);
    apiSuccess(res, { loaded: true }, 'Sample analytics dataset loaded (labeled as Sample Dataset)');
  } catch (err) {
    console.error('[Load Sample Workspace Error]', err);
    apiError(res, 'Unable to load sample dataset.', 500);
  }
}

export async function clearSampleWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    await Promise.all([
      Analytics.deleteMany({ userId }),
      Post.deleteMany({ userId }),
      Report.deleteMany({ userId }),
      SocialAccount.deleteMany({ userId }),
    ]);
    await createDefaultAccountsForUser(userId);
    apiSuccess(res, { cleared: true }, 'Workspace reset to clean disconnected state');
  } catch (err) {
    console.error('[Clear Workspace Error]', err);
    apiError(res, 'Unable to clear workspace data.', 500);
  }
}
