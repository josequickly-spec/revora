# Revora Enterprise SaaS — Module Dependencies

Status: **Normative**

## 1. Dependency rule

Dependencies point inward:

```text
UI / API / Workers
        ↓
Application use cases
        ↓
Domain model
        ↑
Ports implemented by infrastructure adapters
```

Domain modules do not import Next.js, PostgreSQL clients, provider SDKs, queue clients, or UI code.

## 2. Proposed folder structure

```text
src/
  app/
    (public)/
      [lang]/funnel/[slug]/
      shared/audits/[token]/
    (platform)/
      overview/
      leads/
      businesses/[businessId]/
      audits/
      opportunities/
      proposals/
      outreach/
      crm/
      settings/integrations/
    api/
      v1/
      webhooks/
      compatibility/
  modules/
    identity-tenancy/
      domain/
      application/
      infrastructure/
      presentation/
      public.ts
    lead-discovery/
    business-intelligence/
    web-intelligence/
    opportunity-intelligence/
    ai-consulting/
    funnel-content/
    proposals/
    outreach/
    crm/
    analytics/
    integrations/
  platform/
    auth/
    database/
    events/
    jobs/
    object-storage/
    observability/
    rate-limits/
    security/
  plugins/
    contracts/
    registry/
    lead-sources/
    enrichment/
    web-intelligence/
    ai-providers/
    delivery/
    advertising/
    crm-sync/
  shared/
    kernel/
      ids/
      money/
      time/
      result/
      errors/
      pagination/
    contracts/
      events/
      api/
tests/
  unit/
  integration/
  contract/
  e2e/
  architecture/
migrations/
docs/
  adr/
```

This is a target structure. Existing files move incrementally; no big-bang rewrite is allowed.

## 3. Public module surface

Each module exposes only `public.ts`, containing:

- Command/query interfaces.
- Stable DTOs.
- Domain event schemas intended for consumers.
- Capability identifiers.

Private:

- Repositories.
- ORM/SQL models.
- Provider adapters.
- Internal domain entities.
- Route-specific representations.

Deep imports into another module are prohibited and enforced by architecture tests/lint rules.

## 4. Dependency matrix

Legend:

- `S`: synchronous public interface permitted.
- `E`: event subscription permitted.
- `—`: no direct dependency.

| Consumer ↓ / Owner → | Identity | Leads | Business | Web Intel | Opportunities | AI | Funnels | Proposals | Outreach | CRM | Analytics | Integrations |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Lead Discovery | S | — | — | — | — | — | — | — | — | — | E | S |
| Business Intelligence | S | E | — | — | — | — | — | — | — | E | E | S |
| Web Intelligence | S | — | S | — | — | — | — | — | — | — | E | S |
| Opportunity Intelligence | S | — | S | S | — | — | — | — | — | E | E | — |
| AI Consulting | S | — | S | S | S | — | — | S | S | — | E | S |
| Funnel & Content | S | — | S | S | S | S | — | — | — | E | E | — |
| Proposals | S | — | S | S | S | S | S | — | — | E | E | — |
| Outreach | S | — | S | — | S | S | S | S | — | E | E | S |
| CRM | S | E | S | E | E | E | E | E | E | — | E | S |
| Analytics | S | E | E | E | E | E | E | E | E | E | — | S |

Synchronous dependencies are used only when immediate correctness requires them. Historical and cross-context dashboard data should come from projections.

## 5. Module responsibilities and prohibitions

### Lead Discovery

May:

- Call lead-source plugins.
- Return normalized candidates.

Must not:

- Write businesses, contacts, funnels, proposals, or campaigns.

### Business Intelligence

May:

- Promote a selected candidate into a tenant business.
- Call enrichment plugins.

Must not:

- Generate funnels, proposals, outreach, or AI reports.

### Web Intelligence

May:

- Crawl authorized public sites and store evidence.

Must not:

- Write business facts directly, create proposals, or send outreach.

### Opportunity Intelligence

May:

- Apply deterministic policies to immutable evidence.

Must not:

- Call crawlers or AI providers directly.

### AI Consulting

May:

- Read authorized evidence projections.
- Generate versioned artifacts.

Must not:

- Publish, approve, send, or mutate another context.

### Funnel & Content

May:

- Generate drafts through AI Consulting.
- Publish approved versions.

Must not:

- Own contacts, outreach, or campaign metrics.

### Proposals

May:

- Reference opportunities and funnel versions.

Must not:

- Change opportunity findings or send messages.

### Outreach

May:

- Deliver approved messages through plugins.

Must not:

- Infer consent, approve proposals, or change raw provider metrics.

### CRM

May:

- Maintain commercial workflow and projections.

Must not:

- Become a duplicate store for full audits, AI prompts, or provider payloads.

## 6. Shared kernel policy

Allowed shared primitives:

- Tenant and actor identifiers.
- Aggregate IDs.
- Money and percentage value objects.
- Time and locale types.
- Pagination.
- Standard errors and results.
- Event envelope.

Forbidden shared domain objects:

- Generic `Business` entity used by every module.
- Generic `Campaign` JSON object.
- Provider response types.
- Mutable cross-module ORM entities.

Each context defines its own DTO/projection of another context's data.

## 7. Existing-to-target file mapping

| Existing | Target context |
|---|---|
| `components/LocalBusinessFinder.tsx` | Lead Discovery presentation |
| `components/AutoDiscovery.tsx` | Business Intelligence presentation |
| `api/local-businesses` | Lead Discovery compatibility API |
| `api/discovery` | Split across Business Intelligence use cases |
| `lib/hunter.ts`, `lib/builtwith.ts` | Integration plugins |
| `lib/site-audit.ts` | Web Intelligence compatibility adapter |
| `lib/funnelspy*` | Web Intelligence, Opportunity, AI boundaries |
| `lib/funnel-generator.ts` | Funnel & Content |
| `lib/outreach-generator.ts`, `lib/email.ts` | Outreach |
| `api/revenue-share`, `api/proposals` | Proposals |
| `api/campaigns`, `campaign-execute` | CRM |
| `lib/supabase-client.ts` | CRM repository, renamed during migration |
| `app/page.tsx`, `app/dashboard` | Platform shell and module pages |

## 8. API and route composition

Route handlers:

1. Authenticate.
2. Resolve tenant and authorization.
3. Validate transport DTO.
4. Call one application use case.
5. Map result/error to HTTP.

They do not contain SQL, provider calls, prompt construction, or multi-context orchestration.

A process manager coordinates long pipelines through commands and events.

## 9. Plugin dependencies

Feature modules depend on capability ports:

```text
Business Intelligence → ContactEnrichmentPort
Web Intelligence → BrowserRenderPort
AI Consulting → StructuredGenerationPort
Outreach → EmailDeliveryPort
CRM → ExternalCrmSyncPort
```

Plugin implementations depend on vendor SDKs. Core modules never depend on a concrete vendor plugin.

## 10. Architecture enforcement

Future CI must verify:

- No deep cross-module imports.
- No route-handler SQL.
- No provider SDK imports outside plugins.
- No AI SDK imports outside AI adapters.
- No missing tenant boundary on private repositories.
- Event schemas are backward-compatible.
- Module dependency graph has no cycles.
