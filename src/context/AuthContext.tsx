import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getAuthToken, setAuthToken } from '../services/api.ts';
import type { UserProfile } from '../types/index.ts';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  theme: 'dark' | 'light';
  setTheme: (next: 'dark' | 'light') => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    jobTitle?: string;
    company?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateLocalUser: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const THEME_STORAGE_KEY = 'trendora_theme';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  });

  const applyThemeClass = useCallback((mode: 'dark' | 'light') => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme, applyThemeClass]);

  const setTheme = useCallback(
    (next: 'dark' | 'light') => {
      setThemeState(next);
      applyThemeClass(next);
      if (getAuthToken()) {
        api.put('/api/users/preferences', { themePreference: next }).catch(() => {
          // Non-blocking sync
        });
      }
    },
    [applyThemeClass]
  );

  const refreshUser = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.get<{ user: UserProfile }>('/api/auth/me');
      setUser(data.user);
      if (data.user.themePreference) {
        setThemeState(data.user.themePreference);
      }
    } catch {
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: UserProfile }>('/api/auth/login', {
      email,
      password,
    });
    setAuthToken(data.token);
    setUser(data.user);
    if (data.user.themePreference) {
      setThemeState(data.user.themePreference);
    }
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      jobTitle?: string;
      company?: string;
    }) => {
      const data = await api.post<{ token: string; user: UserProfile }>('/api/auth/register', payload);
      setAuthToken(data.token);
      setUser(data.user);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore network errors during logout
    }
    setAuthToken(null);
    setUser(null);
  }, []);

  const updateLocalUser = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        setTheme,
        login,
        register,
        logout,
        refreshUser,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
