/**
 * ZeroLock Timer Manager
 *
 * Manages session timers for all tracked websites.
 * Runs checks periodically via chrome.alarms.
 * Triggers notifications and auto-logout when timers expire.
 */

import { storageService } from '../services/StorageService';
import { notificationService } from '../services/NotificationService';
import { sessionService } from '../services/SessionService';
import { isExpired, getRemainingMinutes } from '../utils/timer';
import { calculateExpiry } from '../utils/timer';
import { ALARMS, TIMER } from '../utils/constants';

class TimerManager {
  private checkIntervalId: ReturnType<typeof setInterval> | null = null;
  private notifiedDomains: Set<string> = new Set();

  /**
   * Start the timer check alarm.
   */
  async start(): Promise<void> {
    // Create periodic alarm for timer checks
    await chrome.alarms.create(ALARMS.TIMER_CHECK, {
      periodInMinutes: ALARMS.PERIOD_MINUTES,
    });

    // Also run in-memory checks every 15s for more responsive notifications
    this.checkIntervalId = setInterval(() => {
      void this.checkTimers();
    }, TIMER.CHECK_INTERVAL_SECONDS * 1000);

    // Run initial check
    await this.checkTimers();
  }

  /**
   * Stop the timer check alarm.
   */
  async stop(): Promise<void> {
    await chrome.alarms.clear(ALARMS.TIMER_CHECK);

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }

    this.notifiedDomains.clear();
  }

  /**
   * Handle alarm events.
   */
  async handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    if (alarm.name === ALARMS.TIMER_CHECK) {
      await this.checkTimers();
    }
  }

  /**
   * Check all website timers for expiry.
   */
  async checkTimers(): Promise<void> {
    const websites = await storageService.getWebsites();

    for (const [domain, entry] of Object.entries(websites)) {
      if (!entry.isActive || !entry.timerStartedAt) continue;

      // Check whitelist - skip whitelisted domains
      const isWhitelisted = await storageService.isWhitelisted(domain);
      if (isWhitelisted) continue;

      const expiryTime = calculateExpiry(entry.timerMinutes, entry.timerStartedAt);
      const now = Date.now();

      if (!isExpired(expiryTime, now)) {
        // Check if we should send a warning notification
        const remainingMinutes = getRemainingMinutes(expiryTime, now);
        if (remainingMinutes <= 5 && remainingMinutes > 0 && !this.notifiedDomains.has(domain)) {
          await notificationService.showSessionWarning(domain, remainingMinutes);
          this.notifiedDomains.add(domain);
        }
        continue;
      }

      // Timer has expired
      if (entry.autoLogout) {
        // Auto-logout is enabled - execute logout
        await sessionService.logoutDomain(domain);
      } else {
        // Just show notification
        await notificationService.showSessionExpired(domain);
      }

      // Reset notified status
      this.notifiedDomains.delete(domain);

      // Update website entry - mark timer as inactive
      await storageService.stopTimer(domain);
    }
  }

  /**
   * Get timer status for all websites.
   */
  async getTimerStatuses(): Promise<
    Record<string, { remaining: number; expiryTime: number; status: 'running' | 'expired' | 'paused' }>
  > {
    const websites = await storageService.getWebsites();
    const statuses: Record<string, { remaining: number; expiryTime: number; status: 'running' | 'expired' | 'paused' }> = {};

    for (const [domain, entry] of Object.entries(websites)) {
      if (!entry.timerStartedAt || !entry.isActive) {
        statuses[domain] = { remaining: 0, expiryTime: 0, status: 'paused' };
        continue;
      }

      const expiryTime = calculateExpiry(entry.timerMinutes, entry.timerStartedAt);
      const now = Date.now();

      if (isExpired(expiryTime, now)) {
        statuses[domain] = { remaining: 0, expiryTime, status: 'expired' };
      } else {
        statuses[domain] = {
          remaining: expiryTime - now,
          expiryTime,
          status: 'running',
        };
      }
    }

    return statuses;
  }

  /**
   * Reset notified domains for a specific domain (after snooze/dismiss).
   */
  resetNotified(domain: string): void {
    this.notifiedDomains.delete(domain);
  }

  /**
   * Clear all notified domains.
   */
  resetAllNotified(): void {
    this.notifiedDomains.clear();
  }
}

// Singleton instance
export const timerManager = new TimerManager();
