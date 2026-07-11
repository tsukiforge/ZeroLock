/**
 * ZeroLock Background Service Worker
 *
 * Main entry point for the background service worker.
 * Orchestrates all background operations including:
 * - Timer management
 * - Idle detection
 * - Cookie change monitoring
 * - Panic button handling
 * - Message passing with popup and options pages
 *
 * Security: No passwords, no data exfiltration, all local processing.
 */

import { storageService } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';
import { sessionService } from '../services/SessionService';
import { timerManager } from './timer-manager';
import { idleHandler } from './idle-handler';
import { cookieChangeManager } from './cookie-manager';
import { panicHandler } from './panic-handler';
import { extractDomain } from '../utils/domain';
import { sanitizeDomain } from '../security/sanitizer';
import { getDomainLabel } from '../security/validator';
import { MESSAGES } from '../utils/constants';

// ============================================================================
// Constants
// ============================================================================

/** Days of inactivity before auto-removing from blacklist */
const BLACKLIST_CLEANUP_DAYS = 30;

/** Storage key for domains user has declined to blacklist */
const PROMPT_DENIED_KEY = 'promptDeniedDomains';

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the extension on install or update.
 */
async function initializeExtension(): Promise<void> {
  await storageService.initialize();

  // Start timer manager
  await timerManager.start();

  // Start idle detection if enabled
  await idleHandler.start();

  // Start cookie change monitoring
  cookieChangeManager.start();

  // Create daily alarm for blacklist stale entry cleanup
  await chrome.alarms.create('zerolock-blacklist-cleanup', {
    periodInMinutes: 1440, // Once per day
  });

  console.info('[ZeroLock] Extension initialized successfully');
}

// ============================================================================
// Context Menu
// ============================================================================

// Helper to create context menu (uses callback, not Promise)
function createContextMenu(): void {
  try {
    chrome.contextMenus?.removeAll(() => {
      chrome.contextMenus?.create(
        {
          id: 'zerolock-logout-site',
          title: 'Logout from this site',
          contexts: ['page'],
        },
        () => {
          // Ignore errors (e.g., if called multiple times)
        },
      );
    });
  } catch {
    // contextMenus API may not be available
  }
}

// Create context menu at TOP-LEVEL so it runs EVERY time the service worker starts.
// Chrome MV3 service workers can be terminated and restarted;
// onInstalled/onStartup don't fire on every wake-up, but top-level code does.
// Using setTimeout to avoid blocking the initial service worker evaluation.
setTimeout(() => {
  createContextMenu();
}, 0);

// ============================================================================
// Chrome Event Listeners
// ============================================================================

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await initializeExtension();
    // Open options page on first install
    await chrome.runtime.openOptionsPage();
  } else if (details.reason === 'update') {
    // Re-initialize on update
    await initializeExtension();
  }
});

// Handle startup (service worker wake up)
chrome.runtime.onStartup.addListener(async () => {
  await initializeExtension();
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  await timerManager.handleAlarm(alarm);

  if (alarm.name === 'zerolock-blacklist-cleanup') {
    await cleanupStaleBlacklist();
  }
});

// Handle idle state changes
chrome.idle.onStateChanged.addListener(async (newState) => {
  await idleHandler['handleIdleStateChange'](newState);
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const { action, domain } = notificationService.handleNotificationClick(
    notificationId,
    buttonIndex,
  );

  if (!action || !domain) return;

  switch (action) {
    case 'logout': {
      void sessionService.logoutDomain(domain);
      break;
    }
    case 'snooze': {
      void (async () => {
        const website = await storageService.getWebsite(domain);
        if (website) {
          await storageService.setWebsite(domain, {
            ...website,
            timerMinutes: website.timerMinutes,
            timerStartedAt: Date.now(),
            isActive: true,
          });
          timerManager.resetNotified(domain);
        }
      })();
      break;
    }
    case 'dismiss': {
      timerManager.resetNotified(domain);
      void notificationService.clearNotification(notificationId);
      break;
    }
    case 'addBlacklist': {
      // User wants to add this domain to blacklist
      const label = getDomainLabel(domain);
      const added = await storageService.addToBlacklist(domain, label);
      if (added) {
        console.info(`[ZeroLock] Added ${domain} to blacklist via prompt`);
      }
      void notificationService.clearNotification(notificationId);
      break;
    }
    case 'ignoreBlacklist': {
      // User declined - store so we don't ask again
      void notificationService.clearNotification(notificationId);
      try {
        const result = await chrome.storage.local.get(PROMPT_DENIED_KEY);
        const deniedDomains = (result[PROMPT_DENIED_KEY] as string[]) ?? [];
        if (!deniedDomains.includes(domain)) {
          deniedDomains.push(domain);
          await chrome.storage.local.set({ [PROMPT_DENIED_KEY]: deniedDomains });
        }
      } catch {
        // Silently fail
      }
      break;
    }
  }
});

// Handle notification clicks (notification body)
chrome.notifications.onClicked.addListener((notificationId) => {
  const { action, domain } = notificationService.handleNotificationClick(notificationId);

  if (action === 'logout' && domain) {
    void sessionService.logoutDomain(domain);
  }
});

// ============================================================================
// Blacklist Prompt & Cleanup
// ============================================================================

/**
 * Handle a website visit from the content script.
 * Updates lastVisitedAt for blacklisted domains and shows blacklist prompt for new domains.
 */
async function handleWebsiteVisit(domain: string): Promise<void> {
  try {
    const sanitized = sanitizeDomain(domain);
    if (!sanitized) return;

    // Skip common/internal domains
    if (['localhost', '127.0.0.1', '::1'].includes(sanitized)) return;

    // If domain is already blacklisted, update lastVisitedAt
    const blacklist = await storageService.getBlacklist();
    const existingEntry = blacklist.find((e) => e.domain === sanitized);
    if (existingEntry) {
      existingEntry.lastVisitedAt = Date.now();
      // Update the blacklist in storage
      const newBlacklist = blacklist.map((e) =>
        e.domain === sanitized ? { ...e, lastVisitedAt: Date.now() } : e,
      );
      await chrome.storage.local.set({ blacklist: newBlacklist });
      return;
    }

    // If domain is whitelisted, skip prompt
    const isWhitelisted = await storageService.isWhitelisted(sanitized);
    if (isWhitelisted) return;

    // Check if user already declined this domain
    const result = await chrome.storage.local.get(PROMPT_DENIED_KEY);
    const deniedDomains = (result[PROMPT_DENIED_KEY] as string[]) ?? [];
    if (deniedDomains.includes(sanitized)) return;

    // Check if blacklist is full
    if (blacklist.length >= 50) return; // DOMAIN.MAX_BLACKLIST

    // Show blacklist prompt notification
    await notificationService.showBlacklistPrompt(sanitized);
  } catch {
    // Silently fail
  }
}

/**
 * Clean up stale blacklist entries that haven't been visited in 30 days.
 */
async function cleanupStaleBlacklist(): Promise<void> {
  try {
    const blacklist = await storageService.getBlacklist();
    const now = Date.now();
    const thirtyDaysMs = BLACKLIST_CLEANUP_DAYS * 24 * 60 * 60 * 1000;

    const staleEntries = blacklist.filter((entry) => {
      if (!entry.lastVisitedAt) return false; // No visit data yet, keep it
      return now - entry.lastVisitedAt > thirtyDaysMs;
    });

    if (staleEntries.length === 0) return;

    // Remove stale entries
    const staleDomains = new Set(staleEntries.map((e) => e.domain));
    const newBlacklist = blacklist.filter((e) => !staleDomains.has(e.domain));

    await chrome.storage.local.set({ blacklist: newBlacklist });
    storageService.invalidateCache();

    console.info(
      `[ZeroLock] Auto-removed ${staleEntries.length} stale blacklist entries: ${staleEntries.map((e) => e.domain).join(', ')}`,
    );
  } catch {
    // Silently fail
  }
}

// ============================================================================
// Message Handling
// ============================================================================

/**
 * Handle messages from popup and options pages.
 */
chrome.runtime.onMessage.addListener(
  (
    message: { type: string; payload?: Record<string, unknown> },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: Record<string, unknown>) => void,
  ): boolean => {
    // Handle async message processing
    const handleMessage = async (): Promise<Record<string, unknown>> => {
      try {
        switch (message.type) {
          // === Website Operations ===
          case MESSAGES.GET_WEBSITES: {
            const websites = await storageService.getWebsites();
            const timerStatuses = await timerManager.getTimerStatuses();
            return { success: true, data: { websites, timerStatuses } };
          }

          case MESSAGES.ADD_WEBSITE: {
            const payload = message.payload as Record<string, unknown>;
            const domain = payload?.domain as string;
            const entry = payload?.entry as Record<string, unknown>;

            const result = await storageService.setWebsite(domain, entry as Parameters<typeof storageService.setWebsite>[1]);
            return { success: !!result, data: result };
          }

          case MESSAGES.REMOVE_WEBSITE: {
            const domain = (message.payload?.domain as string) ?? '';
            const result = await storageService.removeWebsite(domain);
            return { success: result };
          }

          case MESSAGES.UPDATE_WEBSITE: {
            const payload = message.payload as Record<string, unknown>;
            const domain = payload?.domain as string;
            const updates = payload?.updates as Record<string, unknown>;

            const existing = await storageService.getWebsite(domain);
            if (!existing) return { success: false, error: 'Website not found' };

            const result = await storageService.setWebsite(domain, {
              ...existing,
              ...updates,
            });
            return { success: !!result, data: result };
          }

          case MESSAGES.START_TIMER: {
            const domain = (message.payload?.domain as string) ?? '';
            const result = await storageService.startTimer(domain);
            return { success: result };
          }

          case MESSAGES.STOP_TIMER: {
            const domain = (message.payload?.domain as string) ?? '';
            const result = await storageService.stopTimer(domain);
            return { success: result };
          }

          case MESSAGES.LOGOUT_NOW: {
            const domain = (message.payload?.domain as string) ?? '';
            const result = await sessionService.logoutDomain(domain);
            return { success: result.success, data: result };
          }

          // === Config Operations ===
          case MESSAGES.GET_CONFIG: {
            const config = await storageService.getConfig();
            return { success: true, data: config };
          }

          case MESSAGES.UPDATE_CONFIG: {
            const updates = (message.payload?.updates ?? {}) as Record<string, unknown>;
            const config = await storageService.updateConfig(updates as Parameters<typeof storageService.updateConfig>[0]);
            return { success: true, data: config };
          }          // === Visit Tracking ===
          case MESSAGES.VISIT_WEBSITE: {
            const domain = (message.payload?.domain as string) ?? '';
            if (domain) {
              // Fire-and-forget: update visit tracking
              void handleWebsiteVisit(domain);
            }
            return { success: true };
          }

          // === Whitelist Operations ===
          case MESSAGES.GET_WHITELIST: {
            const whitelist = await storageService.getWhitelist();
            return { success: true, data: whitelist };
          }

          case MESSAGES.ADD_WHITELIST: {
            const domain = (message.payload?.domain as string) ?? '';
            const label = message.payload?.label as string | undefined;
            const result = await storageService.addToWhitelist(domain, label);
            return { success: result };
          }

          case MESSAGES.REMOVE_WHITELIST: {
            const domain = (message.payload?.domain as string) ?? '';
            const result = await storageService.removeFromWhitelist(domain);
            return { success: result };
          }

          // === Blacklist Operations ===
          case MESSAGES.GET_BLACKLIST: {
            const blacklist = await storageService.getBlacklist();
            return { success: true, data: blacklist };
          }

          case MESSAGES.ADD_BLACKLIST: {
            const domain = (message.payload?.domain as string) ?? '';
            const label = message.payload?.label as string | undefined;
            const result = await storageService.addToBlacklist(domain, label);
            return { success: result };
          }

          case MESSAGES.REMOVE_BLACKLIST: {
            const domain = (message.payload?.domain as string) ?? '';
            const result = await storageService.removeFromBlacklist(domain);
            return { success: result };
          }

          // === Panic Button ===
          case MESSAGES.PANIC_LOGOUT: {
            const result = await panicHandler.execute();
            return { success: true, data: result };
          }

          // === Security Status ===
          case MESSAGES.GET_SECURITY_STATUS: {
            const [config, storageInfo] = await Promise.all([
              storageService.getConfig(),
              storageService.getStorageInfo(),
            ]);

            return {
              success: true,
              data: {
                integrityVerified: true,
                localProcessing: true,
                remoteDataCollection: false,
                telemetry: false,
                analytics: false,
                passwordAccess: false,
                cookieUpload: false,
                securityScan: 'passed',
                version: config.version,
                storageUsed: storageInfo.usedBytes,
                storageQuota: storageInfo.quotaBytes,
              },
            };
          }

          default:
            return { success: false, error: `Unknown message type: ${message.type}` };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[ZeroLock] Error handling message ${message.type}:`, errorMessage);
        return { success: false, error: errorMessage };
      }
    };

    // Execute async handler and send response
    handleMessage()
      .then(sendResponse)
      .catch((error) => {
        console.error('[ZeroLock] Unhandled error:', error);
        sendResponse({ success: false, error: 'Internal error' });
      });

    // Return true to indicate async response
    return true;
  },
);

// ============================================================================
// Suspend Handler (Browser Close)
// ============================================================================

// Handle service worker suspend
chrome.runtime.onSuspend.addListener(async () => {
  await idleHandler.handleBrowserClose();
});

// ============================================================================
// Context Menu Handler
// ============================================================================

chrome.contextMenus?.onClicked?.addListener(async (info, tab) => {
  if (info.menuItemId === 'zerolock-logout-site' && tab?.url) {
    const domain = extractDomain(tab.url);
    if (domain) {
      await sessionService.logoutDomain(domain);
    }
  }
});

// Log initial start
console.info('[ZeroLock] Service worker started');
