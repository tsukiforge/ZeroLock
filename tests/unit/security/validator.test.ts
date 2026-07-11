/**
 * Tests for Security Validator
 */

import { describe, it, expect } from 'vitest';
import {
  getDomainLabel,
  canRemoveCookiesFor,
  isDomainManaged,
  validateTimerDuration,
  isSafeString,
  isIdentityDomain,
} from '../../../src/security/validator';

describe('getDomainLabel', () => {
  it('should return known domain labels', () => {
    expect(getDomainLabel('discord.com')).toBe('Discord');
    expect(getDomainLabel('github.com')).toBe('GitHub');
    expect(getDomainLabel('reddit.com')).toBe('Reddit');
  });

  it('should derive label from unknown domains', () => {
    expect(getDomainLabel('example.com')).toBe('Example');
  });
});

describe('canRemoveCookiesFor', () => {
  it('should validate domains for cookie removal', () => {
    expect(canRemoveCookiesFor('example.com')).toBe(true);
    expect(canRemoveCookiesFor('sub.example.com')).toBe(true);
  });

  it('should reject invalid domains', () => {
    expect(canRemoveCookiesFor('')).toBe(false);
    expect(canRemoveCookiesFor('invalid')).toBe(false);
  });
});

describe('isDomainManaged', () => {
  it('should detect managed domains', () => {
    const managed = new Set(['example.com', 'test.com']);
    expect(isDomainManaged('example.com', managed)).toBe(true);
    expect(isDomainManaged('sub.example.com', managed)).toBe(true);
  });

  it('should reject unmanaged domains', () => {
    const managed = new Set(['example.com']);
    expect(isDomainManaged('other.com', managed)).toBe(false);
  });
});

describe('validateTimerDuration', () => {
  it('should validate timer durations', () => {
    expect(validateTimerDuration(30)).toBe(true);
    expect(validateTimerDuration(60)).toBe(true);
    expect(validateTimerDuration(10080)).toBe(true);
  });

  it('should reject invalid durations', () => {
    expect(validateTimerDuration(0)).toBe(false);
    expect(validateTimerDuration(-5)).toBe(false);
    expect(validateTimerDuration(10081)).toBe(false);
    expect(validateTimerDuration(NaN)).toBe(false);
  });
});

describe('isSafeString', () => {
  it('should validate safe strings', () => {
    expect(isSafeString('hello')).toBe(true);
    expect(isSafeString('')).toBe(true);
  });

  it('should reject unsafe values', () => {
    expect(isSafeString(42)).toBe(false);
    expect(isSafeString(null)).toBe(false);
    expect(isSafeString({})).toBe(false);
  });
});

describe('isIdentityDomain', () => {
  it('should detect identity domains', () => {
    expect(isIdentityDomain('accounts.google.com')).toBe(true);
    expect(isIdentityDomain('login.microsoftonline.com')).toBe(true);
  });

  it('should reject non-identity domains', () => {
    expect(isIdentityDomain('discord.com')).toBe(false);
    expect(isIdentityDomain('github.com')).toBe(false);
  });
});
