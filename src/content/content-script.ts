/**
 * ZeroLock Content Script
 *
 * Handles page-level interactions:
 * - Detects website visits for blacklist prompt
 * - Listens for messages from the extension
 *
 * Security: No eval(), no Function(), no innerHTML.
 * No access to page variables or form fields.
 */

(function initContentScript(): void {
  // ==========================================================================
  // Detect website visit
  // ==========================================================================
  // Send current domain to background worker for:
  // 1. Updating lastVisitedAt for blacklisted domains
  // 2. Showing blacklist prompt for new domains
  
  try {
    const domain = window.location.hostname;
    if (domain) {
      chrome.runtime.sendMessage({
        type: 'visitWebsite',
        payload: { domain },
      }).catch(() => {
        // Background worker might not be ready yet - silently ignore
      });
    }
  } catch {
    // Silently fail
  }

  // ==========================================================================
  // Message listener
  // ==========================================================================
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
      if (typeof message === 'object' && message !== null && 'type' in message) {
        const msg = message as { type: string };
        if (msg.type === 'PING_CONTENT_SCRIPT') {
          sendResponse({ alive: true });
        }
      }
      return true;
    },
  );
})();

// Export satisfies module system without being tree-shakeable
export const CONTENT_SCRIPT_VERSION = '1.0.0';
