# Revora Enterprise SaaS — Architecture Roadmap

Status: **Normative migration plan**

Strategy: preserve behavior, establish boundaries, migrate incrementally

## 1. Non-negotiable constraints

- Preserve all working capabilities and public funnel URLs.
- Do not fabricate business, contact, performance, campaign, or integration results.
- Do not destructively migrate data without explicit approval.
- Do not expose secrets.
- Every phase has measurable exit criteria and rollback/mitigation.
- No phase begins its contract/removal step until compatibility evidence exists.

## 2. Phase 0 — Baseline and governance

Deliverables:

- Protect current uncommitted work in an approved branch/commit strategy.
- Record route, API, schema, integration, and feature inventories.
- Add Architecture Decision Record template.
- Establish these six documents as governing architecture.
- Capture baseline lint, typecheck, build, database, and real-domain smoke results.

Exit criteria:

- Current behavior is reproducible.
- Known failures are documented.
- No unclassified working-tree changes remain.

## 3. Phase 1 — Characterization and safety net

Deliverables:

- Characterization tests for every current API.
- E2E coverage for:
  - Lead search.
  - Discovery and persistence.
  - FunnelSpy audit/report.
  - Funnel creation and bilingual rendering.
  - Funnel lead capture.
  - Proposal generation.
  - Outreach draft/send guard.
  - Campaign persistence and reload.
- Database schema snapshot and migration validation harness.
- Provider contract tests using recorded, clearly labeled fixtures outside production paths.

Exit criteria:

- Existing functionality can be refactored with regression detection.
- Test data and real-provider validation are clearly separated.

## 4. Phase 2 — Identity, tenancy, and authorization foundation

Deliverables:

- Tenant, membership, role, entitlement, and usage-ledger model.
- Request/tenant context.
- Authentication integration.
- Authorization policies.
- Tenant-aware repository interfaces.
- Backfill strategy for legacy records into a default tenant.

Exit criteria:

- Every private route is authenticated and tenant-scoped.
- Public funnel routes expose only published projections.
- Existing data remains accessible to its assigned tenant.

## 5. Phase 3 — Modular monolith foundation

Deliverables:

- Target `modules/`, `platform/`, and `plugins/` structure.
- Public module interfaces.
- Architecture enforcement tests.
- Application command/query conventions.
- Compatibility layer for existing routes.

Migration sequence:

1. Lead Discovery.
2. Business Intelligence.
3. Web Intelligence.
4. Opportunity Intelligence.
5. AI Consulting.
6. Funnel & Content.
7. Proposals.
8. Outreach.
9. CRM.

Exit criteria:

- Route handlers contain no SQL or provider orchestration.
- Cross-module dependencies follow `MODULE_DEPENDENCIES.md`.

## 6. Phase 4 — Database convergence

Deliverables:

- PostgreSQL migration framework and versioned schema.
- Single authoritative schema definition.
- Removal of request-time DDL.
- Tenant columns and constraints.
- Legacy ID mapping.
- Audit/business/funnel/proposal/campaign relationships.
- Resumable backfills and reconciliation reports.

Exit criteria:

- Runtime schema can be created from migrations alone.
- SQLite Drizzle and historical Supabase definitions are classified and no longer ambiguous.
- No data is deleted.

## 7. Phase 5 — Durable events and background jobs

Deliverables:

- Transactional outbox/inbox.
- Durable job store and workers.
- Idempotency framework.
- Retry, dead-letter, replay, and cancellation tools.
- Correlation IDs and distributed tracing.

Move first:

- FunnelSpy analysis.
- Playwright rendering.
- PageSpeed/RDAP/urlscan.
- Business enrichment.
- AI reports.
- Monitors and exports.

Exit criteria:

- Long-running work survives web process restarts.
- Duplicate delivery does not duplicate domain records or external actions.

## 8. Phase 6 — Unified Lead Intelligence experience

Deliverables:

- New platform navigation.
- Overview.
- Leads.
- Business Intelligence profile.
- Audit and opportunities.
- Consultant report.
- Proposal.
- Outreach.
- CRM.
- Persistent pipeline status.

Compatibility:

- Existing APIs and public URLs remain functional.
- Existing `/` and `/dashboard` flows redirect only after parity is verified.

Exit criteria:

- A selected lead can move through the entire pipeline without duplicate data entry.
- Each stage exposes evidence, status, owner, and next action.

## 9. Phase 7 — AI orchestration

Deliverables:

- Workflow registry.
- Provider-neutral AI adapters.
- Evidence packs.
- Structured output validation.
- Prompt/model versioning.
- Evaluation suites.
- Usage, cost, quota, and approval records.
- Prompt-injection defenses for crawled content.

Exit criteria:

- No direct model calls remain outside AI adapters.
- Every material AI claim is evidence-linked or labeled inference.
- Provider fallback is tested and policy-compliant.

## 10. Phase 8 — Plugin platform

Deliverables:

- Plugin manifest and capability contracts.
- Installation and tenant configuration records.
- Secret-reference system.
- Health, quotas, priorities, and fallback policies.
- Migrate current providers:
  - Nominatim/Overpass.
  - Hunter.
  - BuiltWith.
  - PageSpeed.
  - RDAP.
  - urlscan.
  - OpenAI/Anthropic and future Gemini.
  - Resend.
  - Google Ads.
  - Meta.

Exit criteria:

- Core modules contain no vendor SDK dependencies.
- Provider replacement requires no domain-model change.

## 11. Phase 9 — Scale and reliability

Deliverables:

- Distributed cache and rate limits.
- Search index for business/lead discovery.
- Object storage for large artifacts.
- Partition high-volume tables.
- Read projections for dashboards.
- Per-tenant/provider concurrency limits.
- Autoscaling worker pools.
- Backup/restore and regional recovery drills.

Exit criteria:

- Load tests demonstrate agreed throughput and latency.
- Queue backlog, database saturation, and provider throttling recover automatically.
- Million-business datasets remain queryable within service objectives.

## 12. Phase 10 — Enterprise controls

Deliverables:

- SSO/SAML and SCIM when commercially required.
- Fine-grained roles and audit exports.
- Tenant data residency policies.
- Retention and legal-hold controls.
- Dedicated tenant deployment options.
- Billing, plans, usage reconciliation, and overage policies.
- Security and compliance evidence program.

## 13. Capability preservation matrix

Each phase must continuously verify:

| Capability | Must remain |
|---|---|
| Geographic business discovery | Yes |
| Public-domain validation | Yes |
| Hunter/BuiltWith enrichment | Yes |
| FunnelSpy crawl and scoring | Yes |
| Playwright/Cheerio/PageSpeed/RDAP/urlscan | Yes |
| Compare/history/monitor/export/share | Yes |
| AI report | Yes |
| Bilingual funnel generation | Yes |
| Public funnel and lead capture | Yes |
| Proposal/revenue share | Yes |
| Outreach generation and Resend | Yes |
| Ads strategy/readiness | Yes |
| CRM, campaigns, metrics, webhooks | Yes |

## 14. Deprecation policy

A legacy route, table, or component can be removed only when:

1. A replacement exists.
2. Characterization and parity tests pass.
3. Production usage is measured or proven absent.
4. Data migration and reconciliation pass.
5. Rollback/mitigation exists.
6. Deprecation is documented.
7. Destructive action receives explicit approval.

## 15. Immediate implementation order

The next authorized implementation should not start with microservices or new features. It should start with:

1. Baseline protection and tests.
2. Tenant/auth design decisions.
3. Module boundaries and compatibility interfaces.
4. Versioned PostgreSQL migrations.
5. Durable jobs for FunnelSpy.

This sequence reduces risk while making every later enterprise capability possible.
