import type { Response } from 'express';
import { Types } from 'mongoose';
import { Post } from '../models/Post.ts';
import { SocialAccount, type SocialPlatform } from '../models/SocialAccount.ts';
import { apiError, apiSuccess, type AuthenticatedRequest } from '../middleware/auth.ts';
import { ALL_PLATFORMS } from '../utils/seedSampleData.ts';

export async function getPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const search = req.query.search ? String(req.query.search).trim() : '';
    const platform = req.query.platform ? String(req.query.platform) : 'all';
    const mediaType = req.query.mediaType ? String(req.query.mediaType) : 'all';
    const sortBy = req.query.sortBy ? String(req.query.sortBy) : 'engagementRate';

    const query: Record<string, unknown> = { userId };

    if (platform !== 'all' && ALL_PLATFORMS.includes(platform as SocialPlatform)) {
      query.platform = platform;
    }

    if (mediaType !== 'all') {
      query.mediaType = mediaType;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: regex }, { caption: regex }];
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      engagementRate: { engagementRate: -1, likes: -1 },
      likes: { likes: -1 },
      comments: { comments: -1 },
      shares: { shares: -1 },
      newest: { publishedAt: -1 },
      oldest: { publishedAt: 1 },
    };

    const sortSpec = sortMap[sortBy] || sortMap.engagementRate;

    const posts = await Post.find(query).sort(sortSpec).lean();

    apiSuccess(res, {
      posts: posts.map((p) => ({
        ...p,
        id: String(p._id),
      })),
    });
  } catch (err) {
    console.error('[Get Posts Error]', err);
    apiError(res, 'Unable to load posts.', 500);
  }
}

export async function createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const { platform, title, caption, mediaType, thumbnailUrl, publishedAt, likes, comments, shares, impressions } =
      req.body as {
        platform: SocialPlatform;
        title: string;
        caption?: string;
        mediaType?: 'image' | 'video' | 'carousel' | 'short' | 'thread';
        thumbnailUrl?: string;
        publishedAt?: string;
        likes: number;
        comments: number;
        shares: number;
        impressions?: number;
      };

    let account = await SocialAccount.findOne({ userId, platform });
    if (!account) {
      account = await SocialAccount.create({
        userId,
        platform,
        accountName: `${platform.toUpperCase()} Channel`,
        handle: `@${platform}`,
        connectionStatus: 'manual',
        dataSource: 'manual',
      });
    } else if (account.connectionStatus === 'disconnected') {
      account.connectionStatus = 'manual';
      account.dataSource = 'manual';
      account.accountName = account.accountName || `${platform.toUpperCase()} Channel`;
      await account.save();
    }

    const likesNum = Number(likes) || 0;
    const commentsNum = Number(comments) || 0;
    const sharesNum = Number(shares) || 0;
    const impressionsNum = Number(impressions) || Math.max(1000, (likesNum + commentsNum + sharesNum) * 16);
    const engagementRate = Number(
      (((likesNum + commentsNum + sharesNum) / Math.max(impressionsNum, 1)) * 100).toFixed(2)
    );

    const post = await Post.create({
      userId,
      socialAccountId: account._id,
      platform,
      title: title.trim(),
      caption: caption?.trim() || '',
      mediaType: mediaType || 'image',
      thumbnailUrl: thumbnailUrl?.trim() || '',
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      likes: likesNum,
      comments: commentsNum,
      shares: sharesNum,
      impressions: impressionsNum,
      engagementRate,
      dataSource: 'manual',
    });

    await SocialAccount.updateOne({ _id: account._id }, { $inc: { postsCount: 1 } });

    apiSuccess(res, { post: { ...post.toObject(), id: String(post._id) } }, 'Post added to analytics', 201);
  } catch (err) {
    console.error('[Create Post Error]', err);
    apiError(res, 'Unable to save post.', 500);
  }
}

export async function deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const post = await Post.findOneAndDelete({ _id: req.params.id, userId });
    if (!post) {
      apiError(res, 'Post not found.', 404);
      return;
    }

    await SocialAccount.updateOne(
      { _id: post.socialAccountId, postsCount: { $gt: 0 } },
      { $inc: { postsCount: -1 } }
    );

    apiSuccess(res, { deleted: true }, 'Post removed');
  } catch (err) {
    console.error('[Delete Post Error]', err);
    apiError(res, 'Unable to delete post.', 500);
  }
}
