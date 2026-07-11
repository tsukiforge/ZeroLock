/**
 * ZeroLock Security - Sanitizer
 *
 * Provides strict input sanitization utilities.
 * All user input MUST be sanitized before use.
 * Never use innerHTML with user data.
 * Never use eval() or Function().
 */

// DOMPurify is dynamically imported only when needed because
// it requires `document` which is not available in service workers.

/** Characters that must be escaped in HTML context */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escape HTML special characters to prevent XSS.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Sanitize a domain string (lowercase, trim, strip protocol/path).
 * Returns null if invalid.
 */
export function sanitizeDomain(input: string): string | null {
  if (typeof input !== 'string') return null;

  let domain = input.trim().toLowerCase();

  // Strip protocol
  domain = domain.replace(/^(https?:\/\/)/, '');

  // Strip www. prefix
  domain = domain.replace(/^www\./, '');

  // Strip path and query
  domain = domain.split('/')[0]?.split('?')[0]?.split('#')[0] ?? '';

  // Validate basic domain format
  const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!domainRegex.test(domain)) return null;

  // Maximum domain length
  if (domain.length > 253) return null;

  return domain;
}

/**
 * Sanitize a label/name string.
 * Strips any HTML, trims whitespace, limits length.
 */
export function sanitizeLabel(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => HTML_ESCAPE_MAP[char] ?? char)
    .slice(0, 100); // Limit length
}

/**
 * Sanitize URL for safe display (not for navigation).
 */
export function sanitizeUrlForDisplay(url: string): string {
  if (typeof url !== 'string') return '';

  const sanitized = escapeHtml(url.trim());
  return sanitized.length > 500 ? `${sanitized.slice(0, 497)}...` : sanitized;
}

/**
 * Validate that a string is a positive integer within range.
 */
export function validatePositiveInt(value: string, min = 1, max = 10080): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num < min || num > max) return null;

  return num;
}

/**
 * Sanitize text for safe use in textContent / React (defense in depth).
 * Removes null bytes and control characters.
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[\0-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

/**
 * Sanitize HTML string using DOMPurify (defense-in-depth).
 * Only use when you must render HTML. Prefer textContent / React.
 * Uses dynamic import to avoid loading DOMPurify in service worker context.
 */
export async function sanitizeHtml(html: string): Promise<string> {
  try {
    const DOMPurify = (await import('dompurify')).default;
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [], // Strip all tags
      ALLOWED_ATTR: [],
    });
  } catch {
    // Fallback: strip HTML tags manually if DOMPurify is unavailable
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Ensure a value is a plain object (not array, null, or prototype-polluted).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ensurePlainObject(value: any): Record<string, unknown> {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  // Check for prototype pollution
  const proto = Object.getPrototypeOf(value);
  if (proto !== null && proto !== Object.prototype) {
    return {};
  }
  return value as Record<string, unknown>;
}
