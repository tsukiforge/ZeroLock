/**
 * ZeroLock Session Service
 *
 * Coordinates session logout operations across services.
 * Manages the complete logout lifecycle:
 * 1. Remove cookies
 * 2. Close tabs (if enabled)
 * 3. Attempt official logout endpoint (if available)
 */

import { storageService } from './StorageService';
import { cookieService } from './CookieService';
import { tabService } from './TabService';
import { notificationService } from './NotificationService';
import { sanitizeDomain } from '../security/sanitizer';
import { getDomainLabel } from '../security/validator';
import { getAllDomainLevels } from '../utils/domain';

/** Known official logout URLs for popular sites */
const LOGOUT_ENDPOINTS: Record<string, string> = {
  'discord.com': 'https://discord.com/logout',
  'github.com': 'https://github.com/logout',
  'reddit.com': 'https://www.reddit.com/logout',
  'facebook.com': 'https://www.facebook.com/logout.php',
  'steamcommunity.com': 'https://steamcommunity.com/login/logout/',
  'steampowered.com': 'https://store.steampowered.com/login/logout/',
  'twitter.com': 'https://twitter.com/logout',
  'x.com': 'https://x.com/logout',
  'google.com': 'https://accounts.google.com/Logout',
  'youtube.com': 'https://www.youtube.com/logout',
  'instagram.com': 'https://www.instagram.com/accounts/logout/',
  'linkedin.com': 'https://www.linkedin.com/logout',
  'twitch.tv': 'https://www.twitch.tv/logout',
  'spotify.com': 'https://www.spotify.com/logout',
  'netflix.com': 'https://www.netflix.com/logout',
  'amazon.com': 'https://www.amazon.com/gp/flex/sign-out.html',
  'microsoft.com': 'https://login.live.com/logout.srf',
  'apple.com': 'https://appleid.apple.com/sign-out',
  'slack.com': 'https://slack.com/logout',
};

/**
 * Domain migration/alias map.
 * Maps known old/migrated domains to their current domain for cookie cleanup.
 * E.g., when logging out from `chat.openai.com`, also remove cookies from `chatgpt.com`.
 */
const DOMAIN_ALIASES: Record<string, string[]> = {
  'openai.com': ['chatgpt.com'],
  'chat.openai.com': ['chatgpt.com'],
};

export interface LogoutResult {
  domain: string;
  label: string;
  cookiesRemoved: number;
  tabsClosed: number;
  logoutEndpointAttempted: boolean;
  logoutEndpointSuccess: boolean;
  success: boolean;
}

class SessionService {
  /**
   * Execute logout for a specific domain.
   */
  async logoutDomain(domain: string): Promise<LogoutResult> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) {
      return {
        domain,
        label: domain,
        cookiesRemoved: 0,
        tabsClosed: 0,
        logoutEndpointAttempted: false,
        logoutEndpointSuccess: false,
        success: false,
      };
    }

    const website = await storageService.getWebsite(sanitized);
    const closeTabs = website?.closeTabs ?? false;
    const label = getDomainLabel(sanitized);

    // Step 1: Remove cookies for ALL domain levels.
    // For "a.b.c.example.com", we try: a.b.c.example.com, b.c.example.com, c.example.com, example.com
    // This handles cookies at ANY subdomain level (shared cookies, host-only cookies, etc.)
    const allDomainLevels = getAllDomainLevels(sanitized);
    const cleanedLevels = new Set<string>();
    let cookiesRemoved = 0;

    for (const level of allDomainLevels) {
      if (cleanedLevels.has(level)) continue;
      cleanedLevels.add(level);
      
      try {
        const removed = await cookieService.removeCookiesForDomain(level);
        cookiesRemoved += removed;
      } catch (err) {
        console.error(`[ZeroLock] Cookie removal error for ${level}:`, err);
      }
    }

    // Step 1b: Also remove cookies for known domain aliases (e.g., "chat.openai.com" → "chatgpt.com")
    // This handles websites that migrated to a new domain
    const baseDomain = allDomainLevels[allDomainLevels.length - 1] ?? null;
    const aliases = DOMAIN_ALIASES[sanitized] ?? (baseDomain ? DOMAIN_ALIASES[baseDomain] : undefined) ?? [];
    for (const aliasDomain of aliases) {
      if (cleanedLevels.has(aliasDomain)) continue;
      cleanedLevels.add(aliasDomain);
      
      try {
        const aliasCookiesRemoved = await cookieService.removeCookiesForDomain(aliasDomain);
        cookiesRemoved += aliasCookiesRemoved;
        if (aliasCookiesRemoved > 0) {
          await tabService.reloadTabsForDomain(aliasDomain);
        }
      } catch (err) {
        console.error(`[ZeroLock] Alias cookie removal error for ${aliasDomain}:`, err);
      }
    }

    // Step 2: Attempt official logout endpoint if available
    let logoutEndpointAttempted = false;
    let logoutEndpointSuccess = false;

    // Check original domain AND alias domains for logout endpoints
    const domainsToCheck = [sanitized, ...aliases];
    for (const checkDomain of domainsToCheck) {
      const logoutUrl = LOGOUT_ENDPOINTS[checkDomain];
      if (logoutUrl) {
        logoutEndpointAttempted = true;
        try {
          await chrome.tabs.create({ url: logoutUrl, active: false });
          logoutEndpointSuccess = true;
          break; // Only need one successful endpoint navigation
        } catch (err) {
          console.error(`[ZeroLock] Logout endpoint navigation failed for ${checkDomain}:`, err);
        }
      }
    }

    // Step 3: Reload all tabs for ALL domain levels to show logged-out state
    // This happens regardless of closeTabs setting
    for (const level of allDomainLevels) {
      try {
        await tabService.reloadTabsForDomain(level);
      } catch (err) {
        console.error(`[ZeroLock] Tab reload error for ${level}:`, err);
      }
    }
    // Also reload alias domain tabs
    for (const aliasDomain of aliases) {
      if (allDomainLevels.includes(aliasDomain)) continue;
      try {
        await tabService.reloadTabsForDomain(aliasDomain);
      } catch (err) {
        console.error(`[ZeroLock] Tab reload error for alias ${aliasDomain}:`, err);
      }
    }

    // Step 4: Close tabs if enabled
    let tabsClosed = 0;
    if (closeTabs) {
      try {
        tabsClosed = await tabService.closeTabsForDomain(sanitized);
      } catch (err) {
        console.error(`[ZeroLock] Tab close error for ${sanitized}:`, err);
      }
    }

    // Step 5: Clear old notifications and show success notification
    await notificationService.clearNotification(
      `zerolock-session-${sanitized}`,
    );
    
    // Show success notification if logout succeeded
    const logoutSuccess = cookiesRemoved > 0 || logoutEndpointSuccess;
    if (logoutSuccess) {
      await notificationService.showLogoutSuccess(sanitized, cookiesRemoved);
    }

    return {
      domain: sanitized,
      label,
      cookiesRemoved,
      tabsClosed,
      logoutEndpointAttempted,
      logoutEndpointSuccess,
      success: cookiesRemoved > 0 || logoutEndpointAttempted,
    };
  }

  /**
   * Execute logout for multiple domains.
   */
  async logoutDomains(domains: string[]): Promise<LogoutResult[]> {
    const results: LogoutResult[] = [];

    for (const domain of domains) {
      const result = await this.logoutDomain(domain);
      results.push(result);
    }

    return results;
  }

  /**
   * Execute panic logout - logout all blacklisted domains
   * and all active managed websites.
   */
  async panicLogout(): Promise<LogoutResult[]> {
    const [websites, blacklist] = await Promise.all([
      storageService.getWebsites(),
      storageService.getBlacklist(),
    ]);

    const domainsToLogout = new Set<string>();

    // Add all active websites
    for (const [domain, entry] of Object.entries(websites)) {
      if (entry.isActive) {
        domainsToLogout.add(domain);
      }
    }

    // Add all blacklisted domains
    for (const entry of blacklist) {
      domainsToLogout.add(entry.domain);
    }

    const results = await this.logoutDomains([...domainsToLogout]);

    // Update last panic timestamp
    await chrome.storage.local.set({ lastPanicAt: Date.now() });

    return results;
  }

  /**
   * Get the official logout URL for a domain, if known.
   */
  getLogoutUrl(domain: string): string | null {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return null;

    return LOGOUT_ENDPOINTS[sanitized] ?? null;
  }
}

// Singleton instance
export const sessionService = new SessionService();
