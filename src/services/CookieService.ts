/**
 * ZeroLock Cookie Service
 *
 * Handles cookie removal for session logout.
 * Cookies are never read, stored, or transmitted.
 * Only removed when user triggers logout or timer expires.
 */

import { sanitizeDomain } from '../security/sanitizer';
import { canRemoveCookiesFor } from '../security/validator';

class CookieService {
  /**
   * Remove all cookies for a specific domain.
   * Queries both `example.com` and `.example.com` because cookies
   * can be stored with either domain format.
   * Returns the number of cookies removed.
   */
  async removeCookiesForDomain(domain: string): Promise<number> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized || !canRemoveCookiesFor(sanitized)) {
      return 0;
    }

    try {
      // Query cookies for both domain formats (with and without leading dot)
      const [cookiesWithoutDot, cookiesWithDot] = await Promise.all([
        chrome.cookies.getAll({ domain: sanitized }),
        chrome.cookies.getAll({ domain: `.${sanitized}` }),
      ]);

      // Deduplicate by name path and storeId using a unique key
      const seenKeys = new Set<string>();
      const allCookies = [...cookiesWithoutDot, ...cookiesWithDot].filter((cookie) => {
        const key = `${cookie.name}:${cookie.path ?? '/'}:${cookie.storeId ?? 'default'}`;
        if (seenKeys.has(key)) return false;
        seenKeys.add(key);
        return true;
      });

      let removedCount = 0;

      for (const cookie of allCookies) {
        try {
          const url = this.buildCookieUrl(cookie);
          if (url) {
            await chrome.cookies.remove({
              url,
              name: cookie.name,
              ...(cookie.storeId ? { storeId: cookie.storeId } : {}),
            });
            removedCount++;
          }
        } catch {
          // Silently skip cookies that can't be removed
          continue;
        }
      }

      return removedCount;
    } catch {
      return 0;
    }
  }

  /**
   * Remove cookies for multiple domains at once.
   */
  async removeCookiesForDomains(domains: string[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    for (const domain of domains) {
      results[domain] = await this.removeCookiesForDomain(domain);
    }

    return results;
  }

  /**
   * Build a cookie URL from cookie details (minimum required for chrome.cookies.remove).
   */
  private buildCookieUrl(cookie: chrome.cookies.Cookie): string | null {
    const protocol = cookie.secure ? 'https' : 'http';
    // Domain may start with a dot
    const domain = cookie.domain?.startsWith('.')
      ? cookie.domain.slice(1)
      : cookie.domain;

    if (!domain) return null;

    return `${protocol}://${domain}${cookie.path ?? '/'}`;
  }

  /**
   * Check if the extension has cookie permissions for a domain.
   */
  async hasCookieAccess(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    try {
      const cookies = await chrome.cookies.getAll({ domain: sanitized });
      return cookies.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get count of cookies for a domain (without reading their values).
   */
  async getCookieCount(domain: string): Promise<number> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return 0;

    try {
      const cookies = await chrome.cookies.getAll({ domain: sanitized });
      return cookies.length;
    } catch {
      return 0;
    }
  }
}

// Singleton instance
export const cookieService = new CookieService();
