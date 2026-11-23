import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext.tsx';
import type { AnalyticsChartsResponse } from '../types/index.ts';
import { formatCompactNumber, formatNumber } from '../utils/format.ts';

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="h-[260px] w-full">{children}</div>
    </section>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-slate-900 dark:text-white mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-xs inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-white">
              {entry.name.toLowerCase().includes('rate')
                ? `${Number(entry.value).toFixed(2)}%`
                : formatNumber(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartsGrid({
  charts,
  loading,
}: {
  charts: AnalyticsChartsResponse | null;
  loading: boolean;
}) {
  const { theme } = useAuth();
  const axisColor = theme === 'dark' ? '#94A3B8' : '#64748B';
  const gridColor = theme === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)';

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="h-[340px] rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-5 animate-pulse"
          >
            <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
            <div className="h-3 w-64 bg-slate-100 dark:bg-slate-800/60 rounded mb-6" />
            <div className="h-[220px] w-full bg-slate-100 dark:bg-slate-800/40 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (!charts || charts.followersGrowth.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-10 text-center">
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          No time-series analytics recorded for the selected filter window
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
          Connect an official platform API, log a manual metric snapshot, or load the sample dataset from Overview to populate all six interactive charts.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Followers Growth */}
      <ChartCard
        title="Followers Growth"
        subtitle="Cumulative audience trajectory across selected channels"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={charts.followersGrowth} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactNumber(Number(v))}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="followers"
              name="Total Followers"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#followersGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Likes and Comments Comparison */}
      <ChartCard
        title="Likes & Comments Comparison"
        subtitle="Daily audience reactions versus conversation volume"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.likesCommentsComparison} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactNumber(Number(v))}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="likes" name="Likes" fill="#2563EB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="comments" name="Comments" fill="#7C3AED" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Engagement Rate Over Time */}
      <ChartCard
        title="Engagement Rate Over Time"
        subtitle="Average interaction rate relative to daily impressions (%)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={charts.engagementOverTime} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="engagementRate"
              name="Engagement Rate"
              stroke="#6366F1"
              strokeWidth={2.2}
              dot={charts.engagementOverTime.length <= 15}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Weekly Performance */}
      <ChartCard
        title="Weekly Performance"
        subtitle="Weekly aggregated likes, comments, and shares"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.weeklyPerformance} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="week" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactNumber(Number(v))}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="likes" name="Likes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="shares" name="Shares" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 5. Monthly Performance */}
      <ChartCard
        title="Monthly Performance"
        subtitle="6-month audience gain and interaction cadence"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={charts.monthlyPerformance} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="monthlyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactNumber(Number(v))}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Area
              type="monotone"
              dataKey="likes"
              name="Monthly Likes"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#monthlyGrad)"
            />
            <Area
              type="monotone"
              dataKey="followersGained"
              name="Followers Gained"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 6. Social Platform Comparison */}
      <ChartCard
        title="Social Platform Comparison"
        subtitle="Followers and interaction volume segmented by network"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={charts.platformComparison} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactNumber(Number(v))}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="followers" name="Followers" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="likes" name="Period Likes" fill="#7C3AED" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
