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
   * 
   * Strategy:
   * 1. Query ALL cookies via chrome.cookies.getAll({}) and filter by domain client-side.
   *    This is more reliable than domain-scoped queries, especially for public suffixes
   *    (like vercel.app, github.io) where Chrome's domain matching can be inconsistent.
   * 2. For each matching cookie, construct the proper URL and call chrome.cookies.remove().
   * 3. Log diagnostics for debugging.
   *
   * Returns the number of cookies removed.
   */
  async removeCookiesForDomain(domain: string): Promise<number> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized || !canRemoveCookiesFor(sanitized)) {
      return 0;
    }

    try {
      // Query ALL cookies and filter by domain client-side.
      // Domain-scoped queries (chrome.cookies.getAll({ domain })) can miss cookies
      // on public suffix subdomains or have inconsistent behavior.
      const allCookies = await chrome.cookies.getAll({});

      // Filter cookies matching this domain (exact match OR subdomain)
      const matchingCookies = allCookies.filter((cookie) => {
        const cookieDomain = cookie.domain?.startsWith('.')
          ? cookie.domain.slice(1)
          : cookie.domain;
        if (!cookieDomain) return false;
        return cookieDomain === sanitized || cookieDomain.endsWith(`.${sanitized}`);
      });

      let removedCount = 0;

      for (const cookie of matchingCookies) {
        try {
          const url = this.buildCookieUrl(cookie);

          if (url) {
            // chrome.cookies.remove returns the deleted cookie on success, null on failure
            const deleted = await chrome.cookies.remove({
              url,
              name: cookie.name,
              ...(cookie.storeId ? { storeId: cookie.storeId } : {}),
            });

            if (deleted !== null) {
              removedCount++;
            } else {
              console.warn(`[ZeroLock] Failed to remove cookie "${cookie.name}" (url: ${url})`);
            }
          }
        } catch (err) {
          console.error(`[ZeroLock] Failed to remove cookie "${cookie.name}" for ${sanitized}:`, err);
          continue;
        }
      }

      return removedCount;
    } catch (err) {
      console.error(`[ZeroLock] CookieService error for domain "${domain}":`, err);
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

    // Domain may start with a dot; strip it to get the actual hostname
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
