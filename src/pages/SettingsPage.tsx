import React, { useEffect, useState } from 'react';
import { Bell, Camera, Lock, Moon, Save, Sun, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api, ApiError } from '../services/api.ts';
import type { NavSection, SocialAccountItem, UserProfile } from '../types/index.ts';
import { PlatformLogo, PLATFORM_META } from '../components/PlatformIcon.tsx';

export function SettingsPage({ onNavigate }: { onNavigate: (s: NavSection) => void }) {
  const { user, theme, setTheme, updateLocalUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || '');
  const [company, setCompany] = useState(user?.company || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [notifications, setNotifications] = useState({
    weeklyDigest: user?.notifications.weeklyDigest ?? true,
    milestoneAlerts: user?.notifications.milestoneAlerts ?? true,
    engagementDropAlerts: user?.notifications.engagementDropAlerts ?? true,
    syncNotifications: user?.notifications.syncNotifications ?? false,
  });

  const [accounts, setAccounts] = useState<SocialAccountItem[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    api
      .get<{ accounts: SocialAccountItem[] }>('/api/social-accounts')
      .then((res) => setAccounts(res.accounts))
      .catch(() => {});
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setFeedback(null);
    try {
      const res = await api.put<{ user: UserProfile }>('/api/users/profile', {
        name,
        email,
        jobTitle,
        company,
      });
      updateLocalUser(res.user);
      setFeedback({ type: 'ok', text: 'Profile details updated.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Unable to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post<{ avatarUrl: string }>('/api/users/avatar', formData);
      updateLocalUser({ avatarUrl: res.avatarUrl });
      setFeedback({ type: 'ok', text: 'Profile photo updated.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Unable to upload photo.',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    setFeedback(null);
    try {
      await api.put('/api/users/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setFeedback({ type: 'ok', text: 'Password changed successfully.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Unable to change password.',
      });
    } finally {
      setSavingPass(false);
    }
  };

  const handleToggleNotification = async (key: keyof typeof notifications) => {
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    try {
      await api.put('/api/users/preferences', { notifications: next });
      updateLocalUser({ notifications: next });
    } catch {
      // Revert if failed
      setNotifications(notifications);
    }
  };

  const handleDisconnect = async (accountId: string, label: string) => {
    try {
      await api.del(`/api/social-accounts/account/${accountId}`);
      const res = await api.get<{ accounts: SocialAccountItem[] }>('/api/social-accounts');
      setAccounts(res.accounts);
      setFeedback({ type: 'ok', text: `${label} disconnected.` });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof ApiError ? err.message : 'Unable to disconnect account.',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Workspace Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your profile, avatar, security credentials, appearance, and connected channels.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm ${
            feedback.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Profile & Photo */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Profile &amp; Photo</h3>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800/60">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-semibold flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          <div>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
              <span>{uploadingPhoto ? 'Uploading…' : 'Upload Profile Photo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarUpload}
                className="sr-only"
              />
            </label>
            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              PNG, JPEG, or WebP up to 2 MB.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Role / Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Organization</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? 'Saving…' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Appearance & Notifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6">
          <div className="flex items-center gap-2 mb-4">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <Sun className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            )}
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Appearance Mode
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Choose between deep navy dark mode and clean high-contrast light mode.
          </p>
          <div className="flex items-center gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dark Navy
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Light Crisp
            </button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Notification Preferences
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            {[
              { key: 'weeklyDigest' as const, label: 'Weekly executive digest summary' },
              { key: 'milestoneAlerts' as const, label: 'Follower milestone notifications' },
              { key: 'engagementDropAlerts' as const, label: 'Engagement anomaly alerts' },
              { key: 'syncNotifications' as const, label: 'Account sync completion updates' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="text-slate-700 dark:text-slate-300">{item.label}</span>
                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => handleToggleNotification(item.key)}
                  className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Password Security */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Change Password</h3>
        </div>

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium mb-1.5">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={savingPass}
              className="w-full py-2 px-4 text-xs font-medium rounded-lg bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white cursor-pointer"
            >
              {savingPass ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Connected Social Accounts Summary */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Manage Connected Social Accounts
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quickly review or disconnect linked channels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('social-accounts')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            Open Social Accounts
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {accounts.map((acc) => {
            const meta = PLATFORM_META[acc.platform];
            const active = acc.connectionStatus !== 'disconnected';
            return (
              <div key={acc.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <PlatformLogo platform={acc.platform} className={`w-4 h-4 ${meta.textClass}`} />
                  <div>
                    <span className="font-medium text-slate-900 dark:text-white">{meta.name}</span>
                    <span className="text-slate-400 mx-1.5">·</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {acc.accountName || 'Not linked'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 dark:text-slate-400 capitalize">
                    {acc.connectionStatus}
                  </span>
                  {active && (
                    <button
                      type="button"
                      onClick={() => handleDisconnect(acc.id, acc.accountName || meta.name)}
                      className="text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                    >
                      Disconnect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
