/**
 * ZeroLock Tab Service
 *
 * Manages browser tab operations.
 * Used for closing tabs after session logout.
 * Tabs are only closed when user opts in via "closeTabs" setting.
 */

import { sanitizeDomain } from '../security/sanitizer';

class TabService {
  /**
   * Close all tabs matching a domain.
   * Returns the number of tabs closed.
   */
  async closeTabsForDomain(domain: string): Promise<number> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return 0;

    try {
      const tabs = await chrome.tabs.query({});
      const matchingTabs = tabs.filter((tab) => {
        if (!tab.url || !tab.id) return false;
        try {
          const url = new URL(tab.url);
          return (
            url.hostname === sanitized ||
            url.hostname.endsWith(`.${sanitized}`)
          );
        } catch {
          return false;
        }
      });

      const tabIds = matchingTabs
        .map((tab) => tab.id)
        .filter((id): id is number => id !== undefined);

      if (tabIds.length === 0) return 0;

      await chrome.tabs.remove(tabIds);
      return tabIds.length;
    } catch {
      return 0;
    }
  }

  /**
   * Close tabs for multiple domains at once.
   */
  async closeTabsForDomains(domains: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    for (const domain of domains) {
      results[domain] = await this.closeTabsForDomain(domain);
    }

    return results;
  }

  /**
   * Get the count of open tabs for a domain.
   */
  async getTabCountForDomain(domain: string): Promise<number> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return 0;

    try {
      const tabs = await chrome.tabs.query({});
      return tabs.filter((tab) => {
        if (!tab.url) return false;
        try {
          const url = new URL(tab.url);
          return (
            url.hostname === sanitized ||
            url.hostname.endsWith(`.${sanitized}`)
          );
        } catch {
          return false;
        }
      }).length;
    } catch {
      return 0;
    }
  }

  /**
   * Reload all tabs matching a domain.
   * Used after logout to show the logged-out state.
   * Returns the number of tabs reloaded.
   */
  async reloadTabsForDomain(domain: string): Promise<number> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return 0;

    try {
      const tabs = await chrome.tabs.query({});
      const matchingTabs = tabs.filter((tab) => {
        if (!tab.url || !tab.id) return false;
        try {
          const url = new URL(tab.url);
          return (
            url.hostname === sanitized ||
            url.hostname.endsWith(`.${sanitized}`)
          );
        } catch {
          return false;
        }
      });

      let reloaded = 0;
      for (const tab of matchingTabs) {
        if (tab.id) {
          try {
            await chrome.tabs.reload(tab.id);
            reloaded++;
          } catch {
            // Tab might no longer exist
          }
        }
      }
      return reloaded;
    } catch {
      return 0;
    }
  }

  /**
   * Open the options page.
   */
  async openOptionsPage(): Promise<void> {
    try {
      await chrome.runtime.openOptionsPage();
    } catch {
      // Silently fail
    }
  }

  /**
   * Get the current active tab URL's domain.
   */
  async getCurrentTabDomain(): Promise<string | null> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.url) return null;

      const url = new URL(tab.url);
      return sanitizeDomain(url.hostname);
    } catch {
      return null;
    }
  }
}

// Singleton instance
export const tabService = new TabService();
