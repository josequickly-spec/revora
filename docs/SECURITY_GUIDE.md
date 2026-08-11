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

## Mandatory incident action

A historical deployment guide previously contained database and authentication
credentials. Treat every exposed value as compromised:

1. Rotate it at the provider before any deployment.
2. Review provider/database access logs.
3. Purge the values from every Git ref with a coordinated history rewrite.
4. Invalidate old clones and CI caches.
5. Enable repository secret scanning and push protection.

Deleting a value in a new commit does not remove it from Git history.

## Legacy data boundary

Pre-tenant operational tables are quarantined by
`platform_legacy_dataset_owner`. The first authenticated organization claims
that dataset atomically. Other organizations receive `403`; anonymous requests
receive `401`. New aggregates must include `organization_id` and tenant-scoped
unique constraints from their first migration.

Resend uses Svix signatures. Meta uses `x-hub-signature-256`. Custom Google Ads
and analytics ingestion use a timestamped HMAC and reject messages older than
five minutes. Missing signing secrets always fail closed.
