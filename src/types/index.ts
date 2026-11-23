export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x';
export type ConnectionStatus = 'disconnected' | 'oauth_pending' | 'manual' | 'sample' | 'connected';
export type DatePreset = 'today' | '7d' | '30d' | '90d' | 'custom';

export type NavSection =
  | 'overview'
  | 'social-accounts'
  | 'analytics'
  | 'posts'
  | 'reports'
  | 'settings'
  | 'help';

export interface NotificationPreferences {
  weeklyDigest: boolean;
  milestoneAlerts: boolean;
  engagementDropAlerts: boolean;
  syncNotifications: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  company: string;
  avatarUrl: string;
  themePreference: 'dark' | 'light';
  notifications: NotificationPreferences;
  createdAt?: string;
}

export interface SocialAccountItem {
  id: string;
  platform: SocialPlatform;
  accountName: string;
  handle: string;
  connectionStatus: ConnectionStatus;
  dataSource: 'none' | 'api' | 'manual' | 'sample';
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  postsCount: number;
  lastSyncedAt: string | null;
  apiIntegration: {
    credentialsConfigured: boolean;
    requiredEnvVars: string[];
    scopes: string[];
    docsUrl: string;
    callbackUrl: string;
  };
}

export interface KpiMetric {
  value: number;
  previous: number;
  changePct: number;
  comparisonLabel: string;
}

export interface OverviewResponse {
  hasData: boolean;
  dataModes: ConnectionStatus[];
  dateRange: {
    preset: string;
    startDate: string;
    endDate: string;
  };
  kpis: {
    totalFollowers: KpiMetric;
    totalLikes: KpiMetric;
    totalComments: KpiMetric;
    totalShares: KpiMetric;
    engagementRate: KpiMetric;
    totalPosts: KpiMetric;
  };
}

export interface DailySeriesPoint {
  date: string;
  label: string;
  followers: number;
  followersGained: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
}

export interface WeeklyPerformancePoint {
  week: string;
  likes: number;
  comments: number;
  shares: number;
  followersGained: number;
  engagementRate: number;
}

export interface MonthlyPerformancePoint {
  month: string;
  likes: number;
  comments: number;
  shares: number;
  followersGained: number;
  engagementRate: number;
}

export interface PlatformComparisonPoint {
  platform: SocialPlatform;
  label: string;
  accountName: string;
  connectionStatus: ConnectionStatus;
  followers: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
  postsCount: number;
}

export interface AnalyticsChartsResponse {
  dateRange: {
    preset: string;
    startDate: string;
    endDate: string;
  };
  followersGrowth: DailySeriesPoint[];
  likesCommentsComparison: DailySeriesPoint[];
  engagementOverTime: DailySeriesPoint[];
  weeklyPerformance: WeeklyPerformancePoint[];
  monthlyPerformance: MonthlyPerformancePoint[];
  platformComparison: PlatformComparisonPoint[];
}

export interface PostItem {
  id: string;
  platform: SocialPlatform;
  title: string;
  caption: string;
  mediaType: 'image' | 'video' | 'carousel' | 'short' | 'thread';
  thumbnailUrl: string;
  publishedAt: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  engagementRate: number;
  dataSource: 'none' | 'api' | 'manual' | 'sample';
}

export interface ReportItem {
  id: string;
  title: string;
  reportType: 'weekly' | 'monthly' | 'followers' | 'engagement' | 'platform_comparison' | 'custom';
  dateRange: {
    startDate: string;
    endDate: string;
    preset: string;
  };
  platforms: SocialPlatform[];
  summaryMetrics: {
    totalFollowers: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    avgEngagementRate: number;
    totalPosts: number;
  };
  format: 'pdf' | 'csv';
  createdAt: string;
}

export interface DateFilterState {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  platform: SocialPlatform | 'all';
}
