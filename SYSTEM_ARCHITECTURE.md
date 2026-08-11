# Revora Enterprise SaaS — System Architecture

Status: **Normative**

Audience: engineering, product, security, data, operations

Scope: target architecture and migration constraints for all future implementation

## 1. Purpose

Revora is a Lead Intelligence platform that converts public business data into a traceable commercial workflow:

```text
Lead Finder
→ Business Intelligence
→ Funnel Analysis
→ Opportunity Engine
→ AI Consultant
→ Proposal Generator
→ Outreach
→ CRM
```

The platform must preserve every existing capability while evolving from a Next.js/PostgreSQL application into a multi-tenant SaaS capable of managing millions of businesses and high-volume asynchronous analysis.

This document is the top-level architectural authority. The companion documents define events, data, AI, dependencies, and migration sequencing.

## 2. Architectural principles

1. **Preserve behavior before restructuring.** Existing public funnels, bilingual routes, audits, campaigns, contacts, proposals, metrics, exports, and integrations remain available during migration.
2. **Modular monolith first, services by evidence.** New boundaries are enforced in code and data before deploying independent services.
3. **One owner per capability and record.** A module owns its write model. Other modules use its application interface, read model, or events.
4. **Tenant context is mandatory.** Every private command, query, event, job, and persisted record carries a tenant identifier.
5. **Asynchronous by default for expensive work.** Crawling, Playwright, PageSpeed, AI generation, enrichment, comparisons, monitoring, exports, and bulk outreach run as durable jobs.
6. **No fabricated primary data.** Public facts, provider results, inferred facts, and AI-generated recommendations are stored and displayed as distinct classes of information.
7. **Idempotency at every external boundary.** Retries must not duplicate businesses, audits, funnels, proposals, emails, or metrics.
8. **Security is deny-by-default.** Authorization is enforced server-side at the application boundary and data boundary.
9. **Observability is part of the contract.** Commands, events, jobs, AI runs, provider calls, and state transitions are traceable.
10. **Backward-compatible evolution.** Database and API changes use expand/migrate/contract sequencing.

## 3. Target topology

### 3.1 Deployment stages

#### Stage A — Modular monolith

- Next.js web application for UI, server-rendered public pages, and compatibility APIs.
- Application modules with explicit public interfaces.
- PostgreSQL as transactional system of record.
- Durable queue and worker processes for background work.
- Object storage for screenshots, exports, prompt artifacts, and large crawl results.
- Redis-compatible store for distributed rate limits, short-lived cache, and coordination.

#### Stage B — Independently scalable workers

- Web/API remains one deployable unit.
- Crawl, enrichment, AI, export, and delivery workers scale independently.
- Transactional outbox publishes integration events.
- Read models support dashboards and search.

#### Stage C — Selective service extraction

A bounded context may become a service only when at least one is true:

- It requires materially different scaling or runtime isolation.
- It has an independent availability or compliance requirement.
- Its release cadence is blocked by the monolith.
- Its data volume or workload harms other contexts.
- Its team ownership is stable and independent.

Likely first extractions: Web Intelligence workers, AI Orchestration workers, Outreach Delivery, and Search/Lead Indexing.

## 4. Runtime components

| Component | Responsibility | State |
|---|---|---|
| Web application | UI, BFF queries, public funnels, authenticated commands | Stateless |
| Application API | Module command/query interfaces and compatibility routes | Stateless |
| Job scheduler | Creates recurring and delayed jobs | Durable schedules |
| Job workers | Enrichment, crawling, AI, export, outreach, metrics | Durable queue |
| PostgreSQL | Transactional records, tenant boundaries, outbox, job metadata | Authoritative |
| Search index | Business and lead discovery at scale | Derived |
| Object storage | Screenshots, exports, crawl artifacts, large AI inputs/outputs | Durable |
| Redis-compatible store | Cache, locks, distributed rate limits | Ephemeral |
| Event relay | Publishes committed outbox events | At-least-once |
| Observability stack | Logs, metrics, traces, audit trail | Durable according to policy |

## 5. Bounded contexts

### 5.1 Identity & Tenancy

Owns:

- Users, organizations, memberships, roles, service accounts.
- Tenant lifecycle, plans, entitlements, quotas, and feature policies.
- Authentication adapters and authorization decisions.

Does not own businesses, contacts, or campaign data.

### 5.2 Lead Discovery

Owns:

- Search requests and filters.
- Provider-normalized lead candidates.
- Candidate provenance and deduplication hints.
- Saved searches and import batches.

Existing capabilities preserved: Nominatim and Overpass discovery, location/category search, and exclusion filters.

### 5.3 Business Intelligence

Owns:

- Canonical tenant business records.
- Domains and locations.
- Public business facts and their evidence.
- Contact profiles and verification state.
- Technology profiles and enrichment snapshots.

Existing capabilities preserved: manual business entry, Discovery, Hunter, BuiltWith, location matching, and site metadata.

### 5.4 Web Intelligence

Owns:

- Crawl requests and snapshots.
- Pages, observed CTAs, forms, pixels, technologies, and funnel stages.
- Performance, RDAP, sitemap, screenshot, and browser-render evidence.
- Comparison results and monitor schedules.

Existing FunnelSpy becomes the initial implementation of this context.

### 5.5 Opportunity Intelligence

Owns:

- Deterministic findings derived from Business and Web Intelligence.
- Prioritized opportunities, impact, effort, confidence, and evidence links.
- Opportunity lifecycle: open, accepted, rejected, resolved, superseded.

It does not crawl sites and does not generate final consulting prose.

### 5.6 AI Consulting

Owns:

- AI run orchestration and provider selection.
- Versioned prompt/workflow definitions.
- Structured consultant reports and recommendations.
- Citations back to source evidence.
- Evaluation, cost, latency, and safety metadata.

It does not own the source business facts or opportunities.

### 5.7 Funnel & Content

Owns:

- Generated funnel definitions and versions.
- Localized content.
- Public slug routing.
- Funnel publication state, views, and lead-capture configuration.
- Generated landing assets.

Existing bilingual `/es/funnel/:slug` and `/en/funnel/:slug` behavior remains supported.

### 5.8 Proposals

Owns:

- Proposal drafts and versions.
- Scope, pricing, revenue-share assumptions, and approval state.
- Links to selected opportunities and generated funnel versions.

### 5.9 Outreach

Owns:

- Outreach sequences, messages, templates, delivery attempts, and provider events.
- Contact eligibility and suppression decisions.
- Review, approval, send, retry, and terminal delivery states.

### 5.10 CRM

Owns:

- Pipeline, stages, ownership, activities, tasks, and next actions.
- Opportunity-to-deal lifecycle.
- Campaign orchestration state and aggregate performance.

It consumes outreach and funnel metrics; it does not own their raw provider events.

### 5.11 Analytics & Reporting

Owns:

- Derived cross-context metrics and read models.
- Product usage, commercial attribution, dashboards, and exports.
- Data warehouse publication when introduced.

### 5.12 Integrations & Plugins

Owns:

- Provider registry.
- Tenant integration installations.
- Secret references, scopes, health, quotas, and webhook registrations.
- Plugin manifests and runtime policy.

It does not expose provider credentials to feature modules.

### 5.13 Platform Operations

Owns:

- Job execution framework.
- Idempotency records.
- Outbox/inbox mechanics.
- Audit log, observability conventions, rate limits, and operational controls.

## 6. Module communication

### 6.1 Synchronous communication

Use synchronous calls for:

- Input validation.
- Authorization.
- Small transactional commands.
- Queries needed to render an immediate response.
- Reads from an owning module's public interface.

Inside the modular monolith, calls use typed application interfaces, never direct imports from another module's infrastructure or database repository.

### 6.2 Asynchronous communication

Use events/jobs for:

- Provider calls.
- Crawling and browser rendering.
- AI execution.
- Bulk or scheduled work.
- Cross-context reactions.
- Webhook processing.
- Projections and read-model updates.

Events communicate facts that have already occurred. Commands request work from one explicit owner.

### 6.3 Forbidden communication

- Cross-module writes to another module's tables.
- UI components calling provider SDKs.
- One route handler implementing multiple bounded contexts transactionally.
- Importing another context's repository.
- Using shared JSON blobs as an undocumented integration contract.
- Calling an external AI provider directly outside AI Consulting.
- Calling external enrichment providers outside Integrations adapters.

## 7. Request and tenant context

Every private request creates an immutable context:

```text
requestId
correlationId
tenantId
actorId
actorType
roles
entitlements
locale
idempotencyKey
```

The context propagates to commands, SQL transactions, events, jobs, logs, traces, and provider calls. Public funnel requests use a restricted public context and can access only published funnel projections.

## 8. API strategy

### 8.1 API layers

- **UI/BFF API:** optimized for Revora screens.
- **Application command/query API:** stable module operations.
- **Compatibility API:** existing routes maintained during migration.
- **Webhook API:** provider-specific authenticated ingestion.
- **Public API:** versioned external tenant integrations in the future.

### 8.2 Contracts

- Zod or generated schema validation at boundaries.
- Versioned request and response contracts.
- Cursor pagination for large collections.
- Idempotency keys for all externally retried mutations.
- Problem Details-style structured errors.
- No provider-specific response object escapes an adapter.

## 9. Plugin architecture

Plugins extend providers and policies, not core domain ownership.

### 9.1 Plugin types

- Lead source.
- Business/contact enrichment.
- Web technology detection.
- Performance/domain intelligence.
- AI model provider.
- Email delivery.
- Ad platform.
- CRM synchronization.
- Export destination.
- Webhook transformer.

### 9.2 Plugin contract

Every plugin declares:

- Stable plugin ID and semantic version.
- Supported capabilities.
- Configuration schema.
- Required secret references and scopes.
- Input/output schemas.
- Rate-limit and retry hints.
- Data residency classification.
- Health check.
- Cost attribution metadata.
- Idempotency behavior.

### 9.3 Execution policy

- Plugins run behind capability interfaces.
- Secrets are resolved just-in-time and never stored in job payloads.
- Untrusted third-party plugins eventually run out-of-process.
- Plugin results include provider, timestamp, confidence, provenance, and raw artifact reference.
- A tenant can install multiple providers per capability and define priority/fallback policies.

## 10. Multi-tenant model

- Tenant is an organization/workspace.
- Users access tenants through memberships.
- Every private business object belongs to exactly one tenant.
- The same real-world domain may exist in multiple tenants with different notes, contacts, opportunities, and lifecycle.
- Global reference data may be shared only when explicitly designed as non-tenant data.
- Tenant quotas apply to searches, crawls, AI tokens, stored artifacts, contacts, sends, and monitors.
- Tenant deletion uses an auditable, asynchronous retention workflow.
- Enterprise plans may receive dedicated encryption keys, regions, queues, or databases without changing domain contracts.

## 11. Scale strategy

For millions of businesses:

- Use UUIDv7 or equivalent time-ordered identifiers for new aggregate IDs.
- Partition append-heavy event, audit, activity, and metric tables by time and/or tenant hash.
- Maintain canonical normalized domains and indexed tenant/domain pairs.
- Move broad business search to a search index; PostgreSQL remains authoritative.
- Store large HTML, screenshots, exports, and raw provider payloads in object storage.
- Use cursor pagination, projections, and materialized read models.
- Enforce per-tenant concurrency and provider quotas in workers.
- Avoid synchronous fan-out to multiple providers.
- Archive superseded crawl artifacts according to retention policy.

## 12. Security and compliance baseline

- Server-side tenant authorization on every private command and query.
- Row-level security as defense in depth where operationally feasible.
- Encrypted secrets in a managed secret store.
- Webhook signature verification and replay protection.
- SSRF protection for all fetch and browser jobs, including redirect and DNS revalidation.
- Contact suppression and consent records.
- Immutable administrative audit log.
- Data classification and retention policy.
- Redaction of secrets and unnecessary personal data from logs and AI prompts.

## 13. Existing capability mapping

| Existing capability | Target owner |
|---|---|
| LocalBusinessFinder / Overpass | Lead Discovery |
| AutoDiscovery / Hunter / BuiltWith | Business Intelligence |
| FunnelSpy analyze/compare/history/monitor/export | Web Intelligence |
| FunnelSpy score and gaps | Opportunity Intelligence |
| FunnelSpy AI report | AI Consulting |
| Funnel generator and public pages | Funnel & Content |
| Revenue share/proposals | Proposals |
| Outreach generator, Resend, webhooks | Outreach |
| Dashboard, campaigns, pipeline, metrics | CRM |
| Integration readiness endpoint | Integrations & Plugins |

## 14. Architectural decision process

Material deviations require an Architecture Decision Record containing:

- Context and problem.
- Considered options.
- Decision and consequences.
- Migration and rollback plan.
- Security, tenant, data, cost, and observability impact.

No new shared table, cross-context write, provider-specific domain type, or synchronous long-running workflow is allowed without an approved ADR.
