/**
 * ZeroLock Lists Hook
 *
 * Manages whitelist and blacklist state.
 * Communicates with background service worker via chrome.runtime messages.
 */

import { useState, useEffect, useCallback } from 'react';
import type { WhitelistEntry, BlacklistEntry } from '../storage/types';
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
 * Hook for managing whitelist and blacklist.
 */
export function useLists(): {
  whitelist: WhitelistEntry[];
  blacklist: BlacklistEntry[];
  loading: boolean;
  error: string | null;
  addToWhitelist: (domain: string, label?: string) => Promise<boolean>;
  removeFromWhitelist: (domain: string) => Promise<boolean>;
  addToBlacklist: (domain: string, label?: string) => Promise<boolean>;
  removeFromBlacklist: (domain: string) => Promise<boolean>;
  refresh: () => Promise<void>;
} {
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [whitelistResponse, blacklistResponse] = await Promise.all([
        sendMessage(MESSAGES.GET_WHITELIST),
        sendMessage(MESSAGES.GET_BLACKLIST),
      ]);

      if (whitelistResponse.success && whitelistResponse.data) {
        setWhitelist(whitelistResponse.data as unknown as WhitelistEntry[]);
      }

      if (blacklistResponse.success && blacklistResponse.data) {
        setBlacklist(blacklistResponse.data as unknown as BlacklistEntry[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load lists on mount
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToWhitelist = useCallback(async (domain: string, label?: string): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.ADD_WHITELIST, { domain, label });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to add to whitelist');
    return false;
  }, [refresh]);

  const removeFromWhitelist = useCallback(async (domain: string): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.REMOVE_WHITELIST, { domain });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to remove from whitelist');
    return false;
  }, [refresh]);

  const addToBlacklist = useCallback(async (domain: string, label?: string): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.ADD_BLACKLIST, { domain, label });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to add to blacklist');
    return false;
  }, [refresh]);

  const removeFromBlacklist = useCallback(async (domain: string): Promise<boolean> => {
    const response = await sendMessage(MESSAGES.REMOVE_BLACKLIST, { domain });

    if (response.success) {
      await refresh();
      return true;
    }

    setError(response.error ?? 'Failed to remove from blacklist');
    return false;
  }, [refresh]);

  return {
    whitelist,
    blacklist,
    loading,
    error,
    addToWhitelist,
    removeFromWhitelist,
    addToBlacklist,
    removeFromBlacklist,
    refresh,
  };
}
