# Phase 7 — Enterprise Operations Platform

## Outcome

Phase 7 adds an enterprise operations bounded context without changing the ownership or scoring behavior of prior modules. It introduces organization-scoped identity, RBAC, CRM projections, billing records, durable workflows, notifications and a versioned REST API.

Starting point: `3a8a04724902af26eddfda71933010274745c733`.

Phase 8 was not started.

## Architecture

```text
Business Intelligence ─┐
FunnelSpy ──────────────┤
Opportunity Engine ─────┤ domain events/read references
AI Consultant ──────────┤
Proposal Builder ───────┤
Outreach ───────────────┘
             ↓
CRM projection + explicit user commands
             ↓
CRM events + transactional outbox
             ↓
Workflow / notification consumers
```

Ownership invariants:

- Business Intelligence remains the only owner of `businesses` and `contacts`.
- FunnelSpy audit tables and scoring are untouched.
- Opportunity Engine deterministic findings are not CRM opportunities.
- AI Consultant remains advisory.
- Proposal Builder remains the proposal owner.
- Outreach remains the campaign and delivery owner.
- CRM links accounts to existing businesses and reads canonical contacts.
- CRM stage changes require the dedicated stage endpoint, permission `crm.stage.change`, an expected aggregate version and a human-supplied reason.
- No event consumer changes a CRM stage.

## Database

Canonical additive migration: `scripts/migrate-phase7-enterprise.sql`.

Forty additive tables:

- Identity and tenancy: users, organizations, workspaces, teams, roles, permissions, role permissions, memberships, team memberships, OAuth identities, MFA factors, device sessions, reset tokens, API keys and audit logs.
- CRM: account projections, pipelines, stages, opportunities, stage history, activities, notes, tasks, calendar events, suggested actions, event stream and forecast snapshots.
- Billing: plans, subscriptions, usage, credits, invoices, coupons, tax registrations and Stripe webhook receipts.
- Platform: durable jobs, schedules, notifications, transactional outbox and consumer inbox.

All cross-record ownership references use `ON DELETE RESTRICT`. Organization-scoped uniqueness protects tenant records. Existing tables are not dropped, renamed or rewritten.

Default organization bootstrap creates:

- one primary workspace;
- owner/admin/manager/sales/marketing/viewer roles;
- role-permission mappings;
- one default CRM pipeline with Qualified, Discovery, Proposal, Negotiation, Won and Lost stages;
- a Starter subscription record.

## Authentication and security

- Passwords use Node `scrypt` with a random 128-bit salt.
- Access tokens are signed HS256 JWTs with a 15-minute lifetime.
- Refresh tokens contain 384 random bits, are stored only as one-way hashes, expire after 30 days and rotate on every refresh.
- Device sessions can be listed and revoked.
- MFA uses standards-compatible TOTP; factors are encrypted with AES-256-GCM.
- Google and Microsoft OAuth use authorization-code exchange and OIDC user info. They fail closed when credentials are absent.
- Password-reset tokens are random, hashed, expire after 30 minutes, are single-use and revoke active sessions. Delivery is available only with configured Resend credentials.
- API keys are random, hashed at rest, shown only once and constrained by both the creator's role and the key's explicit permission list.
- Security-sensitive actions write safe audit metadata; passwords, tokens, provider credentials and raw authorization headers are never persisted in audit logs.

Required environment configuration:

- `AUTH_JWT_SECRET` — at least 32 characters.
- `AUTH_ENCRYPTION_KEY` — at least 32 characters.
- `WORKFLOW_WORKER_SECRET` — authenticates worker claim/result routes.
- `APP_URL`, `AUTH_EMAIL_FROM`, `RESEND_API_KEY` — password-reset delivery.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth.
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` — Microsoft OAuth.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe checkout, portal and signed webhooks.

No `.env` file was changed.

## RBAC

Roles:

- Owner: all Phase 7 permissions.
- Admin: organization, security, CRM, workflow and API administration; no subscription mutation.
- Manager: CRM stage/write/read, billing read and workflow operations.
- Sales: CRM read/write/stage and workflow read.
- Marketing: CRM read/write and workflow read.
- Viewer: CRM, billing and workflow read only.

Every new private endpoint calls `requirePermission`. Worker routes require the worker secret. Stripe webhooks require signature verification. OpenAPI and authentication initiation endpoints are intentionally public.

## CRM

Implemented capabilities:

- Account projections linked to Business Intelligence businesses.
- Canonical contact reads through linked accounts.
- Explicitly created commercial opportunities.
- Versioned manual stage changes and immutable stage history.
- Activities and timeline reads.
- Notes.
- Tasks with assignee, status, priority and due date.
- Calendar records.
- Pipeline and stage projections.
- Forecast snapshots.
- Evidence-linked suggested actions.
- Append-only CRM aggregate events.
- Transactional outbox writes for opportunity creation and stage changes.

Suggested actions remain suggestions; accepting one does not change a stage.

## Workflow engine

`platform_jobs` supports queues, priorities, availability, idempotency, bounded attempts, lease ownership, retry backoff, terminal failure and dead-letter status.

Claims occur transactionally with `FOR UPDATE SKIP LOCKED`. A worker can complete a job only while holding its unexpired lease. Schedules are durable records; notifications are organization/user scoped. Outbox and inbox tables support at-least-once delivery and idempotent consumption.

No in-process infinite worker is started by the web server. Production execution requires an external worker/scheduler calling the authenticated endpoints.

## Billing

- Plans, subscriptions, immutable usage ledger, credit ledger, invoices, coupons and tax-registration references.
- Usage records are idempotent per organization.
- Stripe Checkout and Customer Portal use Stripe's real HTTP API and fail explicitly when configuration or price mapping is missing.
- Stripe webhook ingestion verifies timestamped HMAC signatures, deduplicates provider event IDs and persists only allow-listed object identifiers/types.
- No fabricated invoice, tax or subscription success state is produced.

Seed plans do not contain production Stripe price IDs. Those must be configured before checkout.

## API manifest

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/password-reset-request`
- `POST /api/auth/password-reset-confirm`
- `GET /api/auth/oauth/[provider]/start`
- `GET /api/auth/oauth/[provider]/callback`

Organization and security:

- `GET|POST /api/organization`
- `GET /api/security/sessions`
- `DELETE /api/security/sessions/[id]`
- `GET|POST /api/security/api-keys`
- `POST /api/security/mfa/setup`
- `POST /api/security/mfa/confirm`

CRM REST API:

- `GET|POST /api/v1/accounts`
- `GET /api/v1/contacts`
- `GET|POST /api/v1/opportunities`
- `POST /api/v1/opportunities/[id]/stage`
- `GET|POST /api/v1/tasks`
- `GET|POST /api/v1/activities`
- `GET|POST /api/v1/notes`
- `GET|POST /api/v1/calendar`
- `GET /api/v1/forecast`
- `GET /api/v1/pipeline`
- `GET /api/v1/suggested-actions`

Billing and operations:

- `GET /api/billing`
- `POST /api/billing/usage`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/billing/webhook`
- `GET|POST /api/workflows`
- `GET|POST /api/workflows/schedules`
- `POST /api/workflows/worker`
- `POST /api/workflows/worker/[id]`
- `GET /api/notifications`

Documentation:

- `GET /api/openapi`
- `/docs/api`

## UI routes

- `/login`
- `/crm`
- `/accounts`
- `/tasks`
- `/security`
- `/billing`
- `/workflows`
- `/docs/api`

Existing `/opportunities` remains the deterministic Opportunity Engine interface. Existing `/settings` and all Phase 1–6 routes remain available.

## OpenAPI

`src/lib/enterprise/openapi.ts` publishes OpenAPI 3.1 for the principal authentication, CRM, billing, workflow and security contracts. It documents Bearer JWT/API-key authentication and the explicit stage mutation endpoint.

## Migration and rollback

Migration is additive and idempotent through `npm run init`.

Rollback is destructive to Phase 7 history and must not run without a backup and explicit approval. Drop tables in reverse dependency order, beginning with `platform_inbox`, `platform_outbox`, billing webhook/ledger tables, CRM history/child tables, memberships/security children, and finally organizations/users. Remove only Phase 7 tables and the Phase 7 read from `scripts/init-db.mjs`. Never drop or rewrite Phase 1–6 tables.

## Validation

- `npm run init`: passed.
- PostgreSQL inspection: 40 Phase 7 tables, 74 `ON DELETE RESTRICT` foreign keys and 79 indexes/unique indexes; migration reapplication remained idempotent.
- Data safety: zero users, organizations, CRM opportunities and workflow jobs were fabricated during validation; only the three documented plan definitions exist.
- `npm run lint`: passed after correcting OAuth navigation lint.
- `npm run typecheck`: passed.
- `npm run build`: passed; 77 static/dynamic pages generated.
- `npm run test:phase2`: passed, 18 assertions.
- `npm run test:phase3`: passed, 36 assertions.
- `npm run test:phase4`: passed, 68 assertions.
- `npm run test:phase5`: passed, 67 assertions.
- `npm run test:phase6`: passed, 96 assertions.
- `npm run test:phase7`: passed, 74 assertions.
- `git diff --check`: recorded after final diff review.

Browser validation on the current development server:

- `/login` rendered password, optional MFA, organization registration and Google/Microsoft actions.
- `/crm` rendered the unified enterprise navigation and explicit-stage safety message.
- Unauthenticated CRM data loading failed closed with an `Authentication required` alert and sign-in action.
- `/docs/api` rendered OpenAPI documentation and the explicit stage-change boundary.
- `GET /api/openapi` returned OpenAPI `3.1.0`.
- Unauthenticated `GET /api/v1/accounts` returned HTTP 401.
- The browser log contained no application exceptions; only the normal Next.js development-tools notice appeared.

## Known limitations

- External Google, Microsoft, Resend and Stripe calls were not executed because no real user-approved provider credentials were supplied.
- OAuth state is signed, short-lived and bound to an HTTP-only browser nonce cookie.
- Password-reset delivery depends on Resend and an approved sender.
- Stripe price IDs must be configured in `billing_plans`.
- Invoice normalization is schema-ready; the current webhook handler focuses on subscription state and safe receipt idempotency.
- Coupons, tax registrations and member invitations have authoritative persistence contracts; provider-specific coupon/tax synchronization and invitation-email acceptance remain external integration work.
- Cron expressions are stored durably but need an external scheduler process to calculate and enqueue `next_run_at`.
- Outbox/inbox storage is implemented; broker publication requires an external relay.
- Legacy APIs remain backward compatible and retain their historical authorization limitations. New Phase 7 APIs enforce RBAC, but retrofitting all Phase 1–6 endpoints requires a separately reviewed compatibility rollout to avoid breaking public funnels and webhooks.
- No automatic CRM stage mutation exists.
