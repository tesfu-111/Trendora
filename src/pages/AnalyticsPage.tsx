import React, { useCallback, useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { api, ApiError } from '../services/api.ts';
import type { AnalyticsChartsResponse, DateFilterState, SocialPlatform } from '../types/index.ts';
import { DateFilterBar } from '../components/DateFilterBar.tsx';
import { ChartsGrid } from '../components/ChartsGrid.tsx';

export function AnalyticsPage({
  filters,
  onFilterChange,
}: {
  filters: DateFilterState;
  onFilterChange: (next: DateFilterState) => void;
}) {
  const [charts, setCharts] = useState<AnalyticsChartsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [platform, setPlatform] = useState<SocialPlatform>('instagram');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [followers, setFollowers] = useState('');
  const [followersGained, setFollowersGained] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [impressions, setImpressions] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCharts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({
        range: filters.preset,
        platform: filters.platform,
        ...(filters.preset === 'custom' && filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.preset === 'custom' && filters.endDate ? { endDate: filters.endDate } : {}),
      }).toString();

      const data = await api.get<AnalyticsChartsResponse>(`/api/analytics/charts?${qs}`);
      setCharts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load analytics charts.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadCharts();
  }, [loadCharts]);

  const handleRecordSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/analytics/snapshot', {
        platform,
        date,
        followers: Number(followers) || 0,
        followersGained: Number(followersGained) || 0,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        shares: Number(shares) || 0,
        impressions: impressions ? Number(impressions) : undefined,
      });
      setModalOpen(false);
      await loadCharts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save daily snapshot.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Analytics &amp; Channel Telemetry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive multi-series charts updating dynamically across date windows and platforms.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Daily Metric</span>
        </button>
      </div>

      <DateFilterBar filters={filters} onChange={onFilterChange} />

      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <ChartsGrid charts={charts} loading={loading} />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xl">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Record Daily Analytics Snapshot
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordSnapshot} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="youtube">YouTube</option>
                    <option value="facebook">Facebook</option>
                    <option value="x">X (Twitter)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Total Followers</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={followers}
                    onChange={(e) => setFollowers(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Net Followers Gained</label>
                  <input
                    type="number"
                    value={followersGained}
                    onChange={(e) => setFollowersGained(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Likes</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={likes}
                    onChange={(e) => setLikes(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Comments</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Shares</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Impressions (optional)</label>
                <input
                  type="number"
                  min={0}
                  value={impressions}
                  onChange={(e) => setImpressions(e.target.value)}
                  placeholder="Auto-estimated if omitted"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving…' : 'Save Metric'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
