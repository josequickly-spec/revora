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

## Hostinger Web App

Hostinger Business Web Hosting can run this project as a managed Next.js Web
App. Use a dedicated hostname such as `app.ecoscalepartner.com` so deployment
does not replace an existing marketing site.

1. Push a reviewed branch to GitHub. Never commit `.env.local` or
   `.env.production`.
2. In hPanel, choose **Websites → Add website → Web App → GitHub** and select
   the repository and reviewed branch.
3. Select Node.js 22 and Next.js. Use `npm ci` for installation,
   `npm run build` for the build, and `npm run start` for the start command.
4. Configure the variables from `.env.production.example` in hPanel. Set
   `APP_URL` to the final public HTTPS origin and `TRUST_PROXY=true`.
5. Use externally managed PostgreSQL and Redis/Upstash. Do not use a local
   container hostname in `DATABASE_URL` or `REDIS_URL`. Production health and
   API rate limiting fail closed when Redis is not configured.
6. Run `npm run init` once against the production database before promotion.
   Re-running it is safe because migrations are additive, but take a backup
   first.
7. Point the selected hostname to the Web App, enable managed SSL, and confirm
   that `/api/observability/health` reports `ready`.
8. Configure Resend to send signed events to
   `https://app.ecoscalepartner.com/api/webhooks/resend`, then configure the
   scheduler to invoke the Outreach and workflow worker endpoints with their
   dedicated secrets.

Do not promote the deployment while health is `degraded`, authentication cannot
complete, unsubscribe links contain `localhost`, or provider webhooks and
workers have not been exercised with controlled test data.

Before promotion, verify:

- `npm audit --omit=dev` reports zero production vulnerabilities.
- An anonymous legacy API request returns `401`.
- A second organization receives `403` for the quarantined legacy dataset.
- Invalid and stale webhook signatures return `401`.
- `/api/observability/health` returns `503` if authentication configuration is missing.
- The maintenance CronJob enqueues a due schedule exactly once.
