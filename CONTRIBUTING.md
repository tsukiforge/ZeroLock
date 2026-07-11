# Contributing to ZeroLock

Thank you for your interest in contributing to ZeroLock!
We welcome contributions from the community.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- Google Chrome (for testing)

### Development Setup

```bash
# Clone the repository
git clone https://github.com/tsukiforge/ZeroLock.git
cd zerolock

# Install dependencies
npm install

# Start development
npm run dev

# Build the extension
npm run build
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** for your feature/fix
3. **Make changes** following our coding standards
4. **Write tests** for your changes (coverage >= 95%)
5. **Run tests** to ensure nothing is broken
6. **Submit a pull request**

## Coding Standards

### General

- **SOLID** principles
- **KISS** (Keep It Simple, Stupid)
- **DRY** (Don't Repeat Yourself)
- Clean Architecture
- Modular code
- Minimal comments (code should be self-documenting)

### TypeScript

You may use TypeScript with the intention of:

- Strict mode enabled
- No `any` types (use `unknown` if necessary)
- Explicit return types on functions
- Use `const` over `let`
- Use `as const` for constants
- No `eval()`, `Function()`, or dynamic code execution
- No `innerHTML` with user data

### React

- Functional components with hooks
- Use `React.memo` for performance
- Proper accessibility (ARIA attributes)
- Keyboard navigation support

### Security

- Sanitize ALL user input
- Never use `dangerouslySetInnerHTML`
- No data exfiltration
- No external network requests
- Use strict CSP
- Validate all storage data

### Testing

- Minimum 95% code coverage
- Unit tests for utilities and services
- Integration tests for components
- E2E tests for critical flows
- Test edge cases and error states

## Pull Request Process

1. **Title**: Clear and descriptive
2. **Description**: What and why
3. **Tests**: Include tests for new code
4. **Documentation**: Update if needed
5. **Changelog**: Add entry in CHANGELOG.md

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No new `any` types introduced
- [ ] No security concerns
- [ ] Changelog updated
- [ ] All CI checks pass

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
security: improve security
docs: update documentation
test: add tests
chore: maintenance tasks
```

## Security

**NEVER commit:**

- Passwords or secrets
- API keys
- Personal data
- Debug code with sensitive output

If you discover a security vulnerability, please follow our [Security Policy](SECURITY.md).

## Questions?

- Open a GitHub Issue
- Join our Discussion Forum
- Email: contribute@zerolock.app (placeholder)

Thank you for contributing! 🎉
