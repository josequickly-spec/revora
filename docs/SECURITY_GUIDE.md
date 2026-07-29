# Security Guide

Controls:

- Scrypt passwords, rotating refresh tokens, short-lived JWTs and encrypted TOTP secrets.
- Tenant-scoped RBAC and API-key permissions.
- CSP, HSTS in production, frame denial, MIME protection and restrictive browser policies.
- Same-origin CSRF enforcement for cookie-authenticated mutations.
- Request-size and rate-limit protection; upstream WAF is still required.
- Signed Stripe/outreach webhooks and idempotent receipts.
- Structured-log redaction and minimal analytical evidence.
- Encrypted RDS, Redis transit encryption, KMS-backed backups and non-root containers.

Production secrets belong in a cloud secret manager and are injected at runtime. Rotate JWT/encryption/provider/worker/metrics credentials on a documented cadence. Encryption-key rotation requires a dual-read re-encryption procedure for MFA records.

Pen-test checklist: authorization/tenant isolation, IDOR, session rotation, CSRF, OAuth state, webhook replay, SSRF in crawling, stored/reflected XSS, SQL injection, rate-limit bypass, cache isolation, file/export injection, dependency/image scanning and infrastructure public exposure.
