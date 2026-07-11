# ZeroLock Threat Model

## Overview

This document outlines the threat model for ZeroLock, identifying potential
threats and describing how they are mitigated.

## Trust Model

### Trusted Components

- The ZeroLock extension code (signed, audited)
- Chrome browser security model
- chrome.storage.local (sandboxed)
- User's local device

### Untrusted Components

- Websites the user visits (potential malicious actors)
- External network (not used by ZeroLock)
- Other browser extensions
- Shared/compromised devices

## Assets

| Asset | Description | Sensitivity |
|-------|-------------|-------------|
| Session cookies | HTTP cookies for authentication | High |
| User preferences | Domain lists, timer settings | Low |
| Timer state | Which sessions are being tracked | Low |
| Extension code | The JavaScript/TypeScript code | Medium |

## Threats

### T1: Session Cookie Exfiltration

**Threat**: An attacker gains access to session cookies through ZeroLock.

**Mitigations**:
- ZeroLock never reads cookie values
- Cookie removal API only requires URL, not value
- No network access for data transmission
- Strict CSP prevents data exfiltration
- No eval(), no Function(), no dynamic code execution

**Status**: :white_check_mark: Mitigated

### T2: Remote Code Execution

**Threat**: Malicious input executes arbitrary code in extension context.

**Mitigations**:
- No eval() or Function() usage
- All user input sanitized before processing
- DOMPurify for HTML sanitization (defense in depth)
- Strict CSP blocks inline scripts
- TypeScript strict mode prevents type confusion

**Status**: :white_check_mark: Mitigated

### T3: Storage Injection

**Threat**: Malformed data injected into chrome.storage.local.

**Mitigations**:
- All input validated before storage
- Schema versioning with migrations
- Type-safe storage operations
- Data integrity validation on read
- Prototype pollution prevention

**Status**: :white_check_mark: Mitigated

### T4: Permission Abuse

**Threat**: Extension uses granted permissions for unintended purposes.

**Mitigations**:
- Least privilege principle
- Only essential permissions requested
- Cookie access only for removal
- Tab access only with user opt-in
- No host permission for all URLs (currently `<all_urls>` for content script)

**Status**: :white_check_mark: Mitigated

### T5: Data Persistence

**Threat**: User data persists after extension uninstall.

**Mitigations**:
- Chrome auto-clears extension storage on uninstall
- All data in chrome.storage.local

**Status**: :white_check_mark: Mitigated (by Chrome)

### T6: Cross-Extension Communication

**Threat**: Another extension accesses ZeroLock data.

**Mitigations**:
- chrome.storage.local is sandboxed per extension
- No external messaging
- runtime.sendMessage only within extension

**Status**: :white_check_mark: Mitigated (by Chrome)

### T7: CSP Bypass

**Threat**: Attacker bypasses Content Security Policy.

**Mitigations**:
- Very restrictive CSP
- No connect-src (no network requests)
- No frame-src (no iframes)
- No object-src (no plugins)
- No eval or inline scripts
- CSP defined in manifest.json (enforced by Chrome)

**Status**: :white_check_mark: Mitigated

### T8: DOM-based XSS

**Threat**: Malicious data injected into DOM via popup/options.

**Mitigations**:
- React's built-in XSS protection
- No innerHTML or dangerouslySetInnerHTML
- DOMPurify available for sanitization
- All user text rendered via textContent/React text

**Status**: :white_check_mark: Mitigated

### T9: Malicious Logout Endpoint

**Threat**: Official logout URL redirected to malicious site.

**Mitigations**:
- Logout URLs are hard-coded for known sites only
- No user-configurable logout URLs
- Tab created in background (not focused)
- Network requests are not intercepted

**Status**: :warning: Low Risk

### T10: Prototype Pollution

**Threat**: Attacker pollutes Object.prototype through JSON parsing.

**Mitigations**:
- ensurePlainObject() validates object prototypes
- TypeScript strict mode
- No unsafe recursive merges
- All storage data validated before use

**Status**: :white_check_mark: Mitigated

## Dependency Threats

| Dependency | Risk | Mitigation |
|------------|------|------------|
| React 19 | Low | Stable, widely audited |
| DOMPurify | Low | Security-focused library |
| Vite | Low | Build-time only |
| ESLint | Low | Development only |
| Vitest/Playwright | Low | Testing only |

## CI/CD Security

- Dependency audit in CI (npm audit)
- Secret scanning (Gitleaks)
- Static analysis (CodeQL)
- Semgrep rule scanning
- License compliance checking
- Build fails on vulnerabilities

## Compliance

- :white_check_mark: GDPR compliant (no personal data collected)
- :white_check_mark: Privacy by Design
- :white_check_mark: Data minimization
- :white_check_mark: Purpose limitation
- :white_check_mark: Offline-first architecture

## Security Contacts

- Security issues: security@zerolock.app (placeholder)
- GitHub Security Advisories: https://github.com/tsukiforge/ZeroLock/security/advisories

## Review Cycle

This threat model should be reviewed:
- On every major version release
- When new permissions are added
- When architecture changes significantly
- At least annually
