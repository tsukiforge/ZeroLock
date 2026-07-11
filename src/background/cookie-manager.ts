/**
 * ZeroLock Cookie Change Manager
 *
 * Monitors cookie changes to detect login/logout events.
 * Does NOT read cookie values - only observes change metadata.
 * Used to update UI state and manage timers.
 *
 * Also handles automatic blacklist logout:
 * When a cookie is ADDED for a blacklisted domain,
 * it triggers automatic logout.
 */

import { storageService } from '../services/StorageService';
import { sessionService } from '../services/SessionService';
import { sanitizeDomain } from '../security/sanitizer';

interface CookieChangeInfo {
  domain: string;
  removed: boolean;
}

class CookieChangeManager {
  private listeners: Array<(change: CookieChangeInfo) => void> = [];
  private isListening = false;
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingDomains = new Set<string>();

  /**
   * Start listening for cookie changes.
   */
  start(): void {
    if (this.isListening) return;

    chrome.cookies.onChanged.addListener(this.handleCookieChange);
    this.isListening = true;
  }

  /**
   * Stop listening for cookie changes.
   */
  stop(): void {
    if (!this.isListening) return;

    chrome.cookies.onChanged.removeListener(this.handleCookieChange);
    this.isListening = false;
    this.listeners = [];
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.pendingDomains.clear();
  }

  /**
   * Add a cookie change listener.
   */
  addListener(listener: (change: CookieChangeInfo) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a cookie change listener.
   */
  removeListener(listener: (change: CookieChangeInfo) => void): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  /**
   * Check if domain should be auto-logged out (blacklist check).
   * Batches checks to avoid rapid successive logouts.
   */
  private async checkBlacklistAutoLogout(domain: string): Promise<void> {
    this.pendingDomains.add(domain);

    if (this.batchTimeout) return;

    this.batchTimeout = setTimeout(async () => {
      const domains = [...this.pendingDomains];
      this.pendingDomains.clear();
      this.batchTimeout = null;

      for (const d of domains) {
        try {
          // Check if domain is blacklisted (but not whitelisted)
          const isBlacklisted = await storageService.isBlacklisted(d);
          if (!isBlacklisted) continue;

          const isWhitelisted = await storageService.isWhitelisted(d);
          if (isWhitelisted) continue;

          // Auto-logout blacklisted domain
          await sessionService.logoutDomain(d);
        } catch {
          // Silently continue
        }
      }
    }, 2000); // 2 second batch window
  }

  /**
   * Handle cookie change event.
   * Only extracts domain and removal status - never the cookie value.
   */
  private handleCookieChange = (changeInfo: chrome.cookies.CookieChangeInfo): void => {
    // Security: We only extract domain, never the cookie value
    const domain = changeInfo.cookie?.domain;

    if (!domain) return;

    let cleanDomain = domain.startsWith('.') ? domain.slice(1) : domain;
    cleanDomain = sanitizeDomain(cleanDomain) ?? cleanDomain;

    const change: CookieChangeInfo = {
      domain: cleanDomain,
      removed: changeInfo.removed,
    };

    // Notify all listeners
    for (const listener of this.listeners) {
      try {
        listener(change);
      } catch {
        // Silently handle listener errors
      }
    }

    // If a cookie was ADDED (not removed), check if it's a blacklisted domain
    if (!changeInfo.removed) {
      void this.checkBlacklistAutoLogout(cleanDomain);
    }
  };
}

// Singleton instance
export const cookieChangeManager = new CookieChangeManager();
