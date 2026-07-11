/**
 * Tests for Security Sanitizer
 */

import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeDomain,
  sanitizeLabel,
  sanitizeText,
  validatePositiveInt,
  ensurePlainObject,
} from '../../../src/security/sanitizer';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;',
    );
  });

  it('should handle ampersands', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('should return empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not modify safe strings', () => {
    expect(escapeHtml('Hello, World!')).toBe('Hello, World!');
  });
});

describe('sanitizeDomain', () => {
  it('should sanitize a valid domain', () => {
    expect(sanitizeDomain('Discord.com')).toBe('discord.com');
  });

  it('should strip protocol', () => {
    expect(sanitizeDomain('https://discord.com')).toBe('discord.com');
    expect(sanitizeDomain('http://github.com')).toBe('github.com');
  });

  it('should strip www prefix', () => {
    expect(sanitizeDomain('www.github.com')).toBe('github.com');
  });

  it('should strip path and query', () => {
    expect(sanitizeDomain('github.com/settings')).toBe('github.com');
    expect(sanitizeDomain('github.com?ref=abc')).toBe('github.com');
  });

  it('should reject invalid domains', () => {
    expect(sanitizeDomain('')).toBeNull();
    expect(sanitizeDomain('not-a-domain')).toBeNull();
    expect(sanitizeDomain('https://')).toBeNull();
  });

  it('should handle edge cases', () => {
    expect(sanitizeDomain('  github.com  ')).toBe('github.com');
    expect(sanitizeDomain('accounts.google.com')).toBe('accounts.google.com');
  });

  it('should reject null/undefined input', () => {
    expect(sanitizeDomain(null as unknown as string)).toBeNull();
  });
});

describe('sanitizeLabel', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeLabel('<script>alert("xss")</script>Facebook')).toBe('Facebook');
  });

  it('should escape special characters', () => {
    expect(sanitizeLabel('Facebook & Co')).toBe('Facebook &amp; Co');
  });

  it('should trim whitespace', () => {
    expect(sanitizeLabel('  GitHub  ')).toBe('GitHub');
  });

  it('should limit length', () => {
    const longString = 'a'.repeat(200);
    expect(sanitizeLabel(longString).length).toBe(100);
  });
});

describe('sanitizeText', () => {
  it('should remove null bytes and control characters', () => {
    expect(sanitizeText('hello\x00world')).toBe('helloworld');
    expect(sanitizeText('hello\x1Fworld')).toBe('helloworld');
  });

  it('should trim whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('should handle non-string input gracefully', () => {
    expect(sanitizeText(null as unknown as string)).toBe('');
    expect(sanitizeText(undefined as unknown as string)).toBe('');
  });
});

describe('validatePositiveInt', () => {
  it('should validate positive integers', () => {
    expect(validatePositiveInt('5')).toBe(5);
    expect(validatePositiveInt('100')).toBe(100);
  });

  it('should reject invalid inputs', () => {
    expect(validatePositiveInt('-5')).toBeNull();
    expect(validatePositiveInt('0')).toBeNull();
    expect(validatePositiveInt('abc')).toBeNull();
    expect(validatePositiveInt('12.5')).toBeNull();
  });

  it('should enforce range limits', () => {
    expect(validatePositiveInt('1', 5, 10)).toBeNull();
    expect(validatePositiveInt('15', 5, 10)).toBeNull();
    expect(validatePositiveInt('7', 5, 10)).toBe(7);
  });
});

describe('ensurePlainObject', () => {
  it('should return plain objects unchanged', () => {
    const obj = { a: 1, b: 2 };
    expect(ensurePlainObject(obj)).toEqual(obj);
  });

  it('should reject non-plain objects', () => {
    expect(ensurePlainObject(null)).toEqual({});
    expect(ensurePlainObject(undefined)).toEqual({});
    expect(ensurePlainObject('string')).toEqual({});
    expect(ensurePlainObject(42)).toEqual({});
    expect(ensurePlainObject([1, 2, 3])).toEqual({});
  });

  it('should reject prototype-polluted objects', () => {
    const polluted = Object.create({ malicious: true });
    polluted.a = 1;
    const result = ensurePlainObject(polluted);
    expect(result).toEqual({});
  });
});
