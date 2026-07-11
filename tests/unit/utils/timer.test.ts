/**
 * Tests for Timer Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  calculateExpiry,
  getRemainingMs,
  getRemainingMinutes,
  formatRemainingTime,
  isExpired,
  formatDuration,
} from '../../../src/utils/timer';

describe('calculateExpiry', () => {
  it('should calculate correct expiry timestamp', () => {
    const start = 1000;
    const expiry = calculateExpiry(60, start);
    expect(expiry).toBe(start + 60 * 60 * 1000);
  });
});

describe('getRemainingMs', () => {
  it('should return positive remaining time', () => {
    const expiry = Date.now() + 60000;
    const remaining = getRemainingMs(expiry, Date.now());
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(60000);
  });

  it('should return 0 for expired timers', () => {
    const expiry = Date.now() - 60000;
    expect(getRemainingMs(expiry, Date.now())).toBe(0);
  });
});

describe('getRemainingMinutes', () => {
  it('should return remaining minutes', () => {
    const expiry = Date.now() + 120000; // 2 minutes
    const minutes = getRemainingMinutes(expiry, Date.now());
    expect(minutes).toBe(2);
  });
});

describe('formatRemainingTime', () => {
  it('should format remaining time', () => {
    expect(formatRemainingTime(Date.now() + 3600000, Date.now())).toBe('1h');
    expect(formatRemainingTime(Date.now() + 6300000, Date.now())).toBe('1h 45m');
  });

  it('should handle expired timers', () => {
    expect(formatRemainingTime(Date.now() - 3600000, Date.now())).toBe('Expired');
  });
});

describe('isExpired', () => {
  it('should detect expired timers', () => {
    expect(isExpired(Date.now() - 1000, Date.now())).toBe(true);
    expect(isExpired(Date.now() + 100000, Date.now())).toBe(false);
  });
});

describe('formatDuration', () => {
  it('should format minutes into human readable', () => {
    expect(formatDuration(30)).toBe('30 minutes');
    expect(formatDuration(60)).toBe('1 hour');
    expect(formatDuration(120)).toBe('2 hours');
    expect(formatDuration(1440)).toBe('1 day');
  });
});
