import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, Download, FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import { api, ApiError } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type {
  AnalyticsChartsResponse,
  PostItem,
  ReportItem,
  SocialPlatform,
} from '../types/index.ts';
import {
  formatCompactNumber,
  formatDateShort,
  generatePdfReport,
} from '../utils/format.ts';

const REPORT_TYPES: Array<{
  id: ReportItem['reportType'];
  label: string;
  desc: string;
}> = [
  { id: 'weekly', label: 'Weekly Analytics', desc: '7-day engagement & reaction velocity' },
  { id: 'monthly', label: 'Monthly Analytics', desc: '30-day executive channel performance' },
  { id: 'followers', label: 'Followers Growth', desc: 'Audience acquisition across channels' },
  { id: 'engagement', label: 'Engagement Report', desc: 'Likes, comments, shares & rate benchmarks' },
  { id: 'platform_comparison', label: 'Platform Comparison', desc: 'Network-by-network share & ROI' },
  { id: 'custom', label: 'Custom Range', desc: 'Custom start and end reporting dates' },
];

const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'x'];

export function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [charts, setCharts] = useState<AnalyticsChartsResponse | null>(null);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Report Builder state
  const [reportType, setReportType] = useState<ReportItem['reportType']>('monthly');
  const [title, setTitle] = useState('Monthly Social Performance Report');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(ALL_PLATFORMS);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({
        range: 'custom',
        startDate,
        endDate,
      }).toString();

      const [repRes, chartRes, postRes] = await Promise.all([
        api.get<{ reports: ReportItem[] }>('/api/reports'),
        api.get<AnalyticsChartsResponse>(`/api/analytics/charts?${qs}`),
        api.get<{ posts: PostItem[] }>('/api/posts?sortBy=engagementRate'),
      ]);

      setReports(repRes.reports);
      setCharts(chartRes);
      setPosts(postRes.posts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectReportType = (nextType: ReportItem['reportType']) => {
    setReportType(nextType);
    const end = new Date();
    const start = new Date();
    if (nextType === 'weekly') {
      start.setDate(end.getDate() - 7);
      setTitle('Weekly Social Analytics Report');
    } else if (nextType === 'monthly') {
      start.setDate(end.getDate() - 30);
      setTitle('Monthly Social Performance Report');
    } else if (nextType === 'followers') {
      start.setDate(end.getDate() - 90);
      setTitle('Followers Growth Report');
    } else if (nextType === 'engagement') {
      start.setDate(end.getDate() - 30);
      setTitle('Engagement & Interaction Report');
    } else if (nextType === 'platform_comparison') {
      start.setDate(end.getDate() - 30);
      setTitle('Cross-Platform Comparison Report');
    } else {
      setTitle('Custom Range Analytics Report');
    }
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const togglePlatform = (p: SocialPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((item) => item !== p) : prev) : [...prev, p]
    );
  };

  const handleSaveAndExport = async (format: 'pdf' | 'csv') => {
    setGenerating(true);
    setError('');
    setNotice('');
    try {
      const res = await api.post<{ report: ReportItem }>('/api/reports', {
        title,
        reportType,
        startDate,
        endDate,
        preset: 'custom',
        platforms: selectedPlatforms,
        format,
      });

      if (format === 'csv') {
        await api.downloadCsv(
          `/api/reports/export/csv?startDate=${startDate}&endDate=${endDate}&platforms=${selectedPlatforms.join(',')}`,
          `trendora-${reportType}-${startDate}-to-${endDate}.csv`
        );
        setNotice('CSV report downloaded and snapshot saved.');
      } else {
        const filteredPlatforms = (charts?.platformComparison || []).filter((p) =>
          selectedPlatforms.includes(p.platform)
        );
        const filteredPosts = posts.filter((p) => selectedPlatforms.includes(p.platform));

        generatePdfReport({
          title: res.report.title,
          reportType: res.report.reportType,
          startDate,
          endDate,
          summaryMetrics: res.report.summaryMetrics,
          platformComparison: filteredPlatforms,
          topPosts: filteredPosts,
          workspaceOwner: user?.name || 'Workspace Owner',
        });
        setNotice('PDF report exported and snapshot saved.');
      }

      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to generate report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleReExportPdf = (rep: ReportItem) => {
    const filteredPlatforms = (charts?.platformComparison || []).filter((p) =>
      rep.platforms.includes(p.platform)
    );
    const filteredPosts = posts.filter((p) => rep.platforms.includes(p.platform));
    generatePdfReport({
      title: rep.title,
      reportType: rep.reportType,
      startDate: rep.dateRange.startDate,
      endDate: rep.dateRange.endDate,
      summaryMetrics: rep.summaryMetrics,
      platformComparison: filteredPlatforms,
      topPosts: filteredPosts,
      workspaceOwner: user?.name || 'Workspace Owner',
    });
  };

  const handleReExportCsv = async (rep: ReportItem) => {
    const s = rep.dateRange.startDate.slice(0, 10);
    const e = rep.dateRange.endDate.slice(0, 10);
    await api.downloadCsv(
      `/api/reports/export/csv?startDate=${s}&endDate=${e}&platforms=${rep.platforms.join(',')}`,
      `trendora-${rep.reportType}-${s}-to-${e}.csv`
    );
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await api.del(`/api/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to delete report.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Reports &amp; Exports
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Compile weekly, monthly, growth, and platform comparison reports in PDF or CSV format.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {notice && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-sm text-blue-700 dark:text-blue-300">
          {notice}
        </div>
      )}

      {/* Report Builder Card */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Configure Custom Report
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a report template, custom date boundaries, and target social channels.
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_TYPES.map((rt) => {
            const active = reportType === rt.id;
            return (
              <button
                key={rt.id}
                type="button"
                onClick={() => handleSelectReportType(rt.id)}
                className={`p-3.5 rounded-lg border text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-blue-600 bg-blue-600/5 dark:bg-blue-600/10'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-white">{rt.label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{rt.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
          <div className="lg:col-span-5">
            <label className="block text-xs font-medium mb-1.5">Report Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="lg:col-span-4">
            <label className="block text-xs font-medium mb-1.5">Reporting Date Range</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                aria-label="Report start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent font-mono w-full focus:outline-none"
              />
              <span className="text-slate-400">–</span>
              <input
                type="date"
                aria-label="Report end date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent font-mono w-full focus:outline-none"
              />
            </div>
          </div>

          <div className="lg:col-span-3 flex items-end gap-2.5">
            <button
              type="button"
              disabled={generating}
              onClick={() => handleSaveAndExport('pdf')}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              type="button"
              disabled={generating}
              onClick={() => handleSaveAndExport('csv')}
              className="flex-1 py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Platform Toggle Bar */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Channels:</span>
          {ALL_PLATFORMS.map((p) => {
            const active = selectedPlatforms.includes(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors capitalize cursor-pointer ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {p === 'x' ? 'X (Twitter)' : p}
              </button>
            );
          })}
        </div>
      </section>

      {/* Saved Reports History Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Saved Report Snapshots
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical summaries persisted in MongoDB for instant PDF and CSV re-download
          </p>
        </div>

        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
            No saved reports yet. Use the builder above to export your first PDF or CSV report.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/80 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-5">Report Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Date Window</th>
                  <th className="py-3 px-4 text-right">Followers</th>
                  <th className="py-3 px-4 text-right">Likes</th>
                  <th className="py-3 px-4 text-right">Engagement</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {reports.map((rep) => (
                  <tr
                    key={rep.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-5 font-medium text-slate-900 dark:text-white max-w-[260px] truncate">
                      {rep.title}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300">
                      {rep.reportType.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateShort(rep.dateRange.startDate)} – {formatDateShort(rep.dateRange.endDate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatCompactNumber(rep.summaryMetrics.totalFollowers)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatCompactNumber(rep.summaryMetrics.totalLikes)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-medium text-blue-600 dark:text-blue-400">
                      {rep.summaryMetrics.avgEngagementRate.toFixed(2)}%
                    </td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReExportPdf(rep)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReExportCsv(rep)}
                          className="px-2.5 py-1 text-[11px] font-medium rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          CSV
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReport(rep.id)}
                          aria-label={`Delete report ${rep.title}`}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
