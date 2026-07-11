/**
 * Tests for Storage Schema
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getDefaultStorage } from '../../../src/storage/schema';
import { DEFAULT_CONFIG } from '../../../src/storage/types';

describe('getDefaultStorage', () => {
  it('should return default storage state', () => {
    const storage = getDefaultStorage();
    expect(storage.websites).toEqual({});
    expect(storage.whitelist).toEqual([]);
    expect(storage.blacklist).toEqual([]);
    expect(storage.config).toEqual(DEFAULT_CONFIG);
    expect(storage.installedAt).toBeGreaterThan(0);
    expect(storage.lastPanicAt).toBeNull();
  });
});
