import type { Response } from 'express';
import { Types } from 'mongoose';
import { Analytics } from '../models/Analytics.ts';
import { SocialAccount, type SocialPlatform } from '../models/SocialAccount.ts';
import { Post } from '../models/Post.ts';
import { apiError, apiSuccess, type AuthenticatedRequest } from '../middleware/auth.ts';
import { ALL_PLATFORMS, createDefaultAccountsForUser } from '../utils/seedSampleData.ts';

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X (Twitter)',
};

function resolveDateRange(range?: string, startStr?: string, endStr?: string) {
  const now = new Date();
  const end = endStr ? new Date(endStr) : new Date(now);
  end.setUTCHours(23, 59, 59, 999);

  let start = new Date(end);
  let days = 30;

  if (range === 'today') {
    days = 1;
    start.setUTCDate(end.getUTCDate());
  } else if (range === '7d') {
    days = 7;
    start.setUTCDate(end.getUTCDate() - 6);
  } else if (range === '90d') {
    days = 90;
    start.setUTCDate(end.getUTCDate() - 89);
  } else if (range === 'custom' && startStr) {
    start = new Date(startStr);
    days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  } else {
    days = 30;
    start.setUTCDate(end.getUTCDate() - 29);
  }

  start.setUTCHours(0, 0, 0, 0);

  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevEnd.getUTCDate() - (days - 1));
  prevStart.setUTCHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd, days };
}

function calcGrowthPct(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export async function getDashboardOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    await createDefaultAccountsForUser(userId);

    const range = String(req.query.range || '30d');
    const platformParam = req.query.platform ? String(req.query.platform) : 'all';
    const { start, end, prevStart, prevEnd, days } = resolveDateRange(
      range,
      req.query.startDate ? String(req.query.startDate) : undefined,
      req.query.endDate ? String(req.query.endDate) : undefined
    );

    const platformFilter =
      platformParam !== 'all' && ALL_PLATFORMS.includes(platformParam as SocialPlatform)
        ? { platform: platformParam as SocialPlatform }
        : {};

    const [accounts, currentRows, prevRows, currentPostsCount, prevPostsCount] = await Promise.all([
      SocialAccount.find({ userId, ...platformFilter }).lean(),
      Analytics.find({ userId, ...platformFilter, date: { $gte: start, $lte: end } })
        .sort({ date: 1 })
        .lean(),
      Analytics.find({ userId, ...platformFilter, date: { $gte: prevStart, $lte: prevEnd } }).lean(),
      Post.countDocuments({ userId, ...platformFilter, publishedAt: { $gte: start, $lte: end } }),
      Post.countDocuments({ userId, ...platformFilter, publishedAt: { $gte: prevStart, $lte: prevEnd } }),
    ]);

    const activeAccounts = accounts.filter((a) => a.connectionStatus !== 'disconnected');
    const hasData = activeAccounts.length > 0 || currentRows.length > 0;

    const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followers || 0), 0);

    const prevFollowersByPlatform = new Map<string, number>();
    for (const row of prevRows) {
      const existing = prevFollowersByPlatform.get(row.platform) || 0;
      if (row.followers > existing) {
        prevFollowersByPlatform.set(row.platform, row.followers);
      }
    }
    const prevFollowers = Array.from(prevFollowersByPlatform.values()).reduce((sum, v) => sum + v, 0);

    const totalLikes = currentRows.reduce((s, r) => s + r.likes, 0) || activeAccounts.reduce((s, a) => s + a.likes, 0);
    const totalComments = currentRows.reduce((s, r) => s + r.comments, 0) || activeAccounts.reduce((s, a) => s + a.comments, 0);
    const totalShares = currentRows.reduce((s, r) => s + r.shares, 0) || activeAccounts.reduce((s, a) => s + a.shares, 0);

    const prevLikes = prevRows.reduce((s, r) => s + r.likes, 0);
    const prevComments = prevRows.reduce((s, r) => s + r.comments, 0);
    const prevShares = prevRows.reduce((s, r) => s + r.shares, 0);

    const avgEngagement =
      currentRows.length > 0
        ? Number((currentRows.reduce((s, r) => s + r.engagementRate, 0) / currentRows.length).toFixed(2))
        : activeAccounts.length > 0
          ? Number((activeAccounts.reduce((s, a) => s + a.engagementRate, 0) / activeAccounts.length).toFixed(2))
          : 0;

    const prevAvgEngagement =
      prevRows.length > 0
        ? Number((prevRows.reduce((s, r) => s + r.engagementRate, 0) / prevRows.length).toFixed(2))
        : 0;

    const totalPostsAll = currentPostsCount || activeAccounts.reduce((s, a) => s + a.postsCount, 0);

    const comparisonLabel = `vs prev. ${days === 1 ? 'day' : `${days}d`}`;

    const kpis = {
      totalFollowers: {
        value: totalFollowers,
        previous: prevFollowers,
        changePct: calcGrowthPct(totalFollowers, prevFollowers),
        comparisonLabel,
      },
      totalLikes: {
        value: totalLikes,
        previous: prevLikes,
        changePct: calcGrowthPct(totalLikes, prevLikes),
        comparisonLabel,
      },
      totalComments: {
        value: totalComments,
        previous: prevComments,
        changePct: calcGrowthPct(totalComments, prevComments),
        comparisonLabel,
      },
      totalShares: {
        value: totalShares,
        previous: prevShares,
        changePct: calcGrowthPct(totalShares, prevShares),
        comparisonLabel,
      },
      engagementRate: {
        value: avgEngagement,
        previous: prevAvgEngagement,
        changePct: calcGrowthPct(avgEngagement, prevAvgEngagement),
        comparisonLabel,
      },
      totalPosts: {
        value: totalPostsAll,
        previous: prevPostsCount,
        changePct: calcGrowthPct(totalPostsAll, prevPostsCount),
        comparisonLabel,
      },
    };

    const dataModes = Array.from(new Set(activeAccounts.map((a) => a.connectionStatus)));

    apiSuccess(res, {
      hasData,
      dataModes,
      dateRange: {
        preset: range,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      kpis,
    });
  } catch (err) {
    console.error('[Overview Error]', err);
    apiError(res, 'Unable to load dashboard overview.', 500);
  }
}

export async function getAnalyticsCharts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const range = String(req.query.range || '30d');
    const platformParam = req.query.platform ? String(req.query.platform) : 'all';

    const { start, end } = resolveDateRange(
      range,
      req.query.startDate ? String(req.query.startDate) : undefined,
      req.query.endDate ? String(req.query.endDate) : undefined
    );

    const platformFilter =
      platformParam !== 'all' && ALL_PLATFORMS.includes(platformParam as SocialPlatform)
        ? { platform: platformParam as SocialPlatform }
        : {};

    const sixMonthsAgo = new Date(end);
    sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 5);
    sixMonthsAgo.setUTCDate(1);
    sixMonthsAgo.setUTCHours(0, 0, 0, 0);

    const [rangeRows, monthlyRows, accounts] = await Promise.all([
      Analytics.find({ userId, ...platformFilter, date: { $gte: start, $lte: end } })
        .sort({ date: 1 })
        .lean(),
      Analytics.find({ userId, ...platformFilter, date: { $gte: sixMonthsAgo, $lte: end } })
        .sort({ date: 1 })
        .lean(),
      SocialAccount.find({ userId }).sort({ platform: 1 }).lean(),
    ]);

    const dailyMap = new Map<
      string,
      {
        dateIso: string;
        dateLabel: string;
        followers: number;
        followersGained: number;
        likes: number;
        comments: number;
        shares: number;
        impressions: number;
        engSum: number;
        count: number;
      }
    >();

    for (const row of rangeRows) {
      const key = row.date.toISOString().slice(0, 10);
      const curr = dailyMap.get(key) || {
        dateIso: key,
        dateLabel: formatShortDate(row.date),
        followers: 0,
        followersGained: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        engSum: 0,
        count: 0,
      };
      curr.followers += row.followers;
      curr.followersGained += row.followersGained;
      curr.likes += row.likes;
      curr.comments += row.comments;
      curr.shares += row.shares;
      curr.impressions += row.impressions;
      curr.engSum += row.engagementRate;
      curr.count += 1;
      dailyMap.set(key, curr);
    }

    const dailySeries = Array.from(dailyMap.values()).map((d) => ({
      date: d.dateIso,
      label: d.dateLabel,
      followers: d.followers,
      followersGained: d.followersGained,
      likes: d.likes,
      comments: d.comments,
      shares: d.shares,
      impressions: d.impressions,
      engagementRate: Number((d.engSum / Math.max(d.count, 1)).toFixed(2)),
    }));

    const weeklyMap = new Map<
      string,
      {
        weekLabel: string;
        sortKey: string;
        likes: number;
        comments: number;
        shares: number;
        followersGained: number;
        engSum: number;
        count: number;
      }
    >();

    for (const d of dailySeries) {
      const dt = new Date(`${d.date}T12:00:00Z`);
      const dayOfWeek = dt.getUTCDay();
      const weekStart = new Date(dt);
      weekStart.setUTCDate(dt.getUTCDate() - dayOfWeek);
      const sortKey = weekStart.toISOString().slice(0, 10);
      const weekLabel = `Wk ${formatShortDate(weekStart)}`;

      const curr = weeklyMap.get(sortKey) || {
        weekLabel,
        sortKey,
        likes: 0,
        comments: 0,
        shares: 0,
        followersGained: 0,
        engSum: 0,
        count: 0,
      };
      curr.likes += d.likes;
      curr.comments += d.comments;
      curr.shares += d.shares;
      curr.followersGained += d.followersGained;
      curr.engSum += d.engagementRate;
      curr.count += 1;
      weeklyMap.set(sortKey, curr);
    }

    const weeklyPerformance = Array.from(weeklyMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((w) => ({
        week: w.weekLabel,
        likes: w.likes,
        comments: w.comments,
        shares: w.shares,
        followersGained: w.followersGained,
        engagementRate: Number((w.engSum / Math.max(w.count, 1)).toFixed(2)),
      }));

    const monthlyMap = new Map<
      string,
      {
        sortKey: string;
        monthLabel: string;
        likes: number;
        comments: number;
        shares: number;
        followersGained: number;
        engSum: number;
        count: number;
      }
    >();

    for (const row of monthlyRows) {
      const sortKey = row.date.toISOString().slice(0, 7);
      const monthLabel = row.date.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
        timeZone: 'UTC',
      });
      const curr = monthlyMap.get(sortKey) || {
        sortKey,
        monthLabel,
        likes: 0,
        comments: 0,
        shares: 0,
        followersGained: 0,
        engSum: 0,
        count: 0,
      };
      curr.likes += row.likes;
      curr.comments += row.comments;
      curr.shares += row.shares;
      curr.followersGained += row.followersGained;
      curr.engSum += row.engagementRate;
      curr.count += 1;
      monthlyMap.set(sortKey, curr);
    }

    const monthlyPerformance = Array.from(monthlyMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map((m) => ({
        month: m.monthLabel,
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        followersGained: m.followersGained,
        engagementRate: Number((m.engSum / Math.max(m.count, 1)).toFixed(2)),
      }));

    const rangeByPlatform = new Map<
      SocialPlatform,
      { likes: number; comments: number; shares: number; impressions: number; engSum: number; count: number }
    >();
    for (const row of rangeRows) {
      const p = row.platform as SocialPlatform;
      const curr = rangeByPlatform.get(p) || {
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
        engSum: 0,
        count: 0,
      };
      curr.likes += row.likes;
      curr.comments += row.comments;
      curr.shares += row.shares;
      curr.impressions += row.impressions;
      curr.engSum += row.engagementRate;
      curr.count += 1;
      rangeByPlatform.set(p, curr);
    }

    const platformComparison = ALL_PLATFORMS.map((p) => {
      const platformAccounts = accounts.filter((a) => a.platform === p);
      const agg = rangeByPlatform.get(p);
      const totalFollowersForPlatform = platformAccounts.reduce((s, a) => s + (a.followers || 0), 0);
      const totalLikesForPlatform = platformAccounts.reduce((s, a) => s + (a.likes || 0), 0);
      const totalCommentsForPlatform = platformAccounts.reduce((s, a) => s + (a.comments || 0), 0);
      const totalSharesForPlatform = platformAccounts.reduce((s, a) => s + (a.shares || 0), 0);
      const totalPostsForPlatform = platformAccounts.reduce((s, a) => s + (a.postsCount || 0), 0);
      const activePlatformAccs = platformAccounts.filter((a) => a.connectionStatus !== 'disconnected');
      const activeAcc = activePlatformAccs[0] || platformAccounts[0];
      const avgAccEng =
        activePlatformAccs.length > 0
          ? Number(
              (
                activePlatformAccs.reduce((s, a) => s + (a.engagementRate || 0), 0) /
                activePlatformAccs.length
              ).toFixed(2)
            )
          : 0;

      return {
        platform: p,
        label: PLATFORM_LABELS[p],
        accountName:
          platformAccounts.filter((a) => a.accountName).map((a) => a.accountName).join(', ') || '',
        connectionStatus: activeAcc?.connectionStatus || 'disconnected',
        followers: totalFollowersForPlatform,
        likes: agg ? agg.likes : totalLikesForPlatform,
        comments: agg ? agg.comments : totalCommentsForPlatform,
        shares: agg ? agg.shares : totalSharesForPlatform,
        impressions: agg ? agg.impressions : 0,
        engagementRate: agg
          ? Number((agg.engSum / Math.max(agg.count, 1)).toFixed(2))
          : Number.isFinite(avgAccEng)
            ? avgAccEng
            : 0,
        postsCount: totalPostsForPlatform,
      };
    });

    apiSuccess(res, {
      dateRange: {
        preset: range,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      followersGrowth: dailySeries,
      likesCommentsComparison: dailySeries,
      engagementOverTime: dailySeries,
      weeklyPerformance,
      monthlyPerformance,
      platformComparison,
    });
  } catch (err) {
    console.error('[Analytics Charts Error]', err);
    apiError(res, 'Unable to load analytics charts.', 500);
  }
}

export async function recordMetricSnapshot(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const { platform, date, followers, followersGained, likes, comments, shares, impressions, engagementRate } =
      req.body as {
        platform: SocialPlatform;
        date: string;
        followers: number;
        followersGained?: number;
        likes: number;
        comments: number;
        shares: number;
        impressions?: number;
        engagementRate?: number;
      };

    const account = await SocialAccount.findOneAndUpdate(
      { userId, platform },
      {
        $setOnInsert: {
          accountName: `${PLATFORM_LABELS[platform]} Account`,
          handle: `@${platform}`,
          connectionStatus: 'manual',
          dataSource: 'manual',
        },
        $set: {
          followers: Number(followers),
          lastSyncedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    if (account.connectionStatus === 'disconnected') {
      account.connectionStatus = 'manual';
      account.dataSource = 'manual';
      await account.save();
    }

    const snapshotDate = new Date(date);
    snapshotDate.setUTCHours(12, 0, 0, 0);

    const computedImpressions = Number(impressions) || Math.max(Number(followers), (Number(likes) + Number(comments)) * 15);
    const computedEngagement =
      engagementRate !== undefined
        ? Number(engagementRate)
        : Number((((Number(likes) + Number(comments) + Number(shares)) / Math.max(computedImpressions, 1)) * 100).toFixed(2));

    const entry = await Analytics.findOneAndUpdate(
      { userId, socialAccountId: account._id, date: snapshotDate },
      {
        $set: {
          platform,
          followers: Number(followers),
          followersGained: Number(followersGained) || 0,
          likes: Number(likes),
          comments: Number(comments),
          shares: Number(shares),
          impressions: computedImpressions,
          reach: Math.round(computedImpressions * 0.78),
          engagementRate: computedEngagement,
          postsPublished: 1,
          dataSource: 'manual',
        },
      },
      { upsert: true, new: true }
    );

    apiSuccess(res, { entry }, 'Analytics snapshot recorded', 201);
  } catch (err) {
    console.error('[Record Metric Error]', err);
    apiError(res, 'Unable to record analytics snapshot.', 500);
  }
}
