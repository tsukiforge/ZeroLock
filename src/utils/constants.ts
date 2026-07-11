/**
 * ZeroLock Application Constants
 */

export const APP = {
  NAME: 'ZeroLock',
  FULL_NAME: 'ZeroLock – Privacy First Session Manager',
  VERSION: '1.0.0',
  DESCRIPTION: 'Privacy-first automatic session manager for Chrome',
  MANIFEST_VERSION: 3,
  HOMEPAGE: 'https://github.com/tsukiforge/ZeroLock',
  LICENSE: 'MIT',
  COPYRIGHT: `ZeroLock © ${new Date().getFullYear()}`,
} as const;

export const TIMER = {
  /** Minimum timer in minutes */
  MIN_MINUTES: 1,
  /** Maximum timer in minutes (7 days) */
  MAX_MINUTES: 10080,
  /** Default timer in minutes */
  DEFAULT_MINUTES: 60,
  /** Notification lead time in seconds before timer expiry */
  NOTIFICATION_LEAD_SECONDS: 10,
  /** How often to check timers (in seconds) */
  CHECK_INTERVAL_SECONDS: 15,
  /** Snooze duration in minutes */
  SNOOZE_MINUTES: 15,
} as const;

export const IDLE = {
  /** Default idle timeout in minutes */
  DEFAULT_TIMEOUT_MINUTES: 30,
  /** Minimum idle timeout in minutes */
  MIN_TIMEOUT_MINUTES: 5,
  /** Maximum idle timeout in minutes */
  MAX_TIMEOUT_MINUTES: 120,
  /** How often to check idle state (in seconds) */
  CHECK_INTERVAL_SECONDS: 30,
} as const;

export const STORAGE = {
  /** chrome.storage.local quota limit */
  QUOTA_BYTES: 5_242_880, // 5MB
  /** Warning threshold (80% of quota) */
  QUOTA_WARNING_BYTES: 4_194_304,
} as const;

export const DOMAIN = {
  /** Maximum domain length */
  MAX_LENGTH: 253,
  /** Maximum number of managed websites */
  MAX_WEBSITES: 100,
  /** Maximum whitelist entries */
  MAX_WHITELIST: 50,
  /** Maximum blacklist entries */
  MAX_BLACKLIST: 50,
} as const;

export const NOTIFICATION = {
  /** Notification ID prefix */
  ID_PREFIX: 'zerolock-session-',
  /** Default notification timeout (ms) */
  DEFAULT_TIMEOUT_MS: 30_000,
} as const;

export const ALARMS = {
  /** Alarm name for timer checks */
  TIMER_CHECK: 'zerolock-timer-check',
  /** Alarm name for idle detection */
  IDLE_CHECK: 'zerolock-idle-check',
  /** Alarm period in minutes */
  PERIOD_MINUTES: 1,
} as const;

export const MESSAGES = {
  // Popup -> Background
  GET_WEBSITES: 'getWebsites',
  ADD_WEBSITE: 'addWebsite',
  REMOVE_WEBSITE: 'removeWebsite',
  UPDATE_WEBSITE: 'updateWebsite',
  START_TIMER: 'startTimer',
  STOP_TIMER: 'stopTimer',
  LOGOUT_NOW: 'logoutNow',
  GET_CONFIG: 'getConfig',
  UPDATE_CONFIG: 'updateConfig',
  PANIC_LOGOUT: 'panicLogout',
  GET_WHITELIST: 'getWhitelist',
  ADD_WHITELIST: 'addWhitelist',
  REMOVE_WHITELIST: 'removeWhitelist',
  GET_BLACKLIST: 'getBlacklist',
  ADD_BLACKLIST: 'addBlacklist',
  REMOVE_BLACKLIST: 'removeBlacklist',
  GET_SECURITY_STATUS: 'getSecurityStatus',

  // Content Script -> Background
  VISIT_WEBSITE: 'visitWebsite',

  // Background -> Popup/Options
  SESSION_EXPIRED: 'sessionExpired',
  PANIC_COMPLETE: 'panicComplete',
  STORAGE_CHANGED: 'storageChanged',
} as const;

export const STORAGE_DEFAULTS = {
  websites: {},
  whitelist: [],
  blacklist: [],
  config: {
    theme: 'system' as const,
    idleTimeoutMinutes: 30,
    idleDetectionEnabled: false,
    logoutOnBrowserClose: false,
    logoutOnLock: false,
    defaultTimerMinutes: 60,
    notificationsEnabled: true,
    version: '1.0.0',
  },
};
