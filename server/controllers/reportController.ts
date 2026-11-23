import type { Response } from 'express';
import { Types } from 'mongoose';
import { Report } from '../models/Report.ts';
import { Analytics } from '../models/Analytics.ts';
import { SocialAccount, type SocialPlatform } from '../models/SocialAccount.ts';
import { Post } from '../models/Post.ts';
import { apiError, apiSuccess, type AuthenticatedRequest } from '../middleware/auth.ts';
import { ALL_PLATFORMS } from '../utils/seedSampleData.ts';

function csvEscape(val: unknown): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function getReports(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const reports = await Report.find({ userId }).sort({ createdAt: -1 }).lean();

    apiSuccess(res, {
      reports: reports.map((r) => ({
        ...r,
        id: String(r._id),
      })),
    });
  } catch (err) {
    console.error('[Get Reports Error]', err);
    apiError(res, 'Unable to load reports.', 500);
  }
}

export async function generateReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const { title, reportType, startDate, endDate, preset, platforms, format } = req.body as {
      title: string;
      reportType: 'weekly' | 'monthly' | 'followers' | 'engagement' | 'platform_comparison' | 'custom';
      startDate: string;
      endDate: string;
      preset?: string;
      platforms?: SocialPlatform[];
      format?: 'pdf' | 'csv';
    };

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);

    const selectedPlatforms =
      platforms && platforms.length > 0
        ? platforms.filter((p) => ALL_PLATFORMS.includes(p))
        : ALL_PLATFORMS;

    const [accounts, rows, postsCount] = await Promise.all([
      SocialAccount.find({ userId, platform: { $in: selectedPlatforms } }).lean(),
      Analytics.find({
        userId,
        platform: { $in: selectedPlatforms },
        date: { $gte: start, $lte: end },
      }).lean(),
      Post.countDocuments({
        userId,
        platform: { $in: selectedPlatforms },
        publishedAt: { $gte: start, $lte: end },
      }),
    ]);

    const totalFollowers = accounts.reduce((s, a) => s + a.followers, 0);
    const totalLikes = rows.reduce((s, r) => s + r.likes, 0);
    const totalComments = rows.reduce((s, r) => s + r.comments, 0);
    const totalShares = rows.reduce((s, r) => s + r.shares, 0);
    const avgEngagementRate =
      rows.length > 0
        ? Number((rows.reduce((s, r) => s + r.engagementRate, 0) / rows.length).toFixed(2))
        : 0;

    const report = await Report.create({
      userId,
      title: title.trim(),
      reportType,
      dateRange: {
        startDate: start,
        endDate: end,
        preset: preset || 'custom',
      },
      platforms: selectedPlatforms,
      summaryMetrics: {
        totalFollowers,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagementRate,
        totalPosts: postsCount,
      },
      format: format || 'pdf',
    });

    apiSuccess(res, { report: { ...report.toObject(), id: String(report._id) } }, 'Report generated', 201);
  } catch (err) {
    console.error('[Generate Report Error]', err);
    apiError(res, 'Unable to generate report.', 500);
  }
}

export async function exportCsvReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const startStr = req.query.startDate ? String(req.query.startDate) : '';
    const endStr = req.query.endDate ? String(req.query.endDate) : '';
    const platformsParam = req.query.platforms ? String(req.query.platforms).split(',') : ALL_PLATFORMS;

    const end = endStr ? new Date(endStr) : new Date();
    end.setUTCHours(23, 59, 59, 999);
    const start = startStr ? new Date(startStr) : new Date(end.getTime() - 29 * 86400000);
    start.setUTCHours(0, 0, 0, 0);

    const selectedPlatforms = platformsParam.filter((p) => ALL_PLATFORMS.includes(p as SocialPlatform));

    const rows = await Analytics.find({
      userId,
      platform: { $in: selectedPlatforms.length ? selectedPlatforms : ALL_PLATFORMS },
      date: { $gte: start, $lte: end },
    })
      .sort({ date: -1, platform: 1 })
      .lean();

    const header = [
      'Date',
      'Platform',
      'Followers',
      'Followers Gained',
      'Likes',
      'Comments',
      'Shares',
      'Impressions',
      'Engagement Rate (%)',
      'Data Source',
    ].join(',');

    const lines = rows.map((r) =>
      [
        r.date.toISOString().slice(0, 10),
        r.platform,
        r.followers,
        r.followersGained,
        r.likes,
        r.comments,
        r.shares,
        r.impressions,
        r.engagementRate,
        r.dataSource,
      ]
        .map(csvEscape)
        .join(',')
    );

    const csvContent = [header, ...lines].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="trendora-analytics-${start.toISOString().slice(0, 10)}-to-${end.toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('[Export CSV Error]', err);
    apiError(res, 'Unable to export CSV report.', 500);
  }
}

export async function deleteReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = new Types.ObjectId(req.userId);
    const deleted = await Report.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      apiError(res, 'Report not found.', 404);
      return;
    }
    apiSuccess(res, { deleted: true }, 'Report deleted');
  } catch (err) {
    console.error('[Delete Report Error]', err);
    apiError(res, 'Unable to delete report.', 500);
  }
}
