/**
 * ZeroLock Timer Utilities
 */

import { TIMER } from './constants';

/**
 * Calculate expiry timestamp from duration.
 */
export function calculateExpiry(durationMinutes: number, startTime: number = Date.now()): number {
  return startTime + durationMinutes * 60 * 1000;
}

/**
 * Get remaining time in milliseconds.
 */
export function getRemainingMs(expiryTimestamp: number, now: number = Date.now()): number {
  return Math.max(0, expiryTimestamp - now);
}

/**
 * Get remaining time in minutes.
 */
export function getRemainingMinutes(expiryTimestamp: number, now: number = Date.now()): number {
  return Math.ceil(getRemainingMs(expiryTimestamp, now) / 60000);
}

/**
 * Format remaining time for display.
 * Returns "Xh Ym" or "< 1m" for less than a minute.
 */
export function formatRemainingTime(expiryTimestamp: number, now: number = Date.now()): string {
  const remainingMs = getRemainingMs(expiryTimestamp, now);

  if (remainingMs <= 0) return 'Expired';
  if (remainingMs < 60000) return '< 1m';

  const totalMinutes = Math.floor(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Check if a timer has expired.
 */
export function isExpired(expiryTimestamp: number, now: number = Date.now()): boolean {
  return now >= expiryTimestamp;
}

/**
 * Validate timer minutes input.
 */
export function validateTimerMinutes(value: number | string): number | null {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isFinite(num) || num < TIMER.MIN_MINUTES || num > TIMER.MAX_MINUTES) {
    return null;
  }

  return Math.floor(num);
}

/**
 * Get snooze expiry timestamp.
 */
export function getSnoozeExpiry(snoozeMinutes: number = TIMER.SNOOZE_MINUTES): number {
  return Date.now() + snoozeMinutes * 60 * 1000;
}

/**
 * Human readable duration.
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes < 1440) {
    const hours = minutes / 60;
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  const days = minutes / 1440;
  return days === 1 ? '1 day' : `${days} days`;
}
