# Changelog

All notable changes to ZeroLock will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-07-11

### Added

- 🔔 **Blacklist Prompt**: Saat membuka website baru, muncul notifikasi "Apakah Anda ingin menambahkan ke blacklist?"
- 🧹 **Auto-Cleanup**: Blacklist otomatis menghapus website yang tidak dikunjungi selama 30 hari
- 🌐 **Subdomain Support**: Logout membersihkan cookies dari SEMUA level domain (a.b.c.example.com → example.com)
- 🔄 **Tab Reload**: Setelah logout, tab website otomatis di-reload untuk menampilkan state logout
- 🔗 **Domain Alias**: Logout dari `chat.openai.com` juga membersihkan cookies `chatgpt.com`

### Fixed

- 🍪 **Cookie Removal**: `chrome.cookies.remove()` return value sekarang dicek — hanya menghitung yang benar-benar berhasil
- 🖱️ **Context Menu**: Menu "Logout from this site" dibuat di top-level service worker agar tidak hilang saat service worker restart
- 🔄 **Popup ↔ Options Sync**: Perubahan di options langsung ter-reflect di popup via `chrome.storage.onChanged`
- ⚠️ **Error Logging**: Semua `catch {}` silent diganti dengan `console.error()` untuk debugging

### Changed

- CookieService: Query ALL cookies + filter client-side (lebih reliable untuk public suffix seperti `vercel.app`)
- SessionService: Logout membersihkan cookies di SEMUA level domain, bukan cuma base domain
- TypeScript: zero errors, Build: sukses

[1.1.0]: https://github.com/tsukiforge/ZeroLock/releases/tag/v1.1.0

## [1.0.0] - 2026-01-15

### Added

- 🎉 Initial release of ZeroLock
- 📊 **Dashboard**: View and manage all tracked websites
- ⏱️ **Timer Management**: Auto-logout based on configurable timers
  - Preset durations: 30m, 1h, 2h, 3h, 6h, 12h, 24h
  - Custom duration support
- 🔔 **Notifications**: Alerts when sessions expire
  - Logout, Snooze (15min), and Dismiss actions
- ✅ **Whitelist**: Websites that should never be auto-logged out
- ⛔ **Blacklist**: Websites that should always be auto-logged out
- 🔴 **Panic Button**: Emergency logout of all managed websites
- 💤 **Idle Detection**: Auto-logout when user is away
  - 15min, 30min, 60min timeout options
- 🚪 **Browser Close Handler**: Logout when Chrome closes (optional)
- 🔒 **Lock Screen Handler**: Logout when PC is locked (optional)
- 🛡️ **Security Center**: Transparent security status indicators
- 🌓 **Theme Support**: Light, Dark, and System themes
- ♿ **Accessibility**: Keyboard navigation, ARIA labels, screen reader support
- 📱 **Responsive Design**: Works on various window sizes

### Security

- Zero Trust architecture
- Privacy by Design
- 100% offline processing
- No password storage or access
- No cookie or token exfiltration
- No analytics, telemetry, or tracking
- Strict Content Security Policy
- All input sanitized
- No `eval()` or `Function()` usage
- All data in `chrome.storage.local` only

### Technical

- Manifest V3
- TypeScript strict mode
- React 19 with hooks
- Vite build system
- Material Design UI
- 95%+ test coverage
- GitHub Actions CI/CD
- CodeQL and Semgrep scanning
- Dependency vulnerability auditing
- Secret scanning

[1.1.0]: https://github.com/tsukiforge/ZeroLock/releases/tag/v1.1.0
[1.0.0]: https://github.com/tsukiforge/ZeroLock/releases/tag/v1.0.0
