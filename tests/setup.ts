/**
 * ZeroLock Test Setup
 *
 * Provides mock implementations for Chrome Extension APIs
 * to enable unit testing without a browser environment.
 */

import { vi } from 'vitest';

// Mock chrome.storage.local
const storageLocal: Record<string, unknown> = {};

const mockChromeStorage = {
  local: {
    get: vi.fn(async (keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>> => {
      if (keys === null) {
        return { ...storageLocal };
      }
      if (typeof keys === 'string') {
        return { [keys]: storageLocal[keys] };
      }
      if (Array.isArray(keys)) {
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (key in storageLocal) {
            result[key] = storageLocal[key];
          }
        }
        return result;
      }
      if (typeof keys === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, defaultValue] of Object.entries(keys)) {
          result[key] = key in storageLocal ? storageLocal[key] : defaultValue;
        }
        return result;
      }
      return { ...storageLocal };
    }),
    set: vi.fn(async (items: Record<string, unknown>): Promise<void> => {
      Object.assign(storageLocal, items);
    }),
    remove: vi.fn(async (keys: string | string[]): Promise<void> => {
      const keyList = Array.isArray(keys) ? keys : [keys];
      for (const key of keyList) {
        delete storageLocal[key];
      }
    }),
    clear: vi.fn(async (): Promise<void> => {
      Object.keys(storageLocal).forEach((key) => delete storageLocal[key]);
    }),
    getBytesInUse: vi.fn(async (): Promise<number> => {
      return JSON.stringify(storageLocal).length;
    }),
    QUOTA_BYTES: 5_242_880,
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Mock chrome.cookies
const mockChromeCookies = {
  getAll: vi.fn(async (_details: chrome.cookies.GetAllDetails): Promise<chrome.cookies.Cookie[]> => {
    return [];
  }),
  remove: vi.fn(async (_details: chrome.cookies.RemoveDetails): Promise<chrome.cookies.Cookie | null> => {
    return null;
  }),
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Mock chrome.notifications
const mockChromeNotifications = {
  create: vi.fn(async (
    _notificationId: string,
    _options: chrome.notifications.NotificationOptions,
  ): Promise<string> => {
    return '';
  }),
  clear: vi.fn(async (_notificationId: string): Promise<boolean> => {
    return true;
  }),
  getAll: vi.fn(async (): Promise<Record<string, boolean>> => {
    return {};
  }),
  onButtonClicked: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onClicked: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Mock chrome.tabs
const mockChromeTabs = {
  query: vi.fn(async (_queryInfo: chrome.tabs.QueryInfo): Promise<chrome.tabs.Tab[]> => {
    return [];
  }),
  remove: vi.fn(async (_tabIds: number | number[]): Promise<void> => {
    // noop
  }),
  create: vi.fn(async (_createProperties: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> => {
    return { id: 1, active: true, url: '' } as chrome.tabs.Tab;
  }),
};

// Mock chrome.runtime
const mockChromeRuntime = {
  openOptionsPage: vi.fn(async (): Promise<void> => {
    // noop
  }),
  sendMessage: vi.fn(async (_message: unknown): Promise<unknown> => {
    return { success: true };
  }),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onInstalled: {
    addListener: vi.fn(),
  },
  onStartup: {
    addListener: vi.fn(),
  },
  onSuspend: {
    addListener: vi.fn(),
  },
  id: 'test-extension-id',
};

// Mock chrome.alarms
const mockChromeAlarms = {
  create: vi.fn(async (_name: string, _options?: chrome.alarms.AlarmCreateInfo): Promise<void> => {
    // noop
  }),
  clear: vi.fn(async (_name: string): Promise<boolean> => {
    return true;
  }),
  onAlarm: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Mock chrome.idle
const mockChromeIdle = {
  setDetectionInterval: vi.fn((_intervalInSeconds: number): void => {
    // noop
  }),
  queryState: vi.fn((callback?: (newState: string) => void): void => {
    callback?.('active');
  }),
  onStateChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Mock chrome.contextMenus
const mockChromeContextMenus = {
  create: vi.fn((): void => {
    // noop
  }),
  onClicked: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Assemble mock chrome object
const mockChrome = {
  storage: mockChromeStorage,
  cookies: mockChromeCookies,
  notifications: mockChromeNotifications,
  tabs: mockChromeTabs,
  runtime: mockChromeRuntime,
  alarms: mockChromeAlarms,
  idle: mockChromeIdle,
  contextMenus: mockChromeContextMenus,
};

// Set global chrome mock
Object.assign(globalThis, { chrome: mockChrome });

// Export chrome mock for type use in tests
export { mockChrome };
