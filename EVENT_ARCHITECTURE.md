# Revora Enterprise SaaS — Event Architecture

Status: **Normative**

## 1. Goals

The event architecture decouples the Lead Intelligence pipeline, supports durable background execution, and preserves traceability across millions of businesses.

Delivery is **at least once**. Consumers must be idempotent. Revora does not assume exactly-once transport.

## 2. Message categories

### Commands

Imperative request to one owner:

```text
lead.search.requested.v1
business.enrichment.requested.v1
web-audit.requested.v1
ai-consultation.requested.v1
proposal.generate.requested.v1
outreach.send.requested.v1
```

Commands have one logical handler and can be accepted, rejected, or scheduled.

### Domain events

Facts emitted after committed state changes:

```text
lead.candidate-selected.v1
business.enriched.v1
web-audit.completed.v1
opportunities.identified.v1
ai-consultation.completed.v1
proposal.created.v1
outreach.sent.v1
crm-stage.changed.v1
```

Multiple contexts may consume an event.

### Integration events

Stable, privacy-reviewed projections of domain events published outside the owning context. Internal database shapes never become event contracts.

## 3. Standard event envelope

Every event contains:

```json
{
  "eventId": "uuid",
  "eventType": "web-audit.completed.v1",
  "occurredAt": "ISO-8601",
  "producer": "web-intelligence",
  "tenantId": "uuid",
  "aggregateType": "web-audit",
  "aggregateId": "uuid",
  "aggregateVersion": 3,
  "actor": {
    "type": "user|service|system",
    "id": "uuid-or-service-name"
  },
  "correlationId": "uuid",
  "causationId": "uuid",
  "traceId": "trace-id",
  "schemaVersion": 1,
  "data": {}
}
```

Rules:

- Payloads contain identifiers and necessary facts, not full database rows.
- Secrets and unnecessary personal data are prohibited.
- Event names use past tense for facts.
- Breaking changes create a new versioned event type.
- Consumers tolerate additive fields.

## 4. Transactional outbox and inbox

Every state-changing transaction that produces an event writes it to the owning context's outbox in the same PostgreSQL transaction.

An event relay:

1. Claims unpublished outbox rows.
2. Publishes them to the broker.
3. Marks publication metadata.
4. Retries safely.

Every consumer records `eventId` in an inbox/idempotency table before applying side effects. Duplicate delivery returns the prior outcome.

## 5. Canonical pipeline flow

### 5.1 Lead discovery

```text
User command
→ lead.search.requested.v1
→ Lead Search job
→ lead.search.completed.v1
→ candidate selected
→ lead.candidate-selected.v1
```

Search results may remain transient until selected or saved. Provenance is retained.

### 5.2 Business Intelligence

```text
lead.candidate-selected.v1
→ business.profile-created.v1
→ business.enrichment.requested.v1
→ provider sub-jobs
→ business.enrichment-source.completed.v1
→ business.enriched.v1
```

Provider failures produce explicit partial results, not fabricated success.

### 5.3 Web Intelligence

```text
business.enriched.v1
or explicit user command
→ web-audit.requested.v1
→ crawl/render/performance/domain jobs
→ web-audit.completed.v1
→ opportunities.evaluate.requested.v1
```

Automatic audit after enrichment is controlled by tenant workflow policy, not hardcoded coupling.

### 5.4 Opportunity and AI

```text
web-audit.completed.v1
→ opportunities.identified.v1
→ ai-consultation.requested.v1
→ ai-consultation.completed.v1
```

AI execution can require explicit user approval based on plan, cost, or data policy.

### 5.5 Proposal, outreach, CRM

```text
ai-consultation.completed.v1
→ proposal.generate.requested.v1
→ proposal.created.v1
→ proposal.approved.v1
→ outreach.sequence-created.v1
→ outreach.send.requested.v1
→ outreach.sent.v1
→ provider delivery events
→ CRM projections and stage policies
```

No proposal approval or outreach send is inferred from generation completion.

## 6. Background jobs

### 6.1 Job classes

| Queue | Work | Typical limit |
|---|---|---|
| `lead-search` | Nominatim, Overpass, imports | seconds |
| `enrichment` | Hunter, BuiltWith, public metadata | seconds |
| `crawl` | HTML, sitemap, Cheerio | tens of seconds |
| `browser` | Playwright rendering and screenshots | minutes |
| `performance` | PageSpeed and domain intelligence | minutes |
| `opportunity` | Deterministic scoring | seconds |
| `ai` | Reports, funnels, outreach, proposals | minutes |
| `delivery` | Email and provider mutations | seconds |
| `webhook` | Signature validation and event normalization | seconds |
| `export` | CSV/JSON/report generation | minutes |
| `maintenance` | Monitors, retention, reconciliation | variable |

### 6.2 Job record

Every durable job records:

- Job ID and type.
- Tenant and actor.
- Aggregate references.
- Correlation and causation IDs.
- Idempotency key.
- Priority and available-at time.
- Attempt count and maximum attempts.
- Lease owner and expiration.
- State: queued, running, waiting, succeeded, failed, cancelled, dead-lettered.
- Progress summary.
- Error classification.
- Cost and provider usage.
- Created, started, heartbeat, and completed timestamps.

Large inputs are stored in object storage; the job contains a reference.

### 6.3 Retry policy

- Retry transient network, provider throttling, and lease failures.
- Do not retry validation, authorization, policy, or permanent provider errors.
- Use exponential backoff with jitter.
- Respect provider `Retry-After`.
- Apply per-tenant and per-provider concurrency.
- Send exhausted jobs to a dead-letter state with a replay tool.

### 6.4 Cancellation

Cancellation is cooperative:

- Mark cancellation requested.
- Worker checks between expensive steps.
- Completed external side effects are not undone automatically.
- Partial artifacts remain traceable.

## 7. Scheduling

Recurring monitors use durable schedules:

- Weekly/monthly funnel monitoring.
- Provider credential health checks.
- Metrics reconciliation.
- Retention and archive processing.
- Search index updates.
- Outbox/inbox cleanup.

Schedules generate ordinary idempotent commands. HTTP cron endpoints may remain as compatibility triggers but cannot be the system of record for schedules.

## 8. Webhook ingestion

1. Receive raw body.
2. Verify provider signature and timestamp.
3. Reject replay outside the allowed window.
4. Store a minimal immutable receipt and payload artifact reference.
5. Acknowledge quickly.
6. Normalize asynchronously.
7. Deduplicate by provider event ID.
8. Emit a Revora integration event.

Provider webhooks never update CRM tables directly.

## 9. Ordering and consistency

- Ordering is guaranteed only per aggregate when required.
- `aggregateVersion` enables optimistic ordering checks.
- Consumers must tolerate late events.
- Cross-context views are eventually consistent.
- UI displays pending/processing states rather than pretending synchronous completion.
- Reconciliation jobs compare authoritative records with projections.

## 10. Event retention and privacy

- Operational event payloads are minimal.
- Personal data uses identifiers whenever possible.
- Raw provider payload retention is configurable.
- Audit/security events follow longer retention.
- Tenant deletion produces tombstone/redaction workflows without corrupting aggregate history.

## 11. Observability

Every job and event emits:

- Structured logs.
- Trace spans linked by correlation ID.
- Duration and queue-delay metrics.
- Success/failure/retry counts.
- Provider quota, cost, and throttling metrics.
- Tenant-safe diagnostic context.

Required service-level indicators:

- Time from lead selection to enrichment.
- Time from audit request to completion.
- AI success and schema-valid response rate.
- Outreach delivery acceptance.
- Event backlog and oldest-message age.
- Dead-letter count.
