/**
 * ZeroLock Panic Handler
 *
 * Implements the Panic Button feature.
 * Logs out all blacklisted websites and all active managed websites.
 * This is the emergency logout mechanism.
 */

import { storageService } from '../services/StorageService';
import { sessionService } from '../services/SessionService';

export interface PanicResult {
  success: boolean;
  domainsLoggedOut: string[];
  totalCookiesRemoved: number;
  totalTabsClosed: number;
  duration: number;
}

class PanicHandler {
  /**
   * Execute panic logout.
   * Logs out all blacklisted domains and all active managed websites.
   */
  async execute(): Promise<PanicResult> {
    const startTime = Date.now();

    const results = await sessionService.panicLogout();

    const duration = Date.now() - startTime;

    const totalCookiesRemoved = results.reduce((sum, r) => sum + r.cookiesRemoved, 0);
    const totalTabsClosed = results.reduce((sum, r) => sum + r.tabsClosed, 0);
    const domainsLoggedOut = results
      .filter((r) => r.success)
      .map((r) => r.domain);

    return {
      success: domainsLoggedOut.length > 0,
      domainsLoggedOut,
      totalCookiesRemoved,
      totalTabsClosed,
      duration,
    };
  }

  /**
   * Get panic status - when panic was last used.
   */
  async getPanicStatus(): Promise<{ lastPanicAt: number | null; isPanicking: boolean }> {
    const result = await chrome.storage.local.get('lastPanicAt');
    const lastPanicAt = (result.lastPanicAt as number) ?? null;

    return {
      lastPanicAt,
      isPanicking: false, // Panic is instantaneous
    };
  }

  /**
   * Count how many domains would be affected by panic.
   */
  async countAffectedDomains(): Promise<number> {
    const [websites, blacklist] = await Promise.all([
      storageService.getWebsites(),
      storageService.getBlacklist(),
    ]);

    const domains = new Set<string>();

    for (const domain of Object.keys(websites)) {
      const website = websites[domain];
      if (website?.isActive) {
        domains.add(domain);
      }
    }

    for (const entry of blacklist) {
      domains.add(entry.domain);
    }

    return domains.size;
  }
}

// Singleton instance
export const panicHandler = new PanicHandler();
