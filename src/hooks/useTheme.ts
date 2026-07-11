/**
 * ZeroLock Theme Hook
 *
 * Manages theme state (light/dark/system).
 * Persists preference to chrome.storage.local.
 */

import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/StorageService';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

/**
 * Hook for managing application theme.
 */
export function useTheme(): {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
  isDark: boolean;
} {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async (): Promise<void> => {
      try {
        const config = await storageService.getConfig();
        setThemeState(config.theme);
      } catch {
        // Fall back to system theme
        setThemeState('system');
      }
    };
    void loadTheme();
  }, []);

  // Listen for storage changes to sync with other contexts
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
    ): void => {
      if ('config' in changes) {
        const newConfig = changes.config.newValue as { theme?: 'light' | 'dark' | 'system' } | undefined;
        if (newConfig?.theme) {
          setThemeState(newConfig.theme);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Resolve theme based on preference and system preference
  useEffect(() => {
    const resolveTheme = (): void => {
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolvedTheme(prefersDark ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    resolveTheme();

    // Listen for system preference changes
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (): void => resolveTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    return;
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback(async (newTheme: Theme): Promise<void> => {
    setThemeState(newTheme);
    try {
      await storageService.updateConfig({ theme: newTheme });
    } catch {
      // Silently fail - UI is updated optimistically
    }
  }, []);

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: resolvedTheme === 'dark',
  };
}
