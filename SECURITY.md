# Security Policy

## 🔒 Security at ZeroLock

ZeroLock is built with **Privacy by Design** and **Security by Design** principles.
We take security and privacy seriously.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## What ZeroLock Does NOT Do

- ❌ Never stores or reads passwords
- ❌ Never sends cookies to external servers
- ❌ Never sends authentication tokens
- ❌ Never collects personal data
- ❌ Never tracks browsing activity
- ❌ No analytics, telemetry, or fingerprinting
- ❌ No remote code execution
- ❌ No `eval()` or `Function()`
- ❌ No data exfiltration of any kind

## What ZeroLock Does

- ✅ Automatically manages website session timers
- ✅ Removes cookies locally when timers expire
- ✅ Closes tabs if user opts-in
- ✅ Runs 100% offline on the user's device
- ✅ Stores all configuration in `chrome.storage.local`
- ✅ Uses strict Content Security Policy
- ✅ Sanitizes all user input

## Permissions

| Permission        | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `cookies`         | Remove website sessions when logging out     |
| `notifications`   | Alert when session timers expire             |
| `storage`         | Store configuration locally                  |
| `tabs`            | Close tabs if the option is enabled          |
| `idle`            | Detect when user is away                     |
| `alarms`          | Run periodic timer checks                    |
| `contextMenus`    | Right-click option to logout from sites      |
| `host_permissions`| Only used on websites the user selects       |

## Reporting a Vulnerability

You can report vulnerabilities by:

1. **Opening a GitHub Issue** (for non-critical issues)
   - Label: `security`
   - Do not include sensitive details in public issues

2. **Emailing the maintainers** (for critical vulnerabilities)
   - Contact: security@zerolock.app (placeholder)

3. **Creating a Security Advisory** on GitHub
   - Go to: https://github.com/tsukiforge/ZeroLock/security/advisories

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if applicable)

### Response Timeline

- **Initial response**: Within 48 hours
- **Assessment**: Within 5 business days
- **Fix for critical issues**: Within 14 days
- **Public disclosure**: After fix is released

## Security Audits

ZeroLock undergoes regular security audits including:

- Automated dependency vulnerability scanning (npm audit)
- Static analysis (CodeQL, Semgrep)
- Secret scanning (Gitleaks)
- Manual code review
- License compliance checking

## Best Practices for Users

1. Keep ZeroLock updated to the latest version
2. Review the permissions ZeroLock requests
3. Use the Security Center to verify the extension's status
4. Report any suspicious behavior immediately

## Disclosure Policy

We follow responsible disclosure:

1. Reporter discloses vulnerability privately
2. We acknowledge receipt within 48 hours
3. We develop and test a fix
4. We release the fix and credit the reporter (if desired)
5. We publish a security advisory

Thank you for helping keep ZeroLock and its users safe! 🔒
