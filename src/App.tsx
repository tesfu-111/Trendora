import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { AuthView } from './components/AuthView.tsx';
import { DashboardLayout } from './components/DashboardLayout.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { SocialAccountsPage } from './pages/SocialAccountsPage.tsx';
import { AnalyticsPage } from './pages/AnalyticsPage.tsx';
import { PostsPage } from './pages/PostsPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { HelpPage } from './pages/HelpPage.tsx';
import type { DateFilterState, NavSection, SocialPlatform } from './types/index.ts';

function WorkspaceRouter() {
  const { user, loading } = useAuth();
  const [section, setSection] = useState<NavSection>('overview');

  const [filters, setFilters] = useState<DateFilterState>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return {
      preset: '30d',
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      platform: 'all',
    };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070B14] text-slate-500 dark:text-slate-400 text-sm">
        Loading workspace…
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleViewPlatformAnalytics = (platform: SocialPlatform) => {
    setFilters((prev) => ({ ...prev, platform }));
    setSection('analytics');
  };

  return (
    <DashboardLayout activeSection={section} onNavigate={setSection}>
      {section === 'overview' && (
        <OverviewPage
          filters={filters}
          onFilterChange={setFilters}
          onNavigate={setSection}
        />
      )}
      {section === 'social-accounts' && (
        <SocialAccountsPage onViewPlatformAnalytics={handleViewPlatformAnalytics} />
      )}
      {section === 'analytics' && (
        <AnalyticsPage filters={filters} onFilterChange={setFilters} />
      )}
      {section === 'posts' && <PostsPage />}
      {section === 'reports' && <ReportsPage />}
      {section === 'settings' && <SettingsPage onNavigate={setSection} />}
      {section === 'help' && <HelpPage />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceRouter />
    </AuthProvider>
  );
}
