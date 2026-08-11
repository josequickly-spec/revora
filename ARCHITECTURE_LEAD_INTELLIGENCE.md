# Revora Lead Intelligence Architecture

Status: **Normative product architecture**

Scope: consolidation of current Revora capabilities without product duplication

## 1. Product definition

Revora is a single Lead Intelligence platform:

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

The stages are views over a connected business lifecycle, not independent applications.

## 2. Consolidation rules

1. Preserve every working capability.
2. Reuse existing APIs during migration.
3. Establish one canonical implementation per capability.
4. Make business identity and pipeline state persistent.
5. Keep public facts, deterministic findings, AI inference, and generated content distinguishable.
6. Do not create a funnel, approve a proposal, or send outreach implicitly.
7. Maintain backward-compatible routes until parity and usage are verified.
8. Do not delete duplicate code or data during initial consolidation.

## 3. Canonical pipeline

### 3.1 Lead Finder

Purpose:

- Search public business candidates by location and category.
- Normalize provider results.
- Let the user select a lead.

Current implementation:

- `LocalBusinessFinder`
- `/api/lead-finder/search`
- `/api/local-businesses`
- Nominatim and Overpass.

Canonical behavior:

- Searching does not create a funnel or campaign.
- Unsaved candidates remain candidates.
- Selection promotes a candidate into Business Intelligence.

### 3.2 Business Intelligence

Purpose:

- Create the tenant business record.
- Verify the public domain.
- Enrich location, technology, and contacts.
- Preserve evidence, provenance, confidence, and provider state.

Current implementation:

- `AutoDiscovery`
- `/api/discovery`
- `/api/businesses`
- `/api/contacts`
- Hunter.
- BuiltWith.
- Site metadata.

Canonical behavior:

- Discovery becomes the enrichment operation.
- It persists business and contact results.
- It does not create a funnel automatically.

### 3.3 Funnel Analysis

Purpose:

- Inspect the public acquisition journey.
- Collect reproducible technical evidence.
- Produce a deterministic score and observed funnel stages.

Current implementation:

- FunnelSpy.
- Cheerio.
- Playwright.
- Sitemap and robots discovery.
- PageSpeed.
- RDAP.
- urlscan.
- Pixel and technology detection.
- Compare, history, monitor, export, and sharing.

Canonical behavior:

- FunnelSpy is the authoritative funnel-analysis engine.
- `site-audit.ts` becomes a compatibility projection or lower-level helper.
- Campaign generation does not initiate an independent competing audit.

### 3.4 Opportunity Engine

Purpose:

- Convert verified observations into prioritized commercial opportunities.
- Preserve evidence, confidence, impact, effort, and lifecycle.

Existing inputs:

- Funnel score.
- Missing or probable stages.
- Missing CTAs/forms/tracking.
- Performance results.
- FunnelSpy weaknesses and limitations.
- Existing SEO quick wins.
- Competitor comparisons.

Canonical behavior:

- Deterministic rules produce findings first.
- AI may explain or rank findings but cannot replace evidence.

### 3.5 AI Consultant

Purpose:

- Interpret business intelligence, audits, and opportunities.
- Produce a structured strategic report.

Current implementation:

- `/api/funnelspy/ai`
- `funnelspy-ai.ts`
- Existing OpenAI/Anthropic generation paths.

Canonical behavior:

- Receives a bounded evidence pack.
- Returns schema-validated, versioned artifacts.
- Material claims cite evidence or are labeled as inference.
- It cannot publish, approve, send, or mutate another module.

### 3.6 Proposal Generator

Purpose:

- Convert selected opportunities into a versioned commercial proposal.
- Calculate fee or revenue share using explicit assumptions.

Current implementation:

- `/api/proposals`
- `/api/revenue-share`
- `proposals` table.
- Revenue-share calculator in the root UI.

Canonical behavior:

- `/api/proposals` becomes the canonical name.
- The proposal references a business, source audit, and selected opportunities.
- Generation does not imply approval.

### 3.7 Outreach

Purpose:

- Create reviewable email/video sequences for a verified contact.
- Send explicitly approved messages.
- Record provider outcomes.

Current implementation:

- `/api/outreach/generate`
- `/api/outreach`
- `outreach-generator.ts`
- Resend and webhook ingestion.

Canonical behavior:

- One outreach generator and one persisted message lifecycle.
- Provider acceptance, delivery, open, click, bounce, and complaint remain separate states.
- Missing integration configuration cannot produce a fake sent state.

### 3.8 CRM

Purpose:

- Own commercial stage, assignee, activity, tasks, campaign state, and next action.
- Present derived metrics from funnels and outreach.

Current implementation:

- CRM/pipeline inside `/`.
- `/dashboard`.
- `/campaign/[id]`.
- `/api/campaigns`.
- `/api/campaign-execute`.
- `campaigns` and `campaign_metrics`.

Canonical behavior:

- Root CRM and `/dashboard` become one surface.
- CRM references domain-owned artifacts instead of copying their full write models.

## 4. Navigation

### Primary navigation

```text
Overview
Leads
Intelligence
Audits
Opportunities
Proposals
Outreach
CRM
Settings
```

### Route model

| Area | Target route |
|---|---|
| Overview | `/` |
| Leads | `/leads` |
| Business profile | `/businesses/[businessId]` |
| Audits | `/audits` |
| Audit detail | `/audits/[auditId]` |
| Opportunities | `/businesses/[businessId]/opportunities` |
| Proposals | `/proposals` |
| Outreach | `/outreach` |
| CRM | `/crm` |
| Integrations | `/settings/integrations` |

Existing routes remain available during migration.

### Business workspace navigation

```text
Overview
Intelligence
Funnel Audit
Opportunities
Proposal
Outreach
Activity
```

### Persistent lifecycle

```text
Lead
→ Enriched
→ Audited
→ Opportunities ready
→ Proposal ready
→ Outreach drafted
→ Contacted
→ CRM active
```

Each state is backed by persisted facts. The UI must not simulate completed work.

## 5. Canonical APIs and compatibility

| Capability | Canonical API | Compatibility |
|---|---|---|
| Lead search | `/api/lead-finder/search` | `/api/local-businesses` |
| Business enrichment | `/api/discovery` initially | Existing discovery route |
| Funnel audit | `/api/funnelspy/analyze` | Existing |
| AI consultation | `/api/funnelspy/ai` initially | Existing |
| Funnel generation | `/api/funnels/generate` | `/api/funnelspy/create-funnel` |
| Proposals | `/api/proposals` | `/api/revenue-share` |
| Outreach | `/api/outreach/generate` | Inline callers migrate |
| CRM/campaigns | `/api/campaigns` | Existing |

Compatibility routes delegate to one canonical application use case. They do not remain parallel implementations.

## 6. Duplicate flows

### Business creation

Currently possible through:

- Manual root form.
- AutoDiscovery.
- LocalBusinessFinder followed by Discovery.
- FunnelSpy create-funnel.

Target:

- One business upsert capability.
- Lead selection and enrichment are explicit stages.
- Downstream modules reference the resulting `businessId`.

### Site analysis

Currently distributed across:

- `site-audit.ts`
- `funnelspy.ts`
- `campaign-auto-generate`

Target:

- FunnelSpy/Web Intelligence is authoritative.
- Consumers request or reuse an audit projection.

### Funnel generation

Currently initiated through:

- `/api/funnels/generate`
- `/api/funnelspy/create-funnel`
- `/api/discovery`

Target:

- One funnel-generation use case.
- Discovery no longer performs implicit generation.

### Campaign generation

Currently exposed through:

- Root page.
- Dashboard.
- Campaign auto-generation API.

Target:

- One CRM/Campaigns surface and one orchestration path.

### Outreach

Currently represented by:

- Inline root-page logic.
- `OutreachGenerator.tsx`.
- Outreach APIs.
- Campaign auto-generation.

Target:

- `outreach-generator.ts` and the Outreach application interface are canonical.

## 7. Duplicate React components

Current overlaps:

- `AutoDiscovery` and `LocalBusinessFinder` share search/enrichment concerns.
- `FunnelGenerator` overlaps root-page funnel controls.
- `OutreachGenerator` overlaps root-page outreach controls.
- `LandingPagePreview` overlaps persisted public funnel rendering.
- `/` and `/dashboard` duplicate campaign workflows.

Currently disconnected components:

- `FunnelGenerator.tsx`
- `OutreachGenerator.tsx`
- `LandingPageBuilder.tsx`

They must be characterized before removal. A lack of imports is not authorization to delete them.

## 8. Duplicate database representations

Active runtime:

- PostgreSQL schema in `scripts/init-db.mjs`.
- SQL embedded in route handlers and libraries.
- FunnelSpy runtime DDL.

Conflicting definitions:

- SQLite/Drizzle in `src/db/schema.ts`.
- Historical Supabase schema in `src/lib/supabase-schema.sql`.
- Duplicate campaign initialization in `src/lib/db-init.ts`.

Semantic duplicates:

- Analysis in campaigns and FunnelSpy audit JSON.
- Funnel content in `funnels` and campaign landing-page JSON.
- Outreach content in messages and campaign JSON.
- Proposal and historical revenue-share models.

PostgreSQL becomes the single source of truth through versioned, non-destructive migrations.

## 9. Ownership and relationships

The central tenant-private aggregate is the business.

```text
Business
├── Contacts
├── Enrichment runs
├── Web audits
├── Opportunities
├── Consultant reports
├── Funnels
├── Proposals
├── Outreach sequences
└── CRM deals and campaigns
```

Required future references:

```text
audit.business_id
opportunity.audit_id
consultant_report.audit_id
funnel.source_report_id
proposal.business_id
proposal.source_report_id
outreach.proposal_id
deal.business_id
```

These relationships are introduced through the migration strategy in `DATABASE_ARCHITECTURE.md`, not through ad hoc destructive changes.

## 10. Implementation boundaries

Future implementation follows:

- `SYSTEM_ARCHITECTURE.md`
- `EVENT_ARCHITECTURE.md`
- `DATABASE_ARCHITECTURE.md`
- `AI_ARCHITECTURE.md`
- `MODULE_DEPENDENCIES.md`
- `ROADMAP.md`

This document defines product consolidation. The enterprise documents define technical implementation, tenancy, events, jobs, database ownership, AI, plugins, and scale.

## 11. Consolidation sequence

1. Protect and characterize the baseline.
2. Establish tenant/auth decisions.
3. Introduce module boundaries and compatibility interfaces.
4. Converge PostgreSQL schema through migrations.
5. Move expensive work to durable jobs.
6. Introduce unified navigation and business workspace.
7. Connect Funnel Analysis to Opportunity Engine.
8. Connect AI Consultant, Proposal, Outreach, and CRM.
9. Deprecate aliases and disconnected surfaces only after parity evidence.

No later phase may remove an existing route, table, component, or capability solely because the target architecture has a replacement planned.
