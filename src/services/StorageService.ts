/**
 * ZeroLock Storage Service
 *
 * All persistent data operations through chrome.storage.local.
 * No localStorage, sessionStorage, or IndexedDB is used.
 * All data stays on-device, never transmitted.
 */

import { STORAGE_KEYS, type ZeroLockStorage, type WebsiteEntry, type WhitelistEntry, type BlacklistEntry, type AppConfig } from '../storage/types';
import { initializeStorage, ensureAutoWhitelist } from '../storage/schema';
import { sanitizeDomain, sanitizeText } from '../security/sanitizer';
import { validateTimerDuration } from '../security/validator';
import { DOMAIN } from '../utils/constants';

class StorageService {
  private cache: ZeroLockStorage | null = null;
  private initialized = false;

  /**
   * Initialize storage and load data into cache.
   */
  async initialize(): Promise<ZeroLockStorage> {
    const data = await initializeStorage();
    this.cache = data;
    this.initialized = true;
    
    // Ensure identity domains are auto-whitelisted
    await ensureAutoWhitelist();
    // Invalidate cache so next read picks up updated whitelist
    this.cache = null;
    
    return data;
  }

  /**
   * Ensure storage is initialized before operations.
   * Auto-initializes if not yet initialized (handles race conditions
   * when popup/options import storageService before background worker
   * has finished initialization).
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get the full storage data.
   */
  async getAll(): Promise<ZeroLockStorage> {
    await this.ensureInitialized();
    if (this.cache) return this.cache;

    const data = await initializeStorage();
    this.cache = data;
    return data;
  }

  /**
   * Get all websites.
   */
  async getWebsites(): Promise<Record<string, WebsiteEntry>> {
    const data = await this.getAll();
    return data.websites;
  }

  /**
   * Get a website entry by domain.
   */
  async getWebsite(domain: string): Promise<WebsiteEntry | null> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return null;

    const websites = await this.getWebsites();
    return websites[sanitized] ?? null;
  }

  /**
   * Add or update a website entry.
   * Returns the updated entry, or null if invalid.
   */
  async setWebsite(domain: string, entry: Partial<WebsiteEntry> & { domain: string }): Promise<WebsiteEntry | null> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return null;

    const websites = await this.getWebsites();

    const existing = websites[sanitized];
    const now = Date.now();

    const updatedEntry: WebsiteEntry = {
      domain: sanitized,
      timerMinutes: entry.timerMinutes ?? existing?.timerMinutes ?? 60,
      autoLogout: entry.autoLogout ?? existing?.autoLogout ?? true,
      closeTabs: entry.closeTabs ?? existing?.closeTabs ?? false,
      timerStartedAt: entry.timerStartedAt ?? existing?.timerStartedAt ?? null,
      isActive: entry.isActive ?? existing?.isActive ?? true,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    // Validate timer
    if (!validateTimerDuration(updatedEntry.timerMinutes)) {
      return null;
    }

    // Check max websites limit
    const websiteCount = Object.keys(websites).length;
    if (!existing && websiteCount >= DOMAIN.MAX_WEBSITES) {
      return null;
    }

    const newWebsites = { ...websites, [sanitized]: updatedEntry };
    await chrome.storage.local.set({ [STORAGE_KEYS.WEBSITES]: newWebsites });
    this.cache = null; // Invalidate cache

    return updatedEntry;
  }

  /**
   * Remove a website entry.
   */
  async removeWebsite(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const websites = await this.getWebsites();
    if (!websites[sanitized]) return false;

    const newWebsites = { ...websites };
    delete newWebsites[sanitized];

    await chrome.storage.local.set({ [STORAGE_KEYS.WEBSITES]: newWebsites });
    this.cache = null;

    return true;
  }

  /**
   * Get whitelist entries.
   */
  async getWhitelist(): Promise<WhitelistEntry[]> {
    const data = await this.getAll();
    return data.whitelist;
  }

  /**
   * Add to whitelist.
   */
  async addToWhitelist(domain: string, label?: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const whitelist = await this.getWhitelist();
    if (whitelist.length >= DOMAIN.MAX_WHITELIST) return false;
    if (whitelist.some((e) => e.domain === sanitized)) return false;

    const entry: WhitelistEntry = {
      domain: sanitized,
      label: sanitizeText(label ?? sanitized),
      addedAt: Date.now(),
    };

    const newWhitelist = [...whitelist, entry];
    await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: newWhitelist });
    this.cache = null;

    return true;
  }

  /**
   * Remove from whitelist.
   */
  async removeFromWhitelist(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const whitelist = await this.getWhitelist();
    const newWhitelist = whitelist.filter((e) => e.domain !== sanitized);

    if (newWhitelist.length === whitelist.length) return false;

    await chrome.storage.local.set({ [STORAGE_KEYS.WHITELIST]: newWhitelist });
    this.cache = null;

    return true;
  }

  /**
   * Get blacklist entries.
   */
  async getBlacklist(): Promise<BlacklistEntry[]> {
    const data = await this.getAll();
    return data.blacklist;
  }

  /**
   * Add to blacklist.
   */
  async addToBlacklist(domain: string, label?: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const blacklist = await this.getBlacklist();
    if (blacklist.length >= DOMAIN.MAX_BLACKLIST) return false;
    if (blacklist.some((e) => e.domain === sanitized)) return false;

    const entry: BlacklistEntry = {
      domain: sanitized,
      label: sanitizeText(label ?? sanitized),
      addedAt: Date.now(),
    };

    const newBlacklist = [...blacklist, entry];
    await chrome.storage.local.set({ [STORAGE_KEYS.BLACKLIST]: newBlacklist });
    this.cache = null;

    return true;
  }

  /**
   * Remove from blacklist.
   */
  async removeFromBlacklist(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const blacklist = await this.getBlacklist();
    const newBlacklist = blacklist.filter((e) => e.domain !== sanitized);

    if (newBlacklist.length === blacklist.length) return false;

    await chrome.storage.local.set({ [STORAGE_KEYS.BLACKLIST]: newBlacklist });
    this.cache = null;

    return true;
  }

  /**
   * Get app configuration.
   */
  async getConfig(): Promise<AppConfig> {
    const data = await this.getAll();
    return data.config;
  }

  /**
   * Update app configuration.
   */
  async updateConfig(updates: Partial<AppConfig>): Promise<AppConfig> {
    const config = await this.getConfig();
    const newConfig: AppConfig = { ...config, ...updates };

    await chrome.storage.local.set({ [STORAGE_KEYS.CONFIG]: newConfig });
    this.cache = null;

    return newConfig;
  }

  /**
   * Update timer started time for a website.
   */
  async startTimer(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const website = await this.getWebsite(sanitized);
    if (!website) return false;

    return !!(await this.setWebsite(sanitized, {
      ...website,
      timerStartedAt: Date.now(),
      isActive: true,
    }));
  }

  /**
   * Stop timer for a website.
   */
  async stopTimer(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const website = await this.getWebsite(sanitized);
    if (!website) return false;

    return !!(await this.setWebsite(sanitized, {
      ...website,
      timerStartedAt: null,
      isActive: false,
    }));
  }

  /**
   * Check if a domain is whitelisted.
   */
  async isWhitelisted(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const whitelist = await this.getWhitelist();
    return whitelist.some(
      (e) => e.domain === sanitized || sanitized.endsWith(`.${e.domain}`),
    );
  }

  /**
   * Check if a domain is blacklisted.
   */
  async isBlacklisted(domain: string): Promise<boolean> {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return false;

    const blacklist = await this.getBlacklist();
    return blacklist.some(
      (e) => e.domain === sanitized || sanitized.endsWith(`.${e.domain}`),
    );
  }

  /**
   * Reset all data (factory reset).
   */
  async resetAll(): Promise<void> {
    await chrome.storage.local.clear();
    await initializeStorage();
    this.cache = null;
  }

  /**
   * Invalidate the internal cache so the next read fetches fresh data from storage.
   */
  invalidateCache(): void {
    this.cache = null;
  }

  /**
   * Get storage usage information.
   */
  async getStorageInfo(): Promise<{ usedBytes: number; quotaBytes: number }> {
    const bytesInUse = await chrome.storage.local.getBytesInUse(null);
    return {
      usedBytes: bytesInUse,
      quotaBytes: chrome.storage.local.QUOTA_BYTES,
    };
  }
}

// Singleton instance
export const storageService = new StorageService();
