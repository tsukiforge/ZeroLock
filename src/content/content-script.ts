/**
 * ZeroLock Content Script
 *
 * Minimal content script for page-level interactions.
 * Only injects when needed for logout URL detection.
 * Does NOT read passwords, form data, or any user input.
 *
 * Security: No eval(), no Function(), no innerHTML.
 * No access to page variables or form fields.
 */

// This self-executing function ensures Vite doesn't tree-shake
// this module into an empty 0-byte file, which Chrome rejects.
(function initContentScript(): void {
  // Listen for messages from the extension
  chrome.runtime.onMessage.addListener(
    (message: unknown, _sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => {
      if (typeof message === 'object' && message !== null && 'type' in message) {
        const msg = message as { type: string };
        if (msg.type === 'PING_CONTENT_SCRIPT') {
          sendResponse({ alive: true });
        }
      }
      // Return true to keep the message channel open for async response
      return true;
    },
  );
})();

// Export satisfies module system without being tree-shakeable
export const CONTENT_SCRIPT_VERSION = '1.0.0';
