/**
 * ZeroLock Idle Handler
 *
 * Detects user idle state (no keyboard/mouse activity) and
 * triggers appropriate actions based on configuration.
 *
 * Uses chrome.idle API which relies on OS-level idle detection.
 * No user activity tracking or keylogging.
 */

import { storageService } from '../services/StorageService';
import { sessionService } from '../services/SessionService';
import { IDLE } from '../utils/constants';

type IdleStateListener = (state: chrome.idle.IdleState) => void;

class IdleHandler {
  private listener: IdleStateListener | null = null;

  /**
   * Start idle detection.
   */
  async start(): Promise<void> {
    const config = await storageService.getConfig();

    if (!config.idleDetectionEnabled) return;

    const idleThreshold = Math.max(
      IDLE.MIN_TIMEOUT_MINUTES,
      Math.min(config.idleTimeoutMinutes, IDLE.MAX_TIMEOUT_MINUTES),
    );

    // Set detection interval in seconds
    chrome.idle.setDetectionInterval(idleThreshold * 60);

    // Listen for idle state changes
    this.listener = async (newState: chrome.idle.IdleState): Promise<void> => {
      await this.handleIdleStateChange(newState);
    };

    chrome.idle.onStateChanged.addListener(this.listener);
  }

  /**
   * Stop idle detection.
   */
  stop(): void {
    if (this.listener) {
      chrome.idle.onStateChanged.removeListener(this.listener);
      this.listener = null;
    }
  }

  /**
   * Handle idle state changes.
   */
  private async handleIdleStateChange(state: chrome.idle.IdleState): Promise<void> {
    const config = await storageService.getConfig();

    switch (state) {
      case 'idle': {
        // User is idle - trigger timer check and potentially logout
        const websites = await storageService.getWebsites();
        const blacklist = await storageService.getBlacklist();
        const domainsToLogout: string[] = [];

        for (const entry of blacklist) {
          // Check if not whitelisted
          const isWhitelisted = await storageService.isWhitelisted(entry.domain);
          if (!isWhitelisted) {
            domainsToLogout.push(entry.domain);
          }
        }

        // Also expire all active timers immediately
        for (const [domain, entry] of Object.entries(websites)) {
          if (entry.isActive && entry.autoLogout) {
            const isWhitelisted = await storageService.isWhitelisted(domain);
            if (!isWhitelisted) {
              domainsToLogout.push(domain);
            }
          }
        }

        if (domainsToLogout.length > 0) {
          await sessionService.logoutDomains([...new Set(domainsToLogout)]);
        }
        break;
      }

      case 'locked': {
        // PC was locked
        if (config.logoutOnLock) {
          await this.handleLockEvent();
        }
        break;
      }

      case 'active': {
        // User is back - no immediate action needed
        // Timer checks will resume normally
        break;
      }
    }
  }

  /**
   * Handle PC locked event.
   */
  private async handleLockEvent(): Promise<void> {
    const [websites, blacklist] = await Promise.all([
      storageService.getWebsites(),
      storageService.getBlacklist(),
    ]);

    const domainsToLogout: string[] = [];

    // Logout all active websites
    for (const [domain, entry] of Object.entries(websites)) {
      if (entry.isActive && entry.autoLogout) {
        const isWhitelisted = await storageService.isWhitelisted(domain);
        if (!isWhitelisted) {
          domainsToLogout.push(domain);
        }
      }
    }

    // Logout all blacklisted
    for (const entry of blacklist) {
      const isWhitelisted = await storageService.isWhitelisted(entry.domain);
      if (!isWhitelisted) {
        domainsToLogout.push(entry.domain);
      }
    }

    if (domainsToLogout.length > 0) {
      await sessionService.logoutDomains([...new Set(domainsToLogout)]);
    }
  }

  /**
   * Handle browser close event (via onSuspend).
   */
  async handleBrowserClose(): Promise<void> {
    const config = await storageService.getConfig();

    if (!config.logoutOnBrowserClose) return;

    const [websites, blacklist] = await Promise.all([
      storageService.getWebsites(),
      storageService.getBlacklist(),
    ]);

    const domainsToLogout: string[] = [];

    for (const [domain, entry] of Object.entries(websites)) {
      if (entry.isActive && entry.autoLogout) {
        domainsToLogout.push(domain);
      }
    }

    for (const entry of blacklist) {
      domainsToLogout.push(entry.domain);
    }

    if (domainsToLogout.length > 0) {
      await sessionService.logoutDomains([...new Set(domainsToLogout)]);
    }
  }

  /**
   * Check current idle state and handle if idle.
   */
  async checkCurrentState(): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.idle.queryState(60, async (state: chrome.idle.IdleState) => {
        if (state === 'idle' || state === 'locked') {
          await this.handleIdleStateChange(state);
        }
        resolve();
      });
    });
  }
}

// Singleton instance
export const idleHandler = new IdleHandler();
