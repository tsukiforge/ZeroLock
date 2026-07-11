/**
 * ZeroLock Storage Types
 *
 * All data is stored exclusively in chrome.storage.local.
 * No localStorage, sessionStorage, or IndexedDB is used.
 */

/** Timer duration options in minutes */
export const TIMER_DURATIONS = [30, 60, 120, 180, 360, 720, 1440] as const;

export type TimerDuration = (typeof TIMER_DURATIONS)[number];

/** A website entry managed by ZeroLock */
export interface WebsiteEntry {
  /** Domain name (e.g., "discord.com") */
  domain: string;
  /** Timer duration in minutes */
  timerMinutes: TimerDuration | number;
  /** Whether auto-logout is enabled */
  autoLogout: boolean;
  /** Whether to close tabs on logout */
  closeTabs: boolean;
  /** Timestamp when the timer was started (epoch ms) */
  timerStartedAt: number | null;
  /** Whether the timer is currently active */
  isActive: boolean;
  /** When this entry was created */
  createdAt: number;
  /** When this entry was last modified */
  updatedAt: number;
}

/** Whitelist entry - websites never auto-logout */
export interface WhitelistEntry {
  domain: string;
  label: string;
  addedAt: number;
}

/** Blacklist entry - websites always auto-logout */
export interface BlacklistEntry {
  domain: string;
  label: string;
  addedAt: number;
}

/** App configuration */
export interface AppConfig {
  /** Theme: 'light' | 'dark' | 'system' */
  theme: 'light' | 'dark' | 'system';
  /** Idle detection timeout in minutes */
  idleTimeoutMinutes: number;
  /** Whether idle detection is enabled */
  idleDetectionEnabled: boolean;
  /** Whether to logout when browser closes */
  logoutOnBrowserClose: boolean;
  /** Whether to logout when PC is locked */
  logoutOnLock: boolean;
  /** Default timer in minutes for new websites */
  defaultTimerMinutes: TimerDuration | number;
  /** Whether notifications are enabled */
  notificationsEnabled: boolean;
  /** Extension version */
  version: string;
}

/** Notification action response */
export type NotificationAction = 'logout' | 'snooze' | 'dismiss';

/** Timer status for a website */
export type TimerStatus = 'running' | 'expired' | 'paused' | 'idle';

/** Complete ZeroLock storage schema */
export interface ZeroLockStorage {
  /** Map of domain -> website entry */
  websites: Record<string, WebsiteEntry>;
  /** Whitelist entries */
  whitelist: WhitelistEntry[];
  /** Blacklist entries */
  blacklist: BlacklistEntry[];
  /** App configuration */
  config: AppConfig;
  /** Extension installation timestamp */
  installedAt: number;
  /** Last panic button activation timestamp */
  lastPanicAt: number | null;
}

/** Default configuration values */
export const DEFAULT_CONFIG: AppConfig = {
  theme: 'system',
  idleTimeoutMinutes: 30,
  idleDetectionEnabled: false,
  logoutOnBrowserClose: false,
  logoutOnLock: false,
  defaultTimerMinutes: 60,
  notificationsEnabled: true,
  version: '1.0.0',
};

/** Storage keys */
export const STORAGE_KEYS = {
  WEBSITES: 'websites',
  WHITELIST: 'whitelist',
  BLACKLIST: 'blacklist',
  CONFIG: 'config',
  INSTALLED_AT: 'installedAt',
  LAST_PANIC_AT: 'lastPanicAt',
} as const;

/** Timer preset labels */
export const TIMER_PRESETS: Record<TimerDuration | number, string> = {
  30: '30 minutes',
  60: '1 hour',
  120: '2 hours',
  180: '3 hours',
  360: '6 hours',
  720: '12 hours',
  1440: '24 hours',
};
