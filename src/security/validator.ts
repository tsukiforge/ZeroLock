/**
 * ZeroLock Security - Validator
 *
 * Validates all inputs and permissions against security policies.
 */

import { sanitizeDomain } from './sanitizer';

/** Known domain patterns for common sites (display labels) */
const KNOWN_DOMAINS: Record<string, string> = {
  'facebook.com': 'Facebook',
  'discord.com': 'Discord',
  'github.com': 'GitHub',
  'reddit.com': 'Reddit',
  'steamcommunity.com': 'Steam',
  'steampowered.com': 'Steam',
  'google.com': 'Google',
  'accounts.google.com': 'Google Accounts',
  'gmail.com': 'Gmail',
  'youtube.com': 'YouTube',
  'twitter.com': 'X (Twitter)',
  'x.com': 'X',
  'instagram.com': 'Instagram',
  'linkedin.com': 'LinkedIn',
  'twitch.tv': 'Twitch',
  'medium.com': 'Medium',
  'stackoverflow.com': 'Stack Overflow',
  'gitlab.com': 'GitLab',
  'bitbucket.org': 'Bitbucket',
  'whatsapp.com': 'WhatsApp',
  'telegram.org': 'Telegram',
  'spotify.com': 'Spotify',
  'netflix.com': 'Netflix',
  'amazon.com': 'Amazon',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'dropbox.com': 'Dropbox',
  'notion.so': 'Notion',
  'figma.com': 'Figma',
  'slack.com': 'Slack',
  'trello.com': 'Trello',
  'atlassian.com': 'Atlassian',
};

/**
 * Get a user-friendly label for a domain.
 */
export function getDomainLabel(domain: string): string {
  const sanitized = sanitizeDomain(domain);
  if (!sanitized) return domain;

  // Check known domains
  const label = KNOWN_DOMAINS[sanitized];
  if (label) return label;

  // Derive label from domain
  const parts = sanitized.split('.');
  if (parts.length >= 2 && parts[0] && parts[0] !== 'www') {
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  }

  return sanitized;
}

/**
 * Validate cookie removal permissions for a domain.
 */
export function canRemoveCookiesFor(domain: string): boolean {
  const sanitized = sanitizeDomain(domain);
  if (!sanitized) return false;

  // Must have a valid domain with at least one dot
  const parts = sanitized.split('.');
  return parts.length >= 2 && parts.every((part) => part.length > 0);
}

/**
 * Validate that a URL matches a managed domain.
 */
export function isDomainManaged(domain: string, managedDomains: Set<string>): boolean {
  const sanitized = sanitizeDomain(domain);
  if (!sanitized) return false;

  // Check exact match
  if (managedDomains.has(sanitized)) return true;

  // Check subdomain match (e.g., "accounts.google.com" matches "google.com" whitelist)
  for (const managed of managedDomains) {
    if (sanitized.endsWith(`.${managed}`) || sanitized === managed) {
      return true;
    }
  }

  return false;
}

/**
 * Validate timer duration input.
 */
export function validateTimerDuration(minutes: number): boolean {
  if (!Number.isFinite(minutes) || minutes <= 0) return false;
  if (minutes > 10080) return false; // Max 7 days
  return true;
}

/**
 * Validate that an input is a safe plain string (no objects, no functions).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSafeString(value: any): value is string {
  return typeof value === 'string' && value.length <= 1000;
}

/**
 * Validate storage data integrity.
 */
export function validateStorageData(data: Record<string, unknown>): boolean {
  if (!data || typeof data !== 'object') return false;

  const requiredKeys = ['websites', 'whitelist', 'blacklist', 'config'];
  return requiredKeys.every((key) => key in data);
}

/**
 * Check if a domain is a common login/identity domain that should be whitelisted.
 */
export function isIdentityDomain(domain: string): boolean {
  const identityDomains = [
    'accounts.google.com',
    'login.google.com',
    'auth.google.com',
    'login.microsoftonline.com',
    'login.live.com',
    'accounts.microsoft.com',
    'appleid.apple.com',
    'id.apple.com',
    'oauth.facebook.com',
    'accounts.spotify.com',
    'auth0.com',
    'okta.com',
    'onelogin.com',
  ];

  return identityDomains.some(
    (idDomain) => domain === idDomain || domain.endsWith(`.${idDomain}`),
  );
}
