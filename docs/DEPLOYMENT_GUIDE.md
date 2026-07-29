# Deployment Guide

Never deploy directly from a developer `.env`.

1. Create PostgreSQL, cache, secret manager, backup bucket, observability and network resources.
2. Store all required environment variables in the platform secret manager.
3. Build the immutable Docker image and scan it.
4. Run the migration image as a one-off job. Verify `npm run init` twice.
5. Deploy canary or inactive blue/green slot.
6. Verify health, metrics, login, one private 401 check and a tenant-scoped read.
7. Shift limited traffic, observe, then promote.
8. Keep the prior image and database forward-mitigation plan.

Kubernetes manifests are under `infrastructure/kubernetes`; AWS resources are under `infrastructure/terraform`. Replace example domains/images and create `revora-secrets` out-of-band. Terraform state must use an encrypted, locked remote backend.

Required production configuration includes database, authentication/encryption, worker, metrics, Stripe/OAuth/email as enabled, cache and OTLP endpoints. CDN may cache immutable `/_next/static` assets only; authenticated API responses remain private.

Signed ingestion additionally requires `RESEND_WEBHOOK_SECRET`,
`META_WEBHOOK_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`,
`GOOGLE_ADS_WEBHOOK_SECRET` and `ANALYTICS_INGEST_SECRET` for the integrations
that are enabled. Set `TRUST_PROXY=true` only behind a controlled reverse proxy
that overwrites forwarded-client headers.

Before promotion, verify:

- `npm audit --omit=dev` reports zero production vulnerabilities.
- An anonymous legacy API request returns `401`.
- A second organization receives `403` for the quarantined legacy dataset.
- Invalid and stale webhook signatures return `401`.
- `/api/observability/health` returns `503` if authentication configuration is missing.
- The maintenance CronJob enqueues a due schedule exactly once.
