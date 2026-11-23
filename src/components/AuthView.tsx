import React, { useState } from 'react';
import { ArrowRight, BarChart3, CheckCircle2, KeyRound, Lock, Mail, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api, ApiError } from '../services/api.ts';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export function AuthView() {
  const { login, register, theme, setTheme } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else if (mode === 'register') {
        await register({ name, email, password, jobTitle, company });
      } else if (mode === 'forgot') {
        const res = await api.post<{ emailSent: boolean; devResetToken?: string }>(
          '/api/auth/forgot-password',
          { email }
        );
        if (res.devResetToken) {
          setResetToken(res.devResetToken);
          setNotice(
            `Password reset token generated for local testing: ${res.devResetToken}. Enter your new password below.`
          );
          setMode('reset');
        } else {
          setNotice('If an account exists for that email, reset instructions have been issued.');
        }
      } else if (mode === 'reset') {
        await api.post('/api/auth/reset-password', { token: resetToken, newPassword });
        setNotice('Password updated. You can now sign in with your new password.');
        setPassword('');
        setMode('login');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to complete request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      await login('demo@trendora.io', 'DemoPass123!');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Demo login unavailable.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100">
      {/* Left Brand Panel */}
      <div className="lg:w-[46%] bg-[#0B1120] text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Trendora</span>
            </div>

            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle color theme"
              className="p-2 rounded-lg border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-14 max-w-md">
            <p className="text-xs font-medium tracking-wider text-blue-400">
              
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight leading-tight text-balance">
              Measure audience growth and content performance from one workspace.
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
              Monitor Facebook, Instagram, TikTok, YouTube, and X with period-over-period comparisons, post-level engagement breakdowns.
            </p>
          </div>
        </div>

        
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {(mode === 'login' || mode === 'register') && (
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setNotice('');
                  setMode('login');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setNotice('');
                  setMode('register');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              {mode === 'login' && 'Sign in to Trendora'}
              {mode === 'register' && 'Create your workspace'}
              {mode === 'forgot' && 'Reset your password'}
              {mode === 'reset' && 'Set a new password'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {mode === 'login' && 'Access your saved social analytics, posts, and reports.'}
              {mode === 'register' && 'Start with a clean private workspace backed by MongoDB.'}
              {mode === 'forgot' && 'Enter your email address to generate a time-limited reset token.'}
              {mode === 'reset' && 'Paste your reset token and choose a new password.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-3.5 rounded-lg border border-red-500/30 bg-red-500/10 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-5 p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-sm text-blue-700 dark:text-blue-300 break-words">
              {notice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tesfaye kebede"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Role / Title
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Growth Analyst"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Organization
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Star Media"
                      className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setNotice('');
                        setMode('forgot');
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={mode === 'register' ? 8 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimum 8 characters' : 'Enter password'}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}

            {mode === 'reset' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Reset Token
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={resetToken}
                      onChange={(e) => setResetToken(e.target.value)}
                      placeholder="Paste reset token"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>
                {submitting
                  ? 'Processing…'
                  : mode === 'login'
                    ? 'Sign In'
                    : mode === 'register'
                      ? 'Create Account'
                      : mode === 'forgot'
                        ? 'Request Reset Token'
                        : 'Update Password'}
              </span>
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

        

          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' && (
              <>
                Need a private workspace?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setNotice('');
                    setMode('register');
                  }}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Create an account
                </button>
              </>
            )}
            {mode !== 'login' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setNotice('');
                    setMode('login');
                  }}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Back to sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
