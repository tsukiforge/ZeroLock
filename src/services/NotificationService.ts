/**
 * ZeroLock Notification Service
 *
 * Manages browser notifications for session expiry alerts.
 * Notifications are purely local - no data is sent anywhere.
 */

import { sanitizeText } from '../security/sanitizer';
import { getDomainLabel } from '../security/validator';

/** Prefix for ZeroLock notification IDs */
const NOTIFICATION_ID_PREFIX = 'zerolock-session-';
const LOGOUT_SUCCESS_PREFIX = 'zerolock-logout-success-';

class NotificationService {
  /**
   * Show a session expiry notification.
   */
  async showSessionExpired(domain: string): Promise<string> {
    const safeDomain = sanitizeText(domain);
    const label = getDomainLabel(safeDomain);
    const notificationId = `${NOTIFICATION_ID_PREFIX}${safeDomain}`;

    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Session Expired',
        message: `${label} session has exceeded the time limit.`,
        priority: 2,
        buttons: [
          { title: 'Logout' },
          { title: 'Snooze' },
          { title: 'Dismiss' },
        ],
        requireInteraction: true,
        silent: false,
      });

      return notificationId;
    } catch {
      return '';
    }
  }

  /**
   * Show a session warning notification (before expiry).
   */
  async showSessionWarning(domain: string, minutesRemaining: number): Promise<string> {
    const safeDomain = sanitizeText(domain);
    const label = getDomainLabel(safeDomain);
    const safeMinutes = Math.max(1, minutesRemaining);
    const notificationId = `${NOTIFICATION_ID_PREFIX}warning-${safeDomain}`;

    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Session Ending Soon',
        message: `${label} session will expire in ${safeMinutes} minute${safeMinutes > 1 ? 's' : ''}.`,
        priority: 1,
        requireInteraction: false,
        silent: true,
      });

      return notificationId;
    } catch {
      return '';
    }
  }

  /**
   * Show a logout success notification.
   * Tells the user that the website has been logged out.
   */
  async showLogoutSuccess(domain: string, cookiesRemoved: number): Promise<string> {
    const safeDomain = sanitizeText(domain);
    const label = getDomainLabel(safeDomain);
    const notificationId = `${LOGOUT_SUCCESS_PREFIX}${safeDomain}`;

    try {
      await chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '✅ Logout Successful',
        message: `${label} telah logout sepenuhnya. Login kembali jika ingin masuk. (${cookiesRemoved} cookies dihapus)`,
        priority: 2,
        buttons: [{ title: 'OK' }],
        requireInteraction: false,
        silent: false,
      });

      return notificationId;
    } catch {
      return '';
    }
  }

  /**
   * Clear a specific notification.
   */
  async clearNotification(notificationId: string): Promise<void> {
    try {
      await chrome.notifications.clear(notificationId);
    } catch {
      // Silently fail
    }
  }

  /**
   * Clear all ZeroLock notifications.
   */
  async clearAllNotifications(): Promise<void> {
    try {
      const allNotifications: Record<string, boolean> = await new Promise((resolve) => {
        chrome.notifications.getAll((notifications) => {
          resolve(notifications as Record<string, boolean>);
        });
      });
      const zerolockNotifications = Object.keys(allNotifications).filter(
        (id) => id.startsWith(NOTIFICATION_ID_PREFIX) || id.startsWith(LOGOUT_SUCCESS_PREFIX),
      );

      await Promise.all(
        zerolockNotifications.map((id) => chrome.notifications.clear(id)),
      );
    } catch {
      // Silently fail
    }
  }

  /**
   * Handle notification button clicks.
   * Returns the action and domain.
   */
  handleNotificationClick(
    notificationId: string,
    buttonIndex?: number,
  ): { action: 'logout' | 'snooze' | 'dismiss' | null; domain: string | null } {
    // Handle logout success notifications (just dismiss, no action needed)
    if (notificationId.startsWith(LOGOUT_SUCCESS_PREFIX)) {
      return { action: 'dismiss', domain: notificationId.replace(LOGOUT_SUCCESS_PREFIX, '') };
    }

    if (!notificationId.startsWith(NOTIFICATION_ID_PREFIX)) {
      return { action: null, domain: null };
    }

    // Extract domain from notification ID
    const domain = notificationId.replace(NOTIFICATION_ID_PREFIX, '').replace('warning-', '');

    if (buttonIndex === undefined) {
      // Notification body clicked - default to logout
      return { action: 'logout', domain };
    }

    switch (buttonIndex) {
      case 0:
        return { action: 'logout', domain };
      case 1:
        return { action: 'snooze', domain };
      case 2:
        return { action: 'dismiss', domain };
      default:
        return { action: null, domain: null };
    }
  }
}

// Singleton instance
export const notificationService = new NotificationService();
