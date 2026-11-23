import React from 'react';
import type { SocialPlatform } from '../types/index.ts';

export const PLATFORM_META: Record<
  SocialPlatform,
  {
    name: string;
    color: string;
    bgClass: string;
    textClass: string;
    metricLabel: string;
  }
> = {
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    bgClass: 'bg-blue-600/10 text-blue-600 dark:text-blue-400',
    textClass: 'text-blue-600 dark:text-blue-400',
    metricLabel: 'Followers',
  },
  instagram: {
    name: 'Instagram',
    color: '#8B5CF6',
    bgClass: 'bg-violet-600/10 text-violet-600 dark:text-violet-400',
    textClass: 'text-violet-600 dark:text-violet-400',
    metricLabel: 'Followers',
  },
  tiktok: {
    name: 'TikTok',
    color: '#06B6D4',
    bgClass: 'bg-cyan-600/10 text-cyan-600 dark:text-cyan-400',
    textClass: 'text-cyan-600 dark:text-cyan-400',
    metricLabel: 'Followers',
  },
  youtube: {
    name: 'YouTube',
    color: '#EF4444',
    bgClass: 'bg-red-600/10 text-red-600 dark:text-red-400',
    textClass: 'text-red-600 dark:text-red-400',
    metricLabel: 'Subscribers',
  },
  x: {
    name: 'X (Twitter)',
    color: '#64748B',
    bgClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
    textClass: 'text-slate-700 dark:text-slate-300',
    metricLabel: 'Followers',
  },
};

export function PlatformLogo({
  platform,
  className = 'w-5 h-5',
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M22 12.07C22 6.49 17.52 2 12 2S2 6.49 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.03H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.9 3.78-3.9 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.78l-.44 2.9h-2.34V22c4.78-.8 8.43-4.94 8.43-9.93z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6a2.6 2.6 0 0 1 3.43-2.46V9.66a5.7 5.7 0 0 0-.83-.06A5.7 5.7 0 0 0 4.15 15.3c0 3.15 2.55 5.7 5.7 5.7a5.7 5.7 0 0 0 5.7-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.25-1.48z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M21.58 7.19a2.75 2.75 0 0 0-1.94-1.94C17.93 4.8 12 4.8 12 4.8s-5.93 0-7.64.45a2.75 2.75 0 0 0-1.94 1.94A28.8 28.8 0 0 0 2 12a28.8 28.8 0 0 0 .42 4.81 2.75 2.75 0 0 0 1.94 1.94c1.71.45 7.64.45 7.64.45s5.93 0 7.64-.45a2.75 2.75 0 0 0 1.94-1.94A28.8 28.8 0 0 0 22 12a28.8 28.8 0 0 0-.42-4.81zM10 15.1V8.9l5.2 3.1-5.2 3.1z" />
        </svg>
      );
    case 'x':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
  }
}
