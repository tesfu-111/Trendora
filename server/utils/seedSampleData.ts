import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';
import { User } from '../models/User.ts';
import { SocialAccount, type SocialPlatform } from '../models/SocialAccount.ts';
import { Analytics } from '../models/Analytics.ts';
import { Post } from '../models/Post.ts';
import { Report } from '../models/Report.ts';

export const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];

export async function createDefaultAccountsForUser(userId: Types.ObjectId | string): Promise<void> {
  const uid = new Types.ObjectId(userId);
  const ops = ALL_PLATFORMS.map((platform) => ({
    updateOne: {
      filter: { userId: uid, platform },
      update: {
        $setOnInsert: {
          userId: uid,
          platform,
          accountName: '',
          handle: '',
          connectionStatus: 'disconnected' as const,
          dataSource: 'none' as const,
          followers: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          engagementRate: 0,
          postsCount: 0,
          lastSyncedAt: null,
        },
      },
      upsert: true,
    },
  }));

  await SocialAccount.bulkWrite(ops);
}

interface SamplePlatformProfile {
  platform: SocialPlatform;
  accountName: string;
  handle: string;
  baseFollowers: number;
  dailyGrowth: number;
  dailyLikes: number;
  dailyComments: number;
  dailyShares: number;
  dailyImpressions: number;
  engagementRate: number;
}

const SAMPLE_PROFILES: SamplePlatformProfile[] = [
  {
    platform: 'instagram',
    accountName: 'Meridian Studio',
    handle: '@meridian.studio',
    baseFollowers: 41200,
    dailyGrowth: 94,
    dailyLikes: 1480,
    dailyComments: 132,
    dailyShares: 98,
    dailyImpressions: 34200,
    engagementRate: 4.9,
  },
  {
    platform: 'tiktok',
    accountName: 'Meridian Labs',
    handle: '@meridianlabs',
    baseFollowers: 63400,
    dailyGrowth: 185,
    dailyLikes: 2890,
    dailyComments: 215,
    dailyShares: 310,
    dailyImpressions: 62500,
    engagementRate: 5.8,
  },
  {
    platform: 'youtube',
    accountName: 'Meridian Channel',
    handle: '@MeridianChannel',
    baseFollowers: 28900,
    dailyGrowth: 58,
    dailyLikes: 920,
    dailyComments: 148,
    dailyShares: 76,
    dailyImpressions: 24800,
    engagementRate: 4.3,
  },
  {
    platform: 'x',
    accountName: 'Meridian HQ',
    handle: '@meridianhq',
    baseFollowers: 19600,
    dailyGrowth: 41,
    dailyLikes: 540,
    dailyComments: 84,
    dailyShares: 122,
    dailyImpressions: 19400,
    engagementRate: 3.6,
  },
  {
    platform: 'facebook',
    accountName: 'Meridian Official',
    handle: 'facebook.com/meridianstudio',
    baseFollowers: 24100,
    dailyGrowth: 32,
    dailyLikes: 485,
    dailyComments: 69,
    dailyShares: 88,
    dailyImpressions: 18100,
    engagementRate: 3.1,
  },
];

function deterministicWave(dayIdx: number, seed: number): number {
  const wave = Math.sin((dayIdx + seed * 3) * 0.45) * 0.18 + Math.cos((dayIdx + seed) * 0.23) * 0.12;
  return 1 + wave;
}

export async function seedSampleWorkspaceForUser(userId: Types.ObjectId | string): Promise<void> {
  const uid = new Types.ObjectId(userId);

  await Promise.all([
    Analytics.deleteMany({ userId: uid }),
    Post.deleteMany({ userId: uid }),
    Report.deleteMany({ userId: uid }),
    SocialAccount.deleteMany({ userId: uid }),
  ]);

  const now = new Date();
  now.setUTCHours(12, 0, 0, 0);

  const accountMap = new Map<SocialPlatform, Types.ObjectId>();
  const analyticsDocs: Array<Record<string, unknown>> = [];

  for (let pIdx = 0; pIdx < SAMPLE_PROFILES.length; pIdx++) {
    const profile = SAMPLE_PROFILES[pIdx];
    let cumulativeFollowers = profile.baseFollowers;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    const accountDoc = await SocialAccount.create({
      userId: uid,
      platform: profile.platform,
      accountName: profile.accountName,
      handle: profile.handle,
      connectionStatus: 'sample',
      dataSource: 'sample',
      followers: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: profile.engagementRate,
      postsCount: 0,
      lastSyncedAt: new Date(),
    });

    accountMap.set(profile.platform, accountDoc._id as Types.ObjectId);

    for (let dayOffset = 179; dayOffset >= 0; dayOffset--) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - dayOffset);

      const factor = deterministicWave(179 - dayOffset, pIdx + 1);
      const gained = Math.max(4, Math.round(profile.dailyGrowth * factor));
      cumulativeFollowers += gained;

      const likes = Math.round(profile.dailyLikes * factor);
      const comments = Math.round(profile.dailyComments * factor);
      const shares = Math.round(profile.dailyShares * factor);
      const impressions = Math.round(profile.dailyImpressions * factor);
      const reach = Math.round(impressions * 0.78);
      const eng = Number((((likes + comments + shares) / Math.max(impressions, 1)) * 100).toFixed(2));
      const postsPublished = (179 - dayOffset + pIdx) % 3 === 0 ? 1 : 0;

      totalLikes += likes;
      totalComments += comments;
      totalShares += shares;

      analyticsDocs.push({
        userId: uid,
        socialAccountId: accountDoc._id,
        platform: profile.platform,
        date: d,
        followers: cumulativeFollowers,
        followersGained: gained,
        likes,
        comments,
        shares,
        impressions,
        reach,
        engagementRate: eng,
        postsPublished,
        dataSource: 'sample',
      });
    }

    await SocialAccount.updateOne(
      { _id: accountDoc._id },
      {
        $set: {
          followers: cumulativeFollowers,
          likes: totalLikes,
          comments: totalComments,
          shares: totalShares,
          postsCount: 4,
        },
      }
    );
  }

  await Analytics.insertMany(analyticsDocs);

  const samplePosts = [
    {
      platform: 'instagram' as SocialPlatform,
      title: 'Acoustic Desk Speaker — Industrial Design Breakdown',
      caption: 'Behind the anodized aluminum enclosure and acoustic dispersion geometry of our Series II studio speaker.',
      mediaType: 'carousel' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_product_launch_1794782729413.jpg',
      daysAgo: 2,
      likes: 4820,
      comments: 318,
      shares: 412,
      impressions: 84200,
      engagementRate: 6.59,
    },
    {
      platform: 'tiktok' as SocialPlatform,
      title: '60-Second Studio Lighting Rig Setup for Creators',
      caption: 'How we light matte surfaces and architectural portraits with one key softbox and negative fill.',
      mediaType: 'short' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_behind_scenes_1794782730543.jpg',
      daysAgo: 4,
      likes: 11450,
      comments: 642,
      shares: 1290,
      impressions: 192400,
      engagementRate: 6.96,
    },
    {
      platform: 'youtube' as SocialPlatform,
      title: 'Brand Strategy Keynote: Building Trust in Digital Ecosystems',
      caption: 'Full 18-minute keynote talk covering audience retention metrics, editorial cadence, and multi-channel attribution.',
      mediaType: 'video' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_analytics_keynote_1794782730115.jpg',
      daysAgo: 7,
      likes: 3290,
      comments: 284,
      shares: 198,
      impressions: 61500,
      engagementRate: 6.13,
    },
    {
      platform: 'x' as SocialPlatform,
      title: 'Q4 Content Cadence & Audience Retention Benchmarks Thread',
      caption: 'We analyzed 120 creator campaigns across 5 platforms. Here are the 4 posting cadence patterns that held attention.',
      mediaType: 'thread' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_studio_workspace_1794782730784.jpg',
      daysAgo: 9,
      likes: 1840,
      comments: 196,
      shares: 425,
      impressions: 48900,
      engagementRate: 5.03,
    },
    {
      platform: 'facebook' as SocialPlatform,
      title: 'Inside Our Morning Product Sketching Workflow',
      caption: 'Why physical sketching still precedes every digital interface sprint inside our design studio.',
      mediaType: 'image' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_studio_workspace_1794782730784.jpg',
      daysAgo: 12,
      likes: 1420,
      comments: 112,
      shares: 174,
      impressions: 36800,
      engagementRate: 4.64,
    },
    {
      platform: 'instagram' as SocialPlatform,
      title: 'Cinema Rig Behind-the-Scenes: Autumn Brand Film',
      caption: 'Shooting on 35mm primes in natural loft light for our seasonal campaign reel.',
      mediaType: 'video' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_behind_scenes_1794782730543.jpg',
      daysAgo: 16,
      likes: 3910,
      comments: 245,
      shares: 308,
      impressions: 71400,
      engagementRate: 6.25,
    },
    {
      platform: 'tiktok' as SocialPlatform,
      title: 'Unboxing the Matte Navy Acoustic Prototype',
      caption: 'First hands-on look at the CNC milled top dial and touch-capacitive telemetry ring.',
      mediaType: 'short' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_product_launch_1794782729413.jpg',
      daysAgo: 21,
      likes: 8640,
      comments: 410,
      shares: 845,
      impressions: 148000,
      engagementRate: 6.69,
    },
    {
      platform: 'youtube' as SocialPlatform,
      title: 'Cross-Platform Analytics Retrospective (90-Day Review)',
      caption: 'Breaking down subscriber velocity, watch-time retention, and comment sentiment across all channels.',
      mediaType: 'video' as const,
      thumbnailUrl: '/src/assets/images/post_thumb_analytics_keynote_1794782730115.jpg',
      daysAgo: 28,
      likes: 2740,
      comments: 218,
      shares: 162,
      impressions: 54100,
      engagementRate: 5.77,
    },
  ];

  await Post.insertMany(
    samplePosts.map((p) => {
      const publishedAt = new Date(now);
      publishedAt.setUTCDate(now.getUTCDate() - p.daysAgo);
      return {
        userId: uid,
        socialAccountId: accountMap.get(p.platform),
        platform: p.platform,
        title: p.title,
        caption: p.caption,
        mediaType: p.mediaType,
        thumbnailUrl: p.thumbnailUrl,
        publishedAt,
        likes: p.likes,
        comments: p.comments,
        shares: p.shares,
        impressions: p.impressions,
        engagementRate: p.engagementRate,
        permalink: '',
        dataSource: 'sample',
      };
    })
  );

  for (const platform of ALL_PLATFORMS) {
    const count = samplePosts.filter((p) => p.platform === platform).length;
    await SocialAccount.updateOne({ userId: uid, platform }, { $set: { postsCount: count } });
  }

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(now.getUTCDate() - 30);

  await Report.create([
    {
      userId: uid,
      title: 'Monthly Cross-Platform Engagement Summary (Sample)',
      reportType: 'monthly',
      dateRange: {
        startDate: thirtyDaysAgo,
        endDate: now,
        preset: '30d',
      },
      platforms: ALL_PLATFORMS,
      summaryMetrics: {
        totalFollowers: 251000,
        totalLikes: 189450,
        totalComments: 19440,
        totalShares: 20820,
        avgEngagementRate: 4.74,
        totalPosts: samplePosts.length,
      },
      format: 'pdf',
    },
    {
      userId: uid,
      title: 'Weekly Audience Growth Snapshot (Sample)',
      reportType: 'weekly',
      dateRange: {
        startDate: new Date(now.getTime() - 7 * 86400000),
        endDate: now,
        preset: '7d',
      },
      platforms: ['instagram', 'tiktok', 'youtube'],
      summaryMetrics: {
        totalFollowers: 193800,
        totalLikes: 37100,
        totalComments: 3465,
        totalShares: 3388,
        avgEngagementRate: 5.12,
        totalPosts: 4,
      },
      format: 'csv',
    },
  ]);
}

export async function ensureDemoUserExists(): Promise<void> {
  const demoEmail = 'demo@trendora.io';
  const existing = await User.findOne({ email: demoEmail });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash('DemoPass123!', 10);
  const demoUser = await User.create({
    name: 'Elena Vance',
    email: demoEmail,
    passwordHash,
    jobTitle: 'Head of Digital Analytics',
    company: 'Meridian Studio',
    avatarUrl: '/src/assets/images/avatar_creator_profile_1794782729078.jpg',
    themePreference: 'dark',
    notifications: {
      weeklyDigest: true,
      milestoneAlerts: true,
      engagementDropAlerts: true,
      syncNotifications: false,
    },
  });

  await seedSampleWorkspaceForUser(demoUser._id as Types.ObjectId);
  console.log('[Seed] Demo workspace ready (demo@trendora.io / DemoPass123!)');
}
