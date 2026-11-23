import React, { useState } from 'react';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Share2,
  Sun,
  TrendingUp,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { NavSection } from '../types/index.ts';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'social-accounts', label: 'Social Accounts', icon: Share2 },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

export function DashboardLayout({
  activeSection,
  onNavigate,
  children,
}: {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  children: React.ReactNode;
}) {
  const { user, theme, setTheme, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((n) => n.id === activeSection) || NAV_ITEMS[0];

  const handleNavClick = (id: NavSection) => {
    onNavigate(id);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070B14] text-slate-900 dark:text-slate-100">
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen flex flex-col bg-[#0B1120] text-slate-200 border-r border-slate-800/80 transition-all duration-200 shrink-0 ${
          collapsed ? 'w-[76px]' : 'w-[256px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Row */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="text-base font-semibold tracking-tight text-white whitespace-nowrap">
                Trendora
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Links (1-7) */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="whitespace-nowrap truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout (8) */}
        <div className="p-3 border-t border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb — Actions */}
        <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline whitespace-nowrap">
                Workspace
              </span>
              <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">/</span>
              <h1 className="font-semibold text-slate-900 dark:text-white truncate">
                {currentNav.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Switch color theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden sm:inline whitespace-nowrap max-w-[140px] truncate">
                {user?.name}
              </span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
