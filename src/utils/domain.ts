/**
 * ZeroLock Domain Utilities
 *
 * Domain parsing and comparison functions.
 * All domain operations use sanitized inputs.
 */

import { sanitizeDomain } from '../security/sanitizer';

/**
 * Extract domain from a URL string.
 */
export function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return sanitizeDomain(urlObj.hostname);
  } catch {
    // If URL parsing fails, try treating as raw domain
    return sanitizeDomain(url);
  }
}

/**
 * Check if two domains match (including subdomains).
 */
export function domainsMatch(domain1: string, domain2: string): boolean {
  const d1 = sanitizeDomain(domain1);
  const d2 = sanitizeDomain(domain2);

  if (!d1 || !d2) return false;
  if (d1 === d2) return true;

  // Check subdomain relationship
  return d1.endsWith(`.${d2}`) || d2.endsWith(`.${d1}`);
}

/**
 * Get the base domain (e.g., "sub.example.com" -> "example.com").
 */
export function getBaseDomain(domain: string): string | null {
  const sanitized = sanitizeDomain(domain);
  if (!sanitized) return null;

  const parts = sanitized.split('.');
  if (parts.length < 2) return null;

  // Return last two parts for most domains
  if (parts.length === 2) return sanitized;

  // Handle common multi-part TLDs
  const knownMultiTlds = new Set([
    'co.uk', 'org.uk', 'ac.uk', 'gov.uk',
    'com.au', 'net.au', 'org.au',
    'co.jp', 'ne.jp', 'or.jp',
    'co.nz', 'net.nz', 'org.nz',
    'co.kr', 'or.kr', 'ne.kr',
  ]);

  const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  if (knownMultiTlds.has(lastTwo) && parts.length >= 3) {
    return `${parts[parts.length - 3]}.${lastTwo}`;
  }

  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

/**
 * Get the TLD + 1 (e.g., "sub.example.com" -> "example.com").
 * Alias for getBaseDomain.
 */
export function getDomainTldPlus1(domain: string): string | null {
  return getBaseDomain(domain);
}

/**
 * Check if a domain is valid.
 */
export function isValidDomain(domain: string): boolean {
  return sanitizeDomain(domain) !== null;
}
