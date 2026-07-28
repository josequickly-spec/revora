# Revora Enterprise SaaS — Database Architecture

Status: **Normative**

## 1. Source of truth

PostgreSQL is the transactional system of record.

The current SQLite Drizzle schema and historical Supabase SQL are not parallel sources of truth. They must be classified as legacy definitions and retired only after an audited, non-destructive migration.

All future schema changes use versioned migrations. Runtime `CREATE TABLE` and `ALTER TABLE` statements are prohibited after migration infrastructure is established.

## 2. Database ownership model

Each table has one bounded-context owner. Only that owner writes it.

| Context | Owned data |
|---|---|
| Identity & Tenancy | tenants, users, memberships, roles, entitlements |
| Lead Discovery | searches, result candidates, imports, saved-search definitions |
| Business Intelligence | businesses, domains, locations, facts, contacts, enrichment runs |
| Web Intelligence | audit runs, crawl snapshots, pages, evidence, monitor schedules |
| Opportunity Intelligence | findings, opportunities, prioritization runs |
| AI Consulting | AI runs, report versions, evaluations, usage/cost |
| Funnel & Content | funnels, funnel versions, public slugs, captured funnel leads |
| Proposals | proposals, versions, line items, approvals |
| Outreach | sequences, messages, attempts, provider delivery events, suppressions |
| CRM | pipelines, deals, stages, activities, tasks, campaigns |
| Analytics | projections, aggregates, export records |
| Integrations | installations, secret references, provider accounts, webhooks |
| Platform | jobs, outbox, inbox, idempotency keys, audit log |

## 3. Tenant isolation

### 3.1 Required columns

Every tenant-private table contains:

- `tenant_id`
- Stable primary key
- `created_at`
- `updated_at` where mutable
- Optional `created_by` and `updated_by`
- Version or revision for optimistic concurrency where needed

Unique constraints include `tenant_id` unless uniqueness is intentionally global.

Example: a domain is unique per tenant, not globally:

```text
UNIQUE (tenant_id, normalized_domain)
```

### 3.2 Enforcement

- Application transactions set validated tenant context.
- Repository methods require tenant ID.
- Row-level security is defense in depth for private tenant tables.
- Background jobs and migrations use explicit privileged roles.
- Public funnel access uses a narrow projection keyed by published slug, never unrestricted tenant queries.

## 4. Identifier strategy

- New aggregate IDs use UUIDv7 or another sortable distributed identifier.
- Existing integer and textual IDs remain supported during migration.
- Compatibility mapping columns or tables bridge legacy IDs.
- External provider IDs are never primary keys.
- Public tokens are distinct from internal IDs and can be rotated or revoked.

## 5. Canonical aggregates

### 5.1 Tenant and membership

```text
tenant
membership
role
entitlement
usage_ledger
```

Entitlements determine feature access; usage ledger supports quotas and billing reconciliation.

### 5.2 Business

```text
business
business_domain
business_location
business_fact
business_technology_snapshot
contact
contact_point
contact_verification
enrichment_run
enrichment_observation
```

Rules:

- `business` represents the tenant's commercial record.
- Provider observations are immutable and retain provenance.
- Curated current facts reference their winning observation.
- AI inference is never stored as an observed fact.
- Contacts and emails retain source, verification, and suppression state.

### 5.3 Web audit

```text
web_audit
crawl_snapshot
crawled_page
page_evidence
performance_snapshot
domain_snapshot
technology_observation
tracking_observation
audit_comparison
audit_monitor
```

Large HTML and screenshots live in object storage. PostgreSQL stores metadata, hashes, status, and artifact references.

### 5.4 Opportunities

```text
opportunity_run
opportunity
opportunity_evidence_link
opportunity_status_history
```

Opportunities reference immutable audit/evidence versions so later re-audits do not rewrite historical reasoning.

### 5.5 AI consulting

```text
ai_workflow_definition
ai_run
ai_step_run
ai_artifact
ai_evaluation
ai_usage
consultant_report
consultant_report_version
```

Prompt text and large model payloads may be stored in encrypted object storage with hashes and retention controls.

### 5.6 Funnels

```text
funnel
funnel_version
funnel_localization
funnel_publication
funnel_view_event
funnel_lead
```

Generated content is immutable per version. Publishing selects a version. Editing creates a new version.

### 5.7 Proposals

```text
proposal
proposal_version
proposal_opportunity
proposal_line_item
proposal_approval
```

Pricing assumptions are versioned and traceable to their source inputs.

### 5.8 Outreach

```text
outreach_sequence
outreach_step
outreach_message
delivery_attempt
delivery_event
suppression
consent_record
```

Generated draft, approval, send request, provider acceptance, delivery, open, click, bounce, and complaint are distinct states.

### 5.9 CRM

```text
pipeline
pipeline_stage
deal
deal_stage_history
activity
task
campaign
campaign_member
campaign_metric_snapshot
```

CRM consumes facts from other contexts through projections; it does not duplicate their full write models.

## 6. Existing-table migration map

| Existing table | Target |
|---|---|
| `businesses` | business aggregate; expand with tenant and legacy mapping |
| `contacts` | contact/contact_point/contact_verification |
| `funnels` | funnel + funnel_version + localization |
| `funnel_leads` | funnel_lead + consent record |
| `outreach_messages` | sequence/message/attempt structures |
| `proposals` | proposal + version |
| `campaigns` | CRM campaign; JSON fields decomposed gradually |
| `campaign_metrics` | campaign metric snapshots and raw provider events |
| `funnelspy_audits` | web_audit plus normalized evidence/artifact references |
| `funnelspy_monitors` | audit_monitor |

Migration uses:

1. Expand schema.
2. Dual-read through a compatibility repository where necessary.
3. Backfill in resumable batches.
4. Validate counts, hashes, relationships, and tenant assignment.
5. Switch reads.
6. Switch writes.
7. Observe.
8. Contract old columns/tables only with explicit approval.

## 7. Duplicate structures to resolve

### Runtime PostgreSQL

Current operational tables are created in `scripts/init-db.mjs`, with additional FunnelSpy DDL and lazy column changes in application code.

### Drizzle SQLite

`src/db/schema.ts` and `drizzle.config.ts` describe an incompatible SQLite model. It cannot remain presented as the active schema.

### Historical Supabase

`src/lib/supabase-schema.sql` defines a different normalized campaign model. `src/lib/supabase-client.ts` is misnamed because it uses the PostgreSQL pool.

### Semantic duplication

- Analysis exists in campaign JSON and FunnelSpy audits.
- Landing content exists in funnels, campaign JSON, and historical landing pages.
- Outreach content exists in outreach messages and campaign JSON.
- Proposals and historical revenue-share agreements model the same capability.
- Campaign table creation is duplicated in multiple initializers.

No duplicate is deleted until usage, data population, and migration validation are complete.

## 8. Indexing

Required high-scale patterns:

- `(tenant_id, normalized_domain)` for businesses.
- `(tenant_id, status, updated_at DESC)` for pipeline views.
- `(tenant_id, business_id, created_at DESC)` for audits and activities.
- `(tenant_id, contact_email_hash)` where exact lookup is permitted.
- Partial indexes for queued jobs, active monitors, unsent messages, and open opportunities.
- BRIN indexes for very large time-ordered event/metric tables.
- GIN only for stable, measured JSONB/query requirements.

Search by broad name, category, geography, and text moves to a search index populated from events.

## 9. Partitioning and lifecycle

Candidates for partitioning:

- Audit runs and page evidence.
- Activity and audit logs.
- Provider/webhook events.
- Funnel views.
- Campaign metrics.
- AI usage.
- Job history.

Partition by month for time retention, optionally subpartition by tenant hash at sufficient scale. Partitioning is introduced based on measured table size and query plans.

Data lifecycle:

- Hot relational metadata in PostgreSQL.
- Large artifacts in object storage.
- Derived searchable documents in search index.
- Historical analytics in warehouse/lake when justified.
- Tenant-configurable retention within legal and product limits.

## 10. Consistency and transactions

- A bounded-context aggregate update and its outbox events share one transaction.
- Cross-context operations use sagas/process managers, never distributed transactions.
- Optimistic concurrency protects versioned aggregates.
- Idempotency records protect commands and provider mutations.
- Read models may be eventually consistent and expose projection timestamps.

## 11. Backups and recovery

- Point-in-time recovery for PostgreSQL.
- Versioning/lifecycle rules for object storage.
- Encrypted backups with restore drills.
- Recovery point and recovery time objectives defined per plan.
- Tenant export and deletion are asynchronous, auditable workflows.
- Schema migrations include forward validation and rollback/mitigation procedures.

## 12. Database access rules

- No SQL in UI components.
- Route handlers call application use cases, not repositories directly.
- Repositories are private to their bounded context.
- Cross-context reporting uses read models.
- Production migrations never run implicitly on request startup.
- Destructive migrations require explicit approval, backup evidence, and a rollback plan.

## 13. Implemented Phase 4 additive table

`ai_consultant_reports` owns immutable AI Consultant runs linked to
`businesses(id BIGINT)` and `funnelspy_audits(id UUID)` with `ON DELETE RESTRICT`.
It stores lifecycle state, request/context fingerprints, version metadata, validated
report JSON, safe failure fields, warnings and provider usage metadata. The canonical
idempotent migration is `scripts/migrate-phase4-ai-consultant.sql`; rollback drops only
this Phase 4 table and is destructive to consultant-report history.
# Phase 5 addendum: Proposal Builder

The operational Proposal Builder owns `proposal_documents`, immutable `proposal_versions`, and append-only `proposal_events`. These tables are additive and intentionally separate from the preserved legacy revenue-share `proposals` table.

- `proposal_documents.business_id → businesses.id` (`RESTRICT`)
- `proposal_documents.audit_id → funnelspy_audits.id` (`RESTRICT`)
- `proposal_documents.consultant_report_id → ai_consultant_reports.id` (`RESTRICT`, nullable)
- `proposal_versions.proposal_id → proposal_documents.id` (`RESTRICT`)
- `proposal_events.proposal_id → proposal_documents.id` (`RESTRICT`)

Money is persisted as integer minor units; percentage values are basis points. Public tokens are 256-bit random values whose raw representation is returned only at creation/rotation; PostgreSQL stores only a SHA-256 hash and a short non-secret prefix. The public route reads the immutable `published_version`.

## Phase 6 addendum: Outreach Automation

Phase 6 owns additive `outreach_*` campaign, recipient, sequence, suppression, sender, provider, event and webhook tables plus `outbound_messages`. Legacy `campaigns`, `campaign_metrics` and `outreach_messages` remain historical compatibility stores. Canonical ownership and history references use `ON DELETE RESTRICT`; the outbound queue uses unique idempotency keys and row locking.
