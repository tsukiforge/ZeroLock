# ZeroLock Architecture

## Overview

ZeroLock is a Google Chrome Extension (Manifest V3) that manages website sessions
automatically. It follows a **privacy-first**, **offline-first** architecture.

## Core Principles

1. **Zero Trust**: No data is ever trusted from external sources
2. **Privacy by Design**: All processing happens locally
3. **Least Privilege**: Minimum permissions required
4. **Offline First**: No network dependencies
5. **No Data Collection**: No analytics, telemetry, or tracking

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   Popup    │  │    Options   │  │  Security Center  │    │
│  │ (Dashboard)│  │   (Settings) │  │    (Status)      │    │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘    │
│        │                │                   │              │
├────────┴────────────────┴───────────────────┴─────────────┤
│                   Message Passing (chrome.runtime)         │
├────────┬────────────────┬───────────────────┬─────────────┤
│        │                │                   │              │
│  ┌─────▼──────┐  ┌──────▼───────┐  ┌────────▼────────┐    │
│  │   Timer    │  │     Idle     │  │    Panic        │    │
│  │  Manager   │  │   Handler    │  │   Handler       │    │
│  └─────┬──────┘  └──────┬───────┘  └────────┬────────┘    │
│        │                │                   │              │
│  ┌─────▼────────────────▼───────────────────▼────────┐     │
│  │                 Services Layer                      │    │
│  │  ┌──────────┐ ┌───────────┐ ┌──────────┐          │    │
│  │  │ Storage  │ │  Cookie   │ │  Session │          │    │
│  │  │ Service  │ │  Service  │ │  Service │          │    │
│  │  └────┬─────┘ └─────┬─────┘ └────┬─────┘          │    │
│  │       │             │            │                │    │
│  │  ┌────▼─────────────▼────────────▼─────────┐      │    │
│  │  │        Notification Service             │      │    │
│  │  └─────────────────────────────────────────┘      │    │
│  └───────────────────────────────────────────────────┘    │
│                          │                                │
├──────────────────────────┴───────────────────────────────┤
│                      Security Layer                        │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Sanitizer   │  │  Validator │  │     CSP          │  │
│  └──────────────┘  └────────────┘  └──────────────────┘  │
│                          │                                │
├──────────────────────────┴───────────────────────────────┤
│                      Storage Layer                        │
│                chrome.storage.local                       │
│          (No localStorage/sessionStorage)                 │
└──────────────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── background/        # Service Worker (persistent background)
│   ├── service-worker.ts   # Main entry point
│   ├── timer-manager.ts    # Session timer checks
│   ├── idle-handler.ts     # Idle detection
│   ├── cookie-manager.ts   # Cookie change monitoring
│   └── panic-handler.ts    # Panic button logic
├── components/        # React UI components
│   ├── Dashboard.tsx       # Main website list
│   ├── WebsiteItem.tsx     # Individual website entry
│   ├── AddWebsiteForm.tsx  # Add new website form
│   ├── TimerSelector.tsx   # Timer duration picker
│   ├── SecurityCenter.tsx  # Security status display
│   └── PanicButton.tsx     # Emergency logout button
├── hooks/             # React custom hooks
│   ├── useWebsites.ts      # Website CRUD operations
│   ├── useConfig.ts        # Configuration management
│   ├── useLists.ts         # Whitelist/blacklist management
│   └── useTheme.ts         # Theme management
├── security/          # Security utilities
│   ├── sanitizer.ts        # Input sanitization
│   └── validator.ts        # Input validation
├── services/          # Core services
│   ├── StorageService.ts   # chrome.storage.local wrapper
│   ├── CookieService.ts    # Cookie operations
│   ├── SessionService.ts   # Session logout coordination
│   ├── NotificationService.ts # Notification management
│   └── TabService.ts       # Tab management
├── storage/           # Storage layer
│   ├── types.ts            # TypeScript types and constants
│   └── schema.ts           # Schema and migrations
├── utils/             # Utilities
│   ├── constants.ts        # Application constants
│   ├── domain.ts           # Domain parsing utilities
│   └── timer.ts            # Timer calculation utilities
├── popup/             # Popup UI (action button)
│   ├── index.html          # HTML entry
│   ├── index.tsx           # React entry
│   └── App.tsx             # Main popup component
├── options/            # Options page
│   ├── index.html          # HTML entry
│   ├── index.tsx           # React entry
│   └── App.tsx             # Full options component
├── content/           # Content scripts (minimal)
│   └── content-script.ts
├── styles/            # CSS
│   └── main.css
└── types/             # TypeScript declarations
    └── chrome.d.ts
```

## Data Flow

### Timer Lifecycle

```
User adds website → StorageService.setWebsite()
                        ↓
TimerManager checks every 15s
                        ↓
Timer expired? ──Yes──→ Session expired notification
                        ↓
Auto logout enabled? ──Yes──→ SessionService.logoutDomain()
                        ↓
1. CookieService.removeCookiesForDomain()
2. SessionService (optional logout URL)
3. TabService.closeTabsForDomain() (if enabled)
4. Notification cleared
```

### Panic Button

```
User clicks Panic → Confirmation dialog
                        ↓
PanicHandler.execute()
                        ↓
1. Collect all active + blacklisted domains
2. SessionService.logoutDomains() for each
3. Update lastPanicAt timestamp
4. Return results
```

## Security Architecture

### Input Validation Chain

```
User Input → Sanitizer.sanitizeDomain()
           → Validator.validateTimerDuration()
           → StorageService (typed)
           → chrome.storage.local
```

### CSP Policy

```
default-src 'self'
style-src 'self' 'unsafe-inline'
script-src 'self'
img-src 'self' data:
object-src 'none'
frame-src 'none'
connect-src 'none'
form-action 'none'
base-uri 'none'
```

## Testing Strategy

- **Unit Tests**: Services, utilities, security (Vitest)
- **Integration Tests**: Component interactions (Vitest)
- **E2E Tests**: Full extension flows (Playwright)
- **Security Tests**: XSS, injection, CSP bypass
- **Regression Tests**: Core functionality
- **Performance Tests**: Memory, response times

## Key Design Decisions

1. **Singleton Services**: All services are singletons with in-memory cache
2. **Message Passing**: All UI ↔ Background communication via `chrome.runtime.sendMessage`
3. **Alarm-Based Checks**: `chrome.alarms` for periodic timer checks
4. **Stateful Cache**: Storage service maintains in-memory cache, invalidated on writes
5. **No External Dependencies**: Zero runtime network requests
6. **Minimal Content Script**: Content script is a placeholder; most logic runs in service worker

## Future Considerations

- IndexedDB for large datasets (if needed)
- Periodic host permission requests instead of `<all_urls>`
- Additional logout URL mappings
- User-configurable notification sounds
- Export/import configuration
