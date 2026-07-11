/**
 * ZeroLock Websites Hook
 *
 * Manages the website list with full CRUD operations.
 * Communicates with background service worker via chrome.runtime messages.
 */

import { useState, useEffect, useCallback } from 'react';
import type { WebsiteEntry } from '../storage/types';
import { MESSAGES } from '../utils/constants';

interface TimerStatus {
  remaining: number;
  expiryTime: number;
  status: 'running' | 'expired' | 'paused';
}

interface MessageResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

/**
 * Send a message to the background service worker.
 */
async function sendMessage(
  type: string,
  payload?: Record<string, unknown>,
): Promise<MessageResponse> {
  try {
    const response = await chrome.runtime.sendMessage({ type, payload });
    return (response ?? { success: false, error: 'No response' }) as MessageResponse;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    };
  }
}

/**
 * Hook for managing websites.
 */
export function useWebsites(): {
  websites: Record<string, WebsiteEntry>;
  timerStatuses: Record<string, TimerStatus>;
  loading: boolean;
  error: string | null;
  addWebsite: (domain: string, entry: Partial<WebsiteEntry>) => Promise<boolean>;
  removeWebsite: (domain: string) => Promise<boolean>;
  updateWebsite: (domain: string, updates: Partial<WebsiteEntry>) => Promise<boolean>;
  startTimer: (domain: string) => Promise<boolean>;
  stopTimer: (domain: string) => Promise<boolean>;
  refresh: () => Promise<void>;
} {
  const [websites, setWebsites] = useState<Record<string, WebsiteEntry>>({});
  const [timerStatuses, setTimerStatuses] = useState<Record<string, TimerStatus>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await sendMessage(MESSAGES.GET_WEBSITES);

      if (response.success && response.data) {
        const data = response.data as { websites: Record<string, WebsiteEntry>; timerStatuses: Record<string, TimerStatus> };
        setWebsites(data.websites ?? {});
        setTimerStatuses(data.timerStatuses ?? {});
      } else {
        setError(response.error ?? 'Failed to load websites');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load websites on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Listen for website-related storage changes only
  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
    ): void => {
      const relevantKeys = ['websites', 'whitelist', 'blacklist', 'config'];
      const hasRelevantChange = Object.keys(changes).some((key) =>
        relevantKeys.includes(key),
      );
      if (hasRelevantChange) {
        void refresh();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [refresh]);

  const addWebsite = useCallback(async (domain: string, entry: Partial<WebsiteEntry>): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.ADD_WEBSITE, {
      domain,
      entry: { ...entry, domain },
    });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to add website');
    return false;
  }, [refresh]);

  const removeWebsite = useCallback(async (domain: string): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.REMOVE_WEBSITE, { domain });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to remove website');
    return false;
  }, [refresh]);

  const updateWebsite = useCallback(async (domain: string, updates: Partial<WebsiteEntry>): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.UPDATE_WEBSITE, { domain, updates });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to update website');
    return false;
  }, [refresh]);

  const startTimer = useCallback(async (domain: string): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.START_TIMER, { domain });

    if (response.success) {
      await refresh();
      return true;
    }

    return false;
  }, [refresh]);

  const stopTimer = useCallback(async (domain: string): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.STOP_TIMER, { domain });

    if (response.success) {
      await refresh();
      return true;
    }

    return false;
  }, [refresh]);

  return {
    websites,
    timerStatuses,
    loading,
    error,
    addWebsite,
    removeWebsite,
    updateWebsite,
    startTimer,
    stopTimer,
    refresh,
  };
}
