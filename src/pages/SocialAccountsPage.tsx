import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  KeyRound,
  Link2Off,
  Plus,
  RefreshCw,
  TrendingUp,
  X,
} from 'lucide-react';
import { api, ApiError } from '../services/api.ts';
import type { SocialAccountItem, SocialPlatform } from '../types/index.ts';
import { PlatformLogo, PLATFORM_META } from '../components/PlatformIcon.tsx';
import { formatCompactNumber, formatDateShort } from '../utils/format.ts';

function statusSummary(acc: SocialAccountItem) {
  switch (acc.connectionStatus) {
    case 'connected':
      return {
        label: 'Live OAuth Connected',
        className: 'text-emerald-600 dark:text-emerald-400',
        icon: CheckCircle2,
      };
    case 'manual':
      return {
        label: 'Manual Account',
        className: 'text-blue-600 dark:text-blue-400',
        icon: Database,
      };
    case 'sample':
      return {
        label: 'Sample Dataset (Demo)',
        className: 'text-violet-600 dark:text-violet-400',
        icon: Database,
      };
    default:
      return {
        label: 'Not Connected',
        className: 'text-slate-500 dark:text-slate-400',
        icon: Link2Off,
      };
  }
}

export function SocialAccountsPage({
  onViewPlatformAnalytics,
}: {
  onViewPlatformAnalytics: (platform: SocialPlatform) => void;
}) {
  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyAction, setBusyAction] = useState(false);

  // Configure existing account modal
  const [selected, setSelected] = useState<SocialAccountItem | null>(null);
  const [modalTab, setModalTab] = useState<'oauth' | 'manual'>('manual');
  const [oauthMessage, setOauthMessage] = useState('');

  // Add new account modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>('instagram');

  // Shared form fields
  const [accountName, setAccountName] = useState('');
  const [handle, setHandle] = useState('');
  const [followers, setFollowers] = useState('');
  const [likes, setLikes] = useState('');
  const [comments, setComments] = useState('');
  const [shares, setShares] = useState('');
  const [engagementRate, setEngagementRate] = useState('');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<{ accounts: SocialAccountItem[] }>('/api/social-accounts');
      setAccounts(data.accounts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load social accounts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const openConfigureModal = (acc: SocialAccountItem) => {
    setSelected(acc);
    setModalTab(acc.connectionStatus === 'disconnected' ? 'manual' : 'manual');
    setOauthMessage('');
    setAccountName(acc.accountName || '');
    setHandle(acc.handle || '');
    setFollowers(acc.followers ? String(acc.followers) : '');
    setLikes(acc.likes ? String(acc.likes) : '');
    setComments(acc.comments ? String(acc.comments) : '');
    setShares(acc.shares ? String(acc.shares) : '');
    setEngagementRate(acc.engagementRate ? String(acc.engagementRate) : '');
  };

  const openAddAccountModal = () => {
    setNewPlatform('instagram');
    setAccountName('');
    setHandle('');
    setFollowers('');
    setLikes('');
    setComments('');
    setShares('');
    setEngagementRate('');
    setOauthMessage('');
    setAddModalOpen(true);
  };

  const handleOAuthConnect = async (platform: SocialPlatform) => {
    setOauthMessage('');
    setBusyAction(true);
    try {
      const res = await api.post<{ authUrl: string }>(`/api/social-accounts/${platform}/oauth`);
      window.location.href = res.authUrl;
    } catch (err) {
      setOauthMessage(
        err instanceof ApiError ? err.message : 'Official OAuth credentials are not configured.'
      );
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusyAction(true);
    setOauthMessage('');
    try {
      await api.put(`/api/social-accounts/account/${selected.id}`, {
        accountName,
        handle,
        followers: Number(followers) || 0,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        shares: Number(shares) || 0,
        engagementRate: Number(engagementRate) || 0,
      });
      setSelected(null);
      setNotice(`${PLATFORM_META[selected.platform].name} account saved.`);
      await loadAccounts();
    } catch (err) {
      setOauthMessage(err instanceof ApiError ? err.message : 'Unable to save social account.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction(true);
    setOauthMessage('');
    try {
      await api.post('/api/social-accounts', {
        platform: newPlatform,
        accountName,
        handle,
        followers: Number(followers) || 0,
        likes: Number(likes) || 0,
        comments: Number(comments) || 0,
        shares: Number(shares) || 0,
        engagementRate: Number(engagementRate) || 0,
      });
      setAddModalOpen(false);
      setNotice(`Added ${accountName} (${PLATFORM_META[newPlatform].name}) to your workspace.`);
      await loadAccounts();
    } catch (err) {
      setOauthMessage(err instanceof ApiError ? err.message : 'Unable to add social account.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleRemoveAccount = async (acc: SocialAccountItem) => {
    setBusyAction(true);
    setError('');
    try {
      await api.del(`/api/social-accounts/account/${acc.id}`);
      setNotice(`${acc.accountName || PLATFORM_META[acc.platform].name} disconnected.`);
      await loadAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to remove social account.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleLoadSample = async () => {
    setBusyAction(true);
    setError('');
    try {
      await api.post('/api/social-accounts/sample/load');
      setNotice('Sample analytics dataset loaded across all 5 channels.');
      await loadAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load sample dataset.');
    } finally {
      setBusyAction(false);
    }
  };

  const handleClearSample = async () => {
    setBusyAction(true);
    setError('');
    try {
      await api.del('/api/social-accounts/sample/clear');
      setNotice('All accounts reset to clean disconnected state.');
      await loadAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reset workspace.');
    } finally {
      setBusyAction(false);
    }
  };

  const hasAnyActive = accounts.some((a) => a.connectionStatus !== 'disconnected');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Social Media Accounts
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Add and manage your own Facebook, Instagram, TikTok, YouTube, and X channels or link official OAuth APIs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={busyAction}
            onClick={openAddAccountModal}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Social Account</span>
          </button>

          {hasAnyActive && (
            <button
              type="button"
              disabled={busyAction}
              onClick={handleClearSample}
              className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Reset All
            </button>
          )}
          <button
            type="button"
            disabled={busyAction}
            onClick={handleLoadSample}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busyAction ? 'animate-spin' : ''}`} />
            <span>Load Sample Dataset</span>
          </button>
        </div>
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[240px] rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {accounts.map((acc) => {
            const meta = PLATFORM_META[acc.platform];
            const status = statusSummary(acc);
            const StatusIcon = status.icon;
            const isDisconnected = acc.connectionStatus === 'disconnected';

            return (
              <article
                key={acc.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${meta.bgClass}`}
                      >
                        <PlatformLogo platform={acc.platform} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {acc.accountName || meta.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {acc.handle ? `${meta.name} · ${acc.handle}` : 'No account linked'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${status.className}`}>
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      {status.label}
                    </span>
                    {acc.lastSyncedAt && (
                      <span className="text-slate-400 font-mono tabular-nums">
                        {formatDateShort(acc.lastSyncedAt)}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {meta.metricLabel}
                      </p>
                      <p className="mt-0.5 text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                        {isDisconnected ? '—' : formatCompactNumber(acc.followers)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Likes</p>
                      <p className="mt-0.5 text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                        {isDisconnected ? '—' : formatCompactNumber(acc.likes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Engagement</p>
                      <p className="mt-0.5 text-base font-semibold font-mono tabular-nums text-slate-900 dark:text-white">
                        {isDisconnected ? '—' : `${acc.engagementRate.toFixed(1)}%`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openConfigureModal(acc)}
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isDisconnected ? 'Connect / Add' : 'Edit'}
                  </button>

                  <div className="flex items-center gap-2">
                    {!isDisconnected && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAccount(acc)}
                        className="px-2.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onViewPlatformAnalytics(acc.platform)}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>View Analytics</span>
                      <TrendingUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add New Social Account Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Add Social Media Account
              </h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              {oauthMessage && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-600 dark:text-red-400">
                  {oauthMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium mb-1">Platform</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value as SocialPlatform)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="facebook">Facebook</option>
                  <option value="x">X (Twitter)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="My Brand Page"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Handle / URL</label>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@mybrand"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    {PLATFORM_META[newPlatform].metricLabel}
                  </label>
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
                  <label className="block text-xs font-medium mb-1">Total Likes</label>
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
                  <label className="block text-xs font-medium mb-1">Engagement %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.1"
                    required
                    value={engagementRate}
                    onChange={(e) => setEngagementRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Comments</label>
                  <input
                    type="number"
                    min={0}
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
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyAction}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                >
                  {busyAction ? 'Adding…' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Official OAuth Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <PlatformLogo platform={selected.platform} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {PLATFORM_META[selected.platform].name} Account
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-5">
                <button
                  type="button"
                  onClick={() => setModalTab('manual')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    modalTab === 'manual'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Account Details &amp; Metrics
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('oauth')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    modalTab === 'oauth'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Official API OAuth
                </button>
              </div>

              {oauthMessage && (
                <div className="mb-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{oauthMessage}</span>
                </div>
              )}

              {modalTab === 'oauth' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">API Credentials Status</span>
                      <span
                        className={`font-medium ${
                          selected.apiIntegration.credentialsConfigured
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {selected.apiIntegration.credentialsConfigured
                          ? 'Configured in Environment'
                          : 'Not Configured'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Required Env Variables:</span>
                      <p className="mt-1 font-mono text-slate-800 dark:text-slate-200">
                        {selected.apiIntegration.requiredEnvVars.join(', ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">OAuth Scopes:</span>
                      <p className="mt-1 font-mono text-slate-700 dark:text-slate-300">
                        {selected.apiIntegration.scopes.join(', ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400">Redirect Callback URI:</span>
                      <p className="mt-1 font-mono text-slate-700 dark:text-slate-300 break-all">
                        {selected.apiIntegration.callbackUrl}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2">
                    <a
                      href={selected.apiIntegration.docsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Official API Docs</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleOAuthConnect(selected.platform)}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Authorize via OAuth</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveExistingAccount} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Account Name</label>
                      <input
                        type="text"
                        required
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Studio Official"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Handle / Channel</label>
                      <input
                        type="text"
                        required
                        value={handle}
                        onChange={(e) => setHandle(e.target.value)}
                        placeholder="@studio.official"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">
                        {PLATFORM_META[selected.platform].metricLabel}
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={followers}
                        onChange={(e) => setFollowers(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Total Likes</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={likes}
                        onChange={(e) => setLikes(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Engagement %</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.1"
                        required
                        value={engagementRate}
                        onChange={(e) => setEngagementRate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Comments</label>
                      <input
                        type="number"
                        min={0}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Shares</label>
                      <input
                        type="number"
                        min={0}
                        value={shares}
                        onChange={(e) => setShares(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busyAction}
                      className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                    >
                      {busyAction ? 'Saving…' : 'Save Account'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
