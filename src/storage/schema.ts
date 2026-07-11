/**
 * ZeroLock Storage Schema & Migrations
 *
 * Handles schema versioning and data migrations
 * to ensure forward compatibility.
 */

import { DEFAULT_CONFIG, type ZeroLockStorage, type WebsiteEntry, type WhitelistEntry } from './types';

/** Current schema version - increment on breaking changes */
const SCHEMA_VERSION_KEY = 'schemaVersion';
const CURRENT_SCHEMA_VERSION = 1;

/** Default empty storage state */
export function getDefaultStorage(): ZeroLockStorage {
  return {
    websites: {},
    whitelist: [],
    blacklist: [],
    config: { ...DEFAULT_CONFIG },
    installedAt: Date.now(),
    lastPanicAt: null,
  };
}

/**
 * Migrate old storage data to the current schema version.
 * Returns the migrated data.
 */
export async function migrateStorage(): Promise<ZeroLockStorage> {
  const result = await chrome.storage.local.get([
    SCHEMA_VERSION_KEY,
    'websites',
    'whitelist',
    'blacklist',
    'config',
    'installedAt',
    'lastPanicAt',
  ]);

  const currentVersion = (result[SCHEMA_VERSION_KEY] as number) ?? 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) {
    // Already up-to-date, return current data
    return {
      websites: (result.websites as Record<string, WebsiteEntry>) ?? {},
      whitelist: (result.whitelist as unknown[] ?? []) as ZeroLockStorage['whitelist'],
      blacklist: (result.blacklist as unknown[] ?? []) as ZeroLockStorage['blacklist'],
      config: (result.config as ZeroLockStorage['config']) ?? getDefaultStorage().config,
      installedAt: (result.installedAt as number) ?? Date.now(),
      lastPanicAt: (result.lastPanicAt as number | null) ?? null,
    };
  }

  // Future migrations run here
  // Example:
  // if (currentVersion < 2) { migrateV1ToV2(data); }
  // if (currentVersion < 3) { migrateV2ToV3(data); }

  // Set schema version after migration
  await chrome.storage.local.set({ [SCHEMA_VERSION_KEY]: CURRENT_SCHEMA_VERSION });

  return getDefaultStorage();
}

/**
 * Initialize storage with defaults if empty.
 */
export async function initializeStorage(): Promise<ZeroLockStorage> {
  const result = await chrome.storage.local.get(null);

  if (Object.keys(result).length === 0) {
    const defaults = getDefaultStorage();
    await chrome.storage.local.set({
      [SCHEMA_VERSION_KEY]: CURRENT_SCHEMA_VERSION,
      websites: defaults.websites,
      whitelist: defaults.whitelist,
      blacklist: defaults.blacklist,
      config: defaults.config,
      installedAt: defaults.installedAt,
      lastPanicAt: defaults.lastPanicAt,
    });
    return defaults;
  }

  return migrateStorage();
}

/**
 * Identity domains that should be automatically whitelisted
 * to prevent accidental logout from critical services.
 */
const AUTO_WHITELIST_DOMAINS: Array<{ domain: string; label: string }> = [
  { domain: 'accounts.google.com', label: 'Google Accounts' },
  { domain: 'login.microsoftonline.com', label: 'Microsoft Login' },
  { domain: 'login.live.com', label: 'Microsoft Live' },
  { domain: 'accounts.microsoft.com', label: 'Microsoft Accounts' },
  { domain: 'appleid.apple.com', label: 'Apple ID' },
  { domain: 'id.apple.com', label: 'Apple ID' },
  { domain: 'auth0.com', label: 'Auth0' },
  { domain: 'okta.com', label: 'Okta' },
  { domain: 'onelogin.com', label: 'OneLogin' },
];

/**
 * Add auto-whitelist entries to existing whitelist.
 * Skips domains that are already in the whitelist.
 */
export async function ensureAutoWhitelist(): Promise<void> {
  const result = await chrome.storage.local.get('whitelist');
  const existingWhitelist = (result.whitelist as WhitelistEntry[]) ?? [];
  const existingDomains = new Set(existingWhitelist.map((e) => e.domain));

  const newEntries: WhitelistEntry[] = [];
  const now = Date.now();

  for (const entry of AUTO_WHITELIST_DOMAINS) {
    if (!existingDomains.has(entry.domain)) {
      newEntries.push({
        domain: entry.domain,
        label: entry.label,
        addedAt: now,
      });
      existingDomains.add(entry.domain);
    }
  }

  if (newEntries.length > 0) {
    await chrome.storage.local.set({
      whitelist: [...existingWhitelist, ...newEntries],
    });
  }
}
