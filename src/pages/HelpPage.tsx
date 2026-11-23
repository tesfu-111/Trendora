import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Shield, Terminal } from 'lucide-react';

const FAQS = [
  {
    q: 'Why do newly created accounts show Disconnected instead of live follower counts?',
    a: 'Trendora enforces strict data integrity. Rather than fabricating live platform telemetry, every new workspace starts honestly disconnected until you configure official OAuth API credentials, log verified snapshots manually, or explicitly load the labeled Sample Dataset.',
  },
  {
    q: 'How do I enable official OAuth connections for Meta, TikTok, YouTube, and X?',
    a: 'Add your registered developer application credentials (META_APP_ID / META_APP_SECRET, TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET, YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET, X_CLIENT_ID / X_CLIENT_SECRET) to your backend .env file and register the matching callback URL shown inside each Social Account integration modal.',
  },
  {
    q: 'How is Engagement Rate calculated across posts and daily snapshots?',
    a: 'Engagement Rate is computed as ((Likes + Comments + Shares) / Impressions) × 100. When recording manual post or daily snapshots, you can enter exact impressions or let Trendora store the derived baseline.',
  },
  {
    q: 'Are PDF and CSV exports generated from live database queries?',
    a: 'Yes. CSV exports stream directly from the MongoDB analytics collection filtered by your selected start date, end date, and social channels. PDF reports compile real executive summary metrics, platform breakdowns, and top posts.',
  },
];

const API_GUIDES = [
  {
    platform: 'Facebook & Instagram (Meta Graph API)',
    vars: 'META_APP_ID, META_APP_SECRET',
    scopes: 'pages_show_list, pages_read_engagement, instagram_basic, instagram_manage_insights',
    url: 'https://developers.facebook.com/docs/instagram-api',
  },
  {
    platform: 'TikTok Display & Research API',
    vars: 'TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET',
    scopes: 'user.info.basic, user.info.stats, video.list',
    url: 'https://developers.tiktok.com/doc/display-api-overview',
  },
  {
    platform: 'YouTube Data & Analytics API v3',
    vars: 'YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET',
    scopes: 'youtube.readonly, yt-analytics.readonly',
    url: 'https://developers.google.com/youtube/v3',
  },
  {
    platform: 'X (Twitter) API v2',
    vars: 'X_CLIENT_ID, X_CLIENT_SECRET',
    scopes: 'tweet.read, users.read, offline.access',
    url: 'https://developer.x.com/en/docs/x-api',
  },
];

export function HelpPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Help &amp; API Integration Guide
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Documentation for connecting official social platform APIs, managing MongoDB Atlas, and exporting reports.
        </p>
      </div>

      {/* Official API Configuration Matrix */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Official Social Media API Readiness
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {API_GUIDES.map((guide) => (
            <div key={guide.platform} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{guide.platform}</h4>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                  Env: {guide.vars}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Scopes: {guide.scopes}
                </p>
              </div>
              <a
                href={guide.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 shrink-0"
              >
                <span>Developer Docs</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6 space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={item.q} className="py-3">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left text-xs font-semibold text-slate-900 dark:text-white cursor-pointer"
                >
                  <span>{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
