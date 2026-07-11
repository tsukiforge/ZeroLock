/**
 * Tests for Domain Utilities
 */

import { describe, it, expect } from 'vitest';
import { extractDomain, domainsMatch, getBaseDomain, isValidDomain } from '../../../src/utils/domain';

describe('extractDomain', () => {
  it('should extract domain from URL', () => {
    expect(extractDomain('https://discord.com/channels')).toBe('discord.com');
    expect(extractDomain('https://www.github.com')).toBe('github.com');
  });

  it('should handle raw domain input', () => {
    expect(extractDomain('discord.com')).toBe('discord.com');
  });

  it('should return null for invalid input', () => {
    expect(extractDomain('')).toBeNull();
  });
});

describe('domainsMatch', () => {
  it('should match exact domains', () => {
    expect(domainsMatch('discord.com', 'discord.com')).toBe(true);
  });

  it('should match subdomains', () => {
    expect(domainsMatch('accounts.google.com', 'google.com')).toBe(true);
    expect(domainsMatch('google.com', 'accounts.google.com')).toBe(true);
  });

  it('should not match different domains', () => {
    expect(domainsMatch('discord.com', 'github.com')).toBe(false);
  });
});

describe('getBaseDomain', () => {
  it('should extract base domain', () => {
    expect(getBaseDomain('sub.example.com')).toBe('example.com');
    expect(getBaseDomain('example.com')).toBe('example.com');
  });

  it('should return null for invalid input', () => {
    expect(getBaseDomain('')).toBeNull();
  });
});

describe('isValidDomain', () => {
  it('should validate domains', () => {
    expect(isValidDomain('example.com')).toBe(true);
    expect(isValidDomain('sub.example.com')).toBe(true);
  });

  it('should reject invalid domains', () => {
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain('notvalid')).toBe(false);
  });
});
