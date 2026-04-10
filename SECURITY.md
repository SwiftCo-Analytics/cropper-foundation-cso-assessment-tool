# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

Only the latest release on the `main` branch receives security updates.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Please send an email to **hub@csogo.org** with:

1. A description of the vulnerability
2. Steps to reproduce
3. The potential impact
4. Any suggested remediation (optional)

### What to Expect

- **Acknowledgement**: within 48 hours of your report
- **Initial assessment**: within 5 business days
- **Resolution target**: critical issues within 14 days, others within 30 days
- **Disclosure**: coordinated disclosure after a fix is released

We follow responsible disclosure and will credit reporters (with permission) in release notes.

## Security Practices

This project implements the following security measures:

### Authentication & Authorization

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **NextAuth.js v4** with JWT session strategy for admin authentication
- Custom JWT-based session management for organization users (7-day expiry)
- Middleware-enforced route protection for admin panel
- Email verification required for organization accounts

### Data Protection

- **Prisma ORM** parameterized queries (prevents SQL injection)
- **Zod** schema validation on all user inputs
- **TypeScript strict mode** for compile-time type safety

### CI/CD Security

- Automated dependency vulnerability scanning via GitHub Actions
- `npm audit` checks on every push and pull request
- CodeQL static analysis (SAST) on every pull request
- Dependabot configured for automated dependency update PRs
- GitHub Actions pinned by commit SHA to prevent supply-chain attacks
- Secret scanning via gitleaks on every push

## Known Limitations

- No rate limiting on authentication endpoints (planned)
- Content Security Policy applied to images only, not application-wide (planned)
- CORS not explicitly configured beyond Next.js defaults (planned)
