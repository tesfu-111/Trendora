import React from 'react';
import { Calendar } from 'lucide-react';
import type { DateFilterState, DatePreset, SocialPlatform } from '../types/index.ts';

const PRESETS: Array<{ id: DatePreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'custom', label: 'Custom' },
];

export function DateFilterBar({
  filters,
  onChange,
  showPlatformSelect = true,
}: {
  filters: DateFilterState;
  onChange: (next: DateFilterState) => void;
  showPlatformSelect?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {PRESETS.map((preset) => {
          const active = filters.preset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange({ ...filters, preset: preset.id })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                active
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {filters.preset === 'custom' && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="date"
              aria-label="Start date"
              value={filters.startDate}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
            />
            <span className="text-slate-400">–</span>
            <input
              type="date"
              aria-label="End date"
              value={filters.endDate}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
              className="bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
            />
          </div>
        )}

        {showPlatformSelect && (
          <select
            aria-label="Filter by social platform"
            value={filters.platform}
            onChange={(e) =>
              onChange({ ...filters, platform: e.target.value as SocialPlatform | 'all' })
            }
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
            <option value="x">X (Twitter)</option>
          </select>
        )}
      </div>
    </div>
  );
}
