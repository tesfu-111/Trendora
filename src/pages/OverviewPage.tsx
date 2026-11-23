import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  FileText,
  Heart,
  MessageSquare,
  Share2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api, ApiError } from '../services/api.ts';
import type {
  AnalyticsChartsResponse,
  DateFilterState,
  NavSection,
  OverviewResponse,
  PostItem,
} from '../types/index.ts';
import { DateFilterBar } from '../components/DateFilterBar.tsx';
import { ChartsGrid } from '../components/ChartsGrid.tsx';
import { PlatformLogo, PLATFORM_META } from '../components/PlatformIcon.tsx';
import { formatCompactNumber, formatDateShort, formatNumber } from '../utils/format.ts';

function KpiCard({
  label,
  value,
  changePct,
  comparisonLabel,
  icon: Icon,
  isPercentage = false,
}: {
  label: string;
  value: number;
  changePct: number;
  comparisonLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  isPercentage?: boolean;
}) {
  const isPositive = changePct >= 0;
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-5 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-tight font-mono tabular-nums text-slate-900 dark:text-white">
        {isPercentage ? `${value.toFixed(2)}%` : formatCompactNumber(value)}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-0.5 font-medium font-mono tabular-nums ${
            isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          {isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5" />
          )}
          {isPositive ? '+' : ''}
          {changePct.toFixed(1)}%
        </span>
        <span className="text-slate-400" aria-hidden="true">
          ·
        </span>
        <span className="text-slate-500 dark:text-slate-400 truncate">{comparisonLabel}</span>
      </div>
    </div>
  );
}

export function OverviewPage({
  filters,
  onFilterChange,
  onNavigate,
}: {
  filters: DateFilterState;
  onFilterChange: (next: DateFilterState) => void;
  onNavigate: (section: NavSection) => void;
}) {
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [charts, setCharts] = useState<AnalyticsChartsResponse | null>(null);
  const [topPosts, setTopPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({
        range: filters.preset,
        platform: filters.platform,
        ...(filters.preset === 'custom' && filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.preset === 'custom' && filters.endDate ? { endDate: filters.endDate } : {}),
      }).toString();

      const [ov, ch, po] = await Promise.all([
        api.get<OverviewResponse>(`/api/analytics/overview?${qs}`),
        api.get<AnalyticsChartsResponse>(`/api/analytics/charts?${qs}`),
        api.get<{ posts: PostItem[] }>(
          `/api/posts?sortBy=engagementRate${filters.platform !== 'all' ? `&platform=${filters.platform}` : ''}`
        ),
      ]);

      setOverview(ov);
      setCharts(ch);
      setTopPosts(po.posts.slice(0, 5));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load dashboard overview.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLoadSample = async () => {
    setSeeding(true);
    setError('');
    try {
      await api.post('/api/social-accounts/sample/load');
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load sample dataset.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Performance Overview
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregated audience metrics and engagement velocity across your tracked channels.
            </p>
          </div>
          {overview?.dataModes.includes('sample') && (
            <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
              Data Source: Sample Dataset (Unconnected Demo Records)
            </span>
          )}
        </div>

        <DateFilterBar filters={filters} onChange={onFilterChange} />
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Honest Empty Workspace Notice when no accounts connected or sample loaded */}
      {!loading && overview && !overview.hasData && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No social media accounts connected yet
            </h3>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Trendora does not fabricate live platform metrics. Connect an official social API, record a verified manual snapshot, or load our explicitly labeled sample dataset to explore the full analytics suite.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('social-accounts')}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Configure Accounts
            </button>
            <button
              type="button"
              disabled={seeding}
              onClick={handleLoadSample}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors cursor-pointer"
            >
              {seeding ? 'Loading Sample…' : 'Load Sample Dataset'}
            </button>
          </div>
        </div>
      )}

      {/* 6 Required KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading || !overview ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[132px] rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-5 animate-pulse"
            >
              <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="mt-4 h-7 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="mt-3 h-3 w-36 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </div>
          ))
        ) : (
          <>
            <KpiCard
              label="Total Followers"
              value={overview.kpis.totalFollowers.value}
              changePct={overview.kpis.totalFollowers.changePct}
              comparisonLabel={overview.kpis.totalFollowers.comparisonLabel}
              icon={Users}
            />
            <KpiCard
              label="Total Likes"
              value={overview.kpis.totalLikes.value}
              changePct={overview.kpis.totalLikes.changePct}
              comparisonLabel={overview.kpis.totalLikes.comparisonLabel}
              icon={Heart}
            />
            <KpiCard
              label="Total Comments"
              value={overview.kpis.totalComments.value}
              changePct={overview.kpis.totalComments.changePct}
              comparisonLabel={overview.kpis.totalComments.comparisonLabel}
              icon={MessageSquare}
            />
            <KpiCard
              label="Total Shares"
              value={overview.kpis.totalShares.value}
              changePct={overview.kpis.totalShares.changePct}
              comparisonLabel={overview.kpis.totalShares.comparisonLabel}
              icon={Share2}
            />
            <KpiCard
              label="Engagement Rate"
              value={overview.kpis.engagementRate.value}
              changePct={overview.kpis.engagementRate.changePct}
              comparisonLabel={overview.kpis.engagementRate.comparisonLabel}
              icon={Activity}
              isPercentage
            />
            <KpiCard
              label="Total Posts"
              value={overview.kpis.totalPosts.value}
              changePct={overview.kpis.totalPosts.changePct}
              comparisonLabel={overview.kpis.totalPosts.comparisonLabel}
              icon={FileText}
            />
          </>
        )}
      </div>

      {/* Interactive Recharts Overview */}
      <ChartsGrid charts={charts} loading={loading} />

      {/* Top Performing Posts Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Top Performing Content
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked by engagement rate across active channels
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('posts')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all posts</span>
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {topPosts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No published posts logged yet. Visit the Posts section to record or inspect post analytics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Post</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Likes</th>
                  <th className="py-3 px-4 text-right">Comments</th>
                  <th className="py-3 px-4 text-right">Shares</th>
                  <th className="py-3 px-5 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {topPosts.map((post) => {
                  const meta = PLATFORM_META[post.platform];
                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-5 font-medium text-slate-900 dark:text-white max-w-[280px] truncate">
                        {post.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 font-medium ${meta.textClass}`}>
                          <PlatformLogo platform={post.platform} className="w-3.5 h-3.5" />
                          {meta.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap">
                        {formatDateShort(post.publishedAt)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {formatNumber(post.likes)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {formatNumber(post.comments)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {formatNumber(post.shares)}
                      </td>
                      <td className="py-3 px-5 text-right font-mono tabular-nums font-semibold text-blue-600 dark:text-blue-400">
                        {post.engagementRate.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
