# Phase 6 — Compliant Outreach Automation

## Outcome and Phase 5 handoff

Phase 6 converts explicitly selected businesses, existing contacts and optional published Phase 5 proposals into manually controlled campaign drafts. Review, approval, scheduling and queue processing are separate actions. The canonical provider is dry-run and transmits no email.

Phase 5 handoff: `9832d44a75b475a1fb2fa9a172d65698242f0a32`.

## Pre-change behavior matrix

| Legacy flow | Trigger | Provider/data | State | Principal risk | Decision |
|---|---|---|---|---|---|
| AI outreach draft | `/api/outreach/generate` | Direct OpenAI; client-supplied recipient | `outreach_messages.draft` | No provenance, association or structured compliance | Preserved as legacy draft generation; not used by Phase 6 |
| Direct outreach send | `POST /api/outreach` | Direct Resend | `outreach_messages.sent` | No approval, suppression, unsubscribe, idempotency or send window | POST retained but blocked with safe Phase 6 handoff; GET preserved |
| Auto campaign package | `/api/campaign-auto-generate` | Crawl, OpenAI, funnel and projections | Response-only package | Crosses module boundaries and contains speculative projections | Preserved, not connected |
| Legacy campaigns | `/api/campaigns`, `/campaign/[id]` | `campaigns`, `campaign_metrics` | ready/live/paused | Flexible updates and destructive DELETE | Preserved and labeled legacy |
| Resend webhook | `/api/webhooks/resend` | Unsigned Resend payload | Aggregate metrics | Signature TODO, no dedupe or suppression | Preserved only for legacy; not trusted by Phase 6 |

Operational baseline contained 11 businesses, 4 contacts, 1 outreach record, 6 legacy campaigns and no Phase 5 proposal documents.

## Architectural boundaries

- Business Intelligence owns public company identity.
- Contact Intelligence owns contact candidates, provenance and verification evidence.
- FunnelSpy owns audit evidence.
- Opportunity Engine owns deterministic gaps.
- AI Consultant owns advisory strategy.
- Proposal Builder owns reviewed commercial documents.
- Outreach Automation owns reviewed message delivery state and compliance controls.
- CRM remains the future Phase 7 handoff.

Provider events are not proof of human attention, identity, buying intent, acceptance, sales stage or revenue. Opens and clicks, if later supplied by a provider, are provider-reported signals only.

## Canonical contracts and lifecycle

Campaign statuses: draft, review_required, approved, scheduled, running, paused, completed, cancelled, failed and archived.

Supported transitions:

- `draft → review_required`
- `review_required → draft|approved`
- `approved → scheduled`
- `scheduled → running`
- `running → paused|completed|cancelled|failed`
- `paused → running|cancelled`
- terminal states → archived
- draft/review/approved/scheduled may be explicitly cancelled

There is no automatic creation, review, approval, scheduling, running or sending.

## Contact provenance and verification

Recipients must reference an existing contact associated with the selected business. Allowed provenance is enumerated and stored. Email is normalized, syntax validated and its original verification state preserved.

Eligible by default: provider_verified, domain_valid or syntax_valid plus explicit campaign review. Provider-risky requires explicit risky approval. Invalid, unknown, suppressed, unsubscribed and hard-bounced recipients cannot pass review.

No address guessing, name-pattern generation or AI personalization exists.

The contact association remains mandatory (`contact_id NOT NULL`). Contact Intelligence is the canonical owner of recipient identity, business association, discovery provenance and verification evidence. Making `contact_id` nullable would create a second, weaker recipient identity model inside Outreach and break that boundary.

## Compliance controls

Central review validates campaign state, recipient syntax and verification, suppression, unsubscribe, bounce state, sender/provider readiness, physical address, unsubscribe placeholder, timezone, active steps, deceptive subjects, unsupported claims and unsafe HTML.

These are compliance-oriented safeguards, not a guarantee of legal compliance. The user remains responsible for lawful outreach and jurisdiction-specific review.

## Suppression and unsubscribe

Suppression precedence is complaint, global unsubscribe, hard bounce, legal hold, manual block, invalid address, provider block, repeated soft bounce, then campaign unsubscribe. Checks occur when adding a recipient, during review, during scheduling context validation and again in the worker.

Suppressions are append-only. No automatic unsuppression exists.

An active-suppression unique index covers normalized email hash, scope, campaign, sender and suppression type. Released records retain history through `released_at`; only records where `released_at IS NULL` participate in active uniqueness.

Unsubscribe tokens use 256 bits of entropy. Only SHA-256 hash and an eight-character administrative prefix are stored. Public URLs contain neither email nor database IDs. Repeated requests are idempotently successful, create suppression and cancel future pending messages while preserving history.

## Sender and provider

Phase 6 creates a dry-run provider connection and review-only sender identity. The provider abstraction returns truthful `dry_run`/unknown state and `liveMessagesSent: 0`. It never falls back to Resend.

The sender UI shows verification state and does not claim SPF, DKIM or DMARC validity. Real delivery requires a future verified provider adapter and valid business mailing address.

The seeded review sender is explicitly `unverified`. A database trigger rejects live-delivery status transitions when the provider is `dry-run`, the sender is not `provider_verified`, the domain ends in `.invalid`, or the physical address remains a configuration placeholder. Another trigger enforces the invariant that a campaign's provider connection equals the selected sender identity's provider connection; application callers should validate the same invariant before persistence.

## Templates and personalization

Deterministic catalog:

- Simple Introduction
- Audit Insight
- Proposal Delivery
- Value Follow-Up
- Final Follow-Up

Templates require unsubscribe and physical-address placeholders, omit unknown names, forbid fake Re:/Fwd:, invented facts, guarantees, false urgency and hidden prices. Maximum sequence length is five steps.

## Scheduling, queue, retry and idempotency

Default window is Monday-Friday, 09:00-17:00 in an explicitly selected IANA timezone. Default limits are 25/day and 10/hour. The scheduler uses fixed hour/day delays and creates immutable outbound message snapshots.

Approval freezes the campaign sender, provider, compliance version, sequence version and content version. Sequence rows cannot be inserted, changed or removed after draft review begins. Outbound subject, HTML, text, recipient, sequence step, content version and idempotency key are immutable after the snapshot is created.

The PostgreSQL queue uses unique SHA-256 idempotency keys and `FOR UPDATE SKIP LOCKED` with a maximum worker batch of 25. Content version is frozen on queued messages.

`outbound_messages` records `locked_at`, `locked_by` and `lease_expires_at`. Worker acquisition must occur in one transaction, select only eligible unlocked or expired rows, and claim them using:

```sql
SELECT id
FROM outbound_messages
WHERE status IN ('scheduled','queued','deferred')
  AND scheduled_at <= NOW()
  AND (lease_expires_at IS NULL OR lease_expires_at < NOW())
ORDER BY scheduled_at
FOR UPDATE SKIP LOCKED;
```

The worker must persist its lock owner and lease before committing. Row locks prevent concurrent claims in the transaction; leases support crash recovery; unique message idempotency keys and attempt numbers prevent duplicate local processing records. Provider adapters must also use the idempotency key because PostgreSQL cannot make an external network delivery transactionally exactly-once.

Every provider attempt is persisted in `outreach_delivery_attempts`, unique on `(message_id, attempt_number)`, with safe error fields, request correlation, latency and retry timing. Negative latency and non-positive attempt numbers are rejected.

Retry policy is 5, 30 and 120 minutes, maximum three attempts, only for confirmed temporary provider/network/rate-limit classes. No retry is allowed for hard bounce, invalid address, complaint, unsubscribe, policy rejection, permanent rejection or ambiguous provider acceptance.

## Webhooks, replies and tracking

Canonical webhook: `POST /api/outreach/webhooks/[provider]`.

It requires HMAC-SHA256, a five-minute timestamp window and a unique provider event ID. Stored payload is minimized. Bounce and complaint create global suppression. Duplicate events are ignored.

Webhook storage includes provider message correlation, canonical message association, provider occurrence time, processing time/status and safe error code. `(provider, provider_event_id)` remains the idempotency boundary. SQL enforces a strict `safe_payload` allow-list containing only `type` and `messageId`, with scalar string/null values; message IDs containing `@` are rejected. Raw email, authorization headers, provider secrets, cookies, credentials and arbitrary nested payloads cannot be persisted there. Recipient email must not appear in logs, exports, public routes or webhook public responses.

Reply is a terminal sequence signal in the contract, but Phase 6 dry-run has no mailbox ingestion and does not fabricate replies or auto-reply. Opens/clicks never mark a recipient interested or move CRM.

## Persistence and migration

Additive tables:

- outreach_provider_connections
- outreach_sender_identities
- outreach_campaigns
- outreach_recipients
- outreach_sequence_steps
- outbound_messages
- outreach_suppressions
- outreach_events
- outreach_webhook_events
- outreach_delivery_attempts

All ownership/history foreign keys use `ON DELETE RESTRICT`. Existing `campaigns`, `campaign_metrics` and `outreach_messages` are unchanged.

Phase 6 hardening adds exact state and numeric `CHECK` constraints; worker leases and delivery-attempt history; webhook correlation and processing fields; safe-payload validation; active suppression uniqueness; approved-content and sender/provider guards; unsafe live-delivery refusal; and indexes for queue, recipient state, provider message correlation, attempts and webhook processing.

Exact idempotent SQL: `scripts/migrate-phase6-outreach.sql`.

Rollback, only after backup and explicit approval:

```sql
DROP TRIGGER IF EXISTS outbound_message_live_delivery_guard ON outbound_messages;
DROP TRIGGER IF EXISTS outbound_message_snapshot_freeze_guard ON outbound_messages;
DROP TRIGGER IF EXISTS outreach_sequence_freeze_guard ON outreach_sequence_steps;
DROP TRIGGER IF EXISTS outreach_campaign_approved_freeze_guard ON outreach_campaigns;
DROP TRIGGER IF EXISTS outreach_campaign_sender_provider_guard ON outreach_campaigns;
DROP FUNCTION IF EXISTS prevent_unsafe_live_outreach_delivery();
DROP FUNCTION IF EXISTS freeze_outbound_message_snapshot();
DROP FUNCTION IF EXISTS freeze_outreach_sequence_after_review();
DROP FUNCTION IF EXISTS freeze_approved_outreach_campaign();
DROP FUNCTION IF EXISTS enforce_outreach_campaign_sender_provider();
DROP TABLE outreach_delivery_attempts;
DROP TABLE outreach_webhook_events;
DROP TABLE outreach_events;
DROP TABLE outreach_suppressions;
DROP TABLE outbound_messages;
DROP TABLE outreach_sequence_steps;
DROP TABLE outreach_recipients;
DROP TABLE outreach_campaigns;
DROP TABLE outreach_sender_identities;
DROP TABLE outreach_provider_connections;
```

Do not run rollback when any table contains records. Never drop legacy tables.

## Routes

UI created:

- `/outreach/campaigns/new`
- `/outreach/campaigns/[id]`
- `/outreach/templates`
- `/outreach/suppressions`
- `/outreach/senders`
- `/unsubscribe/[token]`

UI changed: `/outreach`, `/proposals/[id]`, `/businesses/[id]`.

APIs created:

- `GET|POST /api/outreach/campaigns`
- `GET|PATCH|DELETE /api/outreach/campaigns/[id]`
- `POST .../review|approve|schedule|pause|resume|cancel|duplicate|archive`
- `GET|POST .../recipients`
- `GET|POST .../sequence`
- `GET|POST /api/outreach/suppressions`
- `POST /api/outreach/suppressions/check`
- `GET /api/outreach/sender-identities`
- `POST /api/outreach/worker`
- `POST /api/outreach/webhooks/[provider]`
- `POST /api/public/unsubscribe/[token]`

Preserved: all FunnelSpy, Opportunity, AI Consultant, Proposal Builder, revenue-share, legacy campaign and legacy webhook routes. `GET /api/outreach` remains compatible; its unsafe direct-send POST now fails safely with migration guidance.

## Security and privacy

- Strict Zod input allowlists prevent mass assignment.
- Lifecycle changes use dedicated endpoints and expected versions.
- Campaign edits use optimistic concurrency and return conflicts.
- Worker requires `OUTREACH_WORKER_SECRET`.
- Webhook requires `OUTREACH_WEBHOOK_SECRET`.
- Raw tokens, token hashes, recipient emails and provider credentials are excluded from public routes.
- No email is logged by canonical Phase 6 code.
- HTML controls remove scripts and event handlers and reject unsafe content.
- No auth/tenant boundary exists yet; this remains a material enterprise risk.

## Tests and validation

`test:phase6` contains 96 offline assertions covering contracts, lifecycle, recipients, provenance, verification, suppression precedence, unsubscribe tokens, content safety, templates, scheduling, retry, idempotency, dry-run provider, webhook signatures/events, score fixtures and static mutation boundaries.

The suite uses no network, database mutation, AI credential, live provider, email, CRM or funnel.

Validation results:

- `npm run init`: passed; hardened additive migration applied and reapplied idempotently.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:phase2`: passed, 18 assertions.
- `npm run test:phase3`: passed, 36 assertions.
- `npm run test:phase4`: passed, 68 assertions.
- `npm run test:phase5`: passed, 67 assertions.
- `npm run test:phase6`: passed, 96 assertions.
- `npm run build`: passed; 59 static pages generated.
- `git diff --check`: passed.
- PostgreSQL: required constraints, columns, indexes and triggers inspected after migration; seeded `dry-run` sender is `unverified` on `example.invalid`; no campaign, recipient or message is created by the hardening migration.
- Browser desktop: outreach list, new campaign, templates, suppressions, senders, safe missing campaign and unsubscribe routes rendered without console errors.
- Browser mobile 390×844: outreach list, new campaign, campaign safe state and unsubscribe had no horizontal overflow.
- Route manifest: Phase 5 generated 50 static pages; Phase 6 generates 59. All FunnelSpy, AI Consultant and Proposal Builder routes remain present.

## Known limitations and Phase 7 handoff

- Dry-run only; there is no live provider delivery.
- No authentication, authorization or tenant ownership enforcement.
- No encrypted recipient-address infrastructure.
- No DNS verification, mailbox/reply ingestion or provider reconciliation.
- Campaign editor currently emphasizes lifecycle visibility; richer recipient/sequence editing remains a future usability improvement.
- Provider acceptance, delivery, open and click are not treated as intent.
- Phase 7 may consume read-only campaign/message events but must not infer CRM stage automatically.

Phase 7 was not started.
