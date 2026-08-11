# EcoScale Partner

EcoScale Partner is a Next.js and PostgreSQL Commerce Intelligence platform. It connects:

```text
Lead Finder → Business Intelligence → Funnel Analysis → Opportunities
→ AI Consultant → Proposals → Outreach → CRM
```

The Enterprise layer adds organizations, RBAC, sessions, MFA, API keys,
billing, workflows, executive analytics, forecasting and observability.

## Requirements

- Node.js 20.9–24
- PostgreSQL 16+
- Redis for production dashboard caching

Copy `.env.example` to `.env.local` and replace every required placeholder.
Never commit `.env.local`.

At minimum, local authenticated operation requires:

- `DATABASE_URL`
- `APP_URL`
- `AUTH_JWT_SECRET`
- `AUTH_ENCRYPTION_KEY`

Generate independent secrets with a cryptographically secure password manager.

## Commands

```bash
npm ci
npm run init
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:phase2
npm run test:phase3
npm run test:phase4
npm run test:phase5
npm run test:phase6
npm run test:phase7
npm run test:phase8
```

`npm run init` applies additive PostgreSQL migrations. Back up production before
running migrations and run them once as a deployment job.

## Security boundaries

- Private `/api/**` routes require a valid EcoScale Partner session or scoped API key.
- Public routes are limited to authentication, signed webhooks, health,
  published proposals, unsubscribe and public funnel lead capture.
- The operational dataset predating organizations is quarantined to the first
  authenticated organization that claims it. Other tenants cannot access it.
- Provider webhooks fail closed when their signing secret is absent.
- Production readiness requires health to report both database and
  authentication as configured.

The pre-tenant quarantine is a compatibility boundary, not a substitute for
adding `organization_id` to every future aggregate. New tables must be
tenant-owned from their first migration.

## Production

Production artifacts are provided for Docker Compose, Kubernetes and AWS
Terraform under `infrastructure/`. Deployment remains an operator-controlled
process:

1. Provision secrets and data services.
2. Build an immutable image.
3. Run the migration job.
4. Verify readiness privately.
5. Promote with the reviewed canary or blue/green strategy.
6. Run smoke, tenant-isolation and restore checks.

See:

- `docs/ARCHITECTURE_GUIDE.md`
- `docs/SECURITY_GUIDE.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/OPERATIONS_GUIDE.md`
- `docs/INCIDENT_RESPONSE.md`
- `docs/DISASTER_RECOVERY.md`

## Current limitations

- Outreach can use Resend only after the domain and sender identity are
  provider-verified, a physical business address is supplied, and the campaign
  is explicitly reviewed, approved and scheduled. Without those controls it
  remains dry-run or fails closed.
- Resend delivery events require a public HTTPS webhook at
  `/api/webhooks/resend` and `RESEND_WEBHOOK_SECRET`.
- The Outreach worker must be invoked by an authenticated scheduler using a
  dedicated `OUTREACH_WORKER_SECRET`, or `CRON_SECRET` as a local fallback;
  campaign creation never sends automatically.
- External AI, email, billing and enrichment providers require approved
  credentials.
- Characterization suites do not replace integration, browser E2E, load,
  penetration or restore testing.
- Credentials previously committed to Git must be rotated and removed from
  repository history; deleting the current text alone is insufficient.
