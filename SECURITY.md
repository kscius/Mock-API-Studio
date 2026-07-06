# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report vulnerabilities privately by emailing the maintainers or using [GitHub Security Advisories](https://github.com/kscius/Mock-API-Studio/security/advisories/new).

Include:
- Description of the vulnerability
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

We aim to acknowledge reports within **48 hours** and provide a fix timeline within **7 days** for critical issues.

## Security Best Practices for Self-Hosting

- Change `JWT_SECRET` before production deployment
- Use strong database credentials
- Enable HTTPS via reverse proxy or ingress
- Restrict `CORS_ORIGIN` to your frontend domain
- Rotate API keys regularly
- Keep dependencies updated (`npm audit`, Dependabot PRs)
