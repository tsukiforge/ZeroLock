/**
 * ZeroLock Config Hook
 *
 * Manages application configuration state.
 * Communicates with background service worker via chrome.runtime messages.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AppConfig } from '../storage/types';
import { DEFAULT_CONFIG, TIMER_PRESETS } from '../storage/types';
import { MESSAGES } from '../utils/constants';

/**
 * Send a message to the background service worker.
 */
async function sendMessage(
  type: string,
  payload?: Record<string, unknown>,
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const response = await chrome.runtime.sendMessage({ type, payload });
    return (response ?? { success: false, error: 'No response' }) as {
      success: boolean;
      data?: Record<string, unknown>;
      error?: string;
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Hook for managing app configuration.
 */
export function useConfig(): {
  config: AppConfig;
  loading: boolean;
  error: string | null;
  updateConfig: (updates: Partial<AppConfig>) => Promise<boolean>;
  refresh: () => Promise<void>;
  timerPresets: Record<string | number, string>;
} {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await sendMessage(MESSAGES.GET_CONFIG);

      if (response.success && response.data) {
        setConfig(response.data as unknown as AppConfig);
      } else {
        setError(response.error ?? 'Failed to load configuration');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load config on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateConfig = useCallback(async (updates: Partial<AppConfig>): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.UPDATE_CONFIG, { updates });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to update configuration');
    return false;
  }, [refresh]);

  return {
    config,
    loading,
    error,
    updateConfig,
    refresh,
    timerPresets: TIMER_PRESETS,
  };
}
