# Revora Phase 1 Report

Date: 2026-07-28

Phase: 1 — unified application shell and navigation

Status: implementation complete; validation recorded below

## 1. Scope

Phase 1 reorganizes the current Revora frontend into a unified Lead Intelligence shell. It does not consolidate Lead Finder, modify Discovery, change FunnelSpy internals, change API behavior, install packages, or modify database schemas.

## 2. Route migration map

| Route | Phase 1 role | Data/behavior |
|---|---|---|
| `/` | Overview | Real counts and recent records from existing APIs |
| `/legacy` | Preserved original workspace | Original root-page implementation |
| `/leads` | Lead Finder surface | Links to current working Lead Finder |
| `/businesses` | Intelligence index | Existing businesses, contacts and funnels |
| `/businesses/[id]` | Business profile | Existing persisted business relationships |
| `/audits` | Audit index | Existing FunnelSpy history |
| `/audits/[id]` | Audit detail | Existing persisted FunnelSpy audit |
| `/opportunities` | Future module shell | Truthful consolidation status; no mock data |
| `/proposals` | Proposal index | Existing proposal records |
| `/outreach` | Outreach index | Existing outreach records |
| `/crm` | CRM entry | Links to current dashboard and legacy pipeline |
| `/settings` | Settings entry | Links to integration readiness |
| `/settings/integrations` | Integration status | Existing `/api/integrations` response |

## 3. Navigation

The shared configuration in `src/lib/platform-navigation.ts` defines:

1. Overview
2. Leads
3. Intelligence
4. Audits
5. Opportunities
6. Proposals
7. Outreach
8. CRM
9. Settings

`AppShell` uses this configuration for desktop and mobile navigation. Active routes use `aria-current="page"`.

The shell provides:

- Desktop sidebar.
- Mobile drawer.
- Sticky top header.
- Breadcrumbs.
- Page title/action area through `PageHeader`.
- Consistent responsive content container.
- Route-group loading state.
- Skip link.
- Semantic navigation and main landmarks.
- Visible keyboard focus styles.
- Labeled open/close controls.
- Escape-key support in the mobile drawer.

## 4. Components created

### Application shell

- `src/components/app-shell/AppShell.tsx`
- `src/components/app-shell/PageHeader.tsx`
- `src/components/app-shell/ModuleState.tsx`

### Data views

- `src/components/platform/OverviewDashboard.tsx`
- `src/components/platform/BusinessesView.tsx`
- `src/components/platform/AuditsView.tsx`
- `src/components/platform/RecordsView.tsx`
- `src/components/platform/IntegrationsView.tsx`

### Route infrastructure

- `src/app/(platform)/layout.tsx`
- `src/app/(platform)/loading.tsx`
- `src/app/legacy/layout.tsx`
- `src/lib/platform-navigation.ts`

## 5. Components and capabilities reused

- Existing business, contact and funnel APIs.
- Existing FunnelSpy history and detail storage.
- Existing proposal and outreach APIs.
- Existing campaign API.
- Existing integration status API.
- Existing FunnelSpy routes.
- Existing campaign dashboard.
- Entire original root workspace under `/legacy`.
- Existing Lucide icon dependency.
- Existing Tailwind styling system.

No business component was deleted.

## 6. Legacy surfaces retained

- `/legacy` contains the original large application page.
- `/dashboard` retains current campaign generation and management.
- `/campaign/[id]` retains campaign dossiers.
- `/funnelspy`, `/funnelspy/history`, and `/funnelspy/compare` remain unchanged.
- `/shared/funnelspy/[token]` remains unchanged.
- Public localized funnels remain unchanged.
- All API handlers remain unchanged.

The migration path is:

1. Preserve the original workspace at `/legacy`.
2. Expose read-only/current-data module surfaces.
3. Consolidate one bounded context at a time in later authorized phases.
4. Remove legacy surfaces only after parity, usage analysis, migration, and explicit approval.

## 7. Data integrity

- Overview uses `Promise.allSettled` against existing APIs.
- Missing endpoints are reported as unavailable.
- No substitute counts are displayed for unavailable data.
- Empty API collections display truthful empty states.
- Opportunities does not create or infer a persistent opportunity model.
- Integration settings display readiness and missing variable names, never values.

## 8. Metadata

The root layout now defines a title template and Lead Intelligence description.

Every new target route defines an appropriate title and description. The legacy workspace also has explicit metadata.

## 9. Behavior-preserving warning fix

`src/app/funnel/[slug]/page.tsx` now includes `lang` in the existing effect dependency list.

`lang` is derived entirely from `routeLanguage`, which was already a dependency. The change satisfies exhaustive dependency analysis without changing the effect body, API calls, routing rules, or funnel behavior.

## 10. Validation results

### Required final checks

- `npm run lint`: passed, exit code 0, no warnings.
- `npm run typecheck`: passed, exit code 0.
- `npm run build`: passed, exit code 0.
- Production build: 45/45 pages generated.
- `git diff --check`: recorded after documentation completion.

### Intermediate checks

An early typecheck and first build failed because generated `.next/dev/types/app/page.ts` still referenced the moved historical root page. No generated file was manually deleted. The Overview was placed at the physical `src/app/page.tsx` path and wrapped with the same application shell, after which the build regenerated route types successfully.

An early lint run reported `react-hooks/set-state-in-effect` in the new `AppShell`. The redundant route-change effect was removed. Navigation links already close the mobile drawer through their click handler.

### Browser verification

The current application server on port 3000 was inspected:

- Overview rendered with correct title and heading.
- Primary navigation was present.
- Clicking Leads navigated to `/leads`.
- Leads received `aria-current="page"`.
- Audits exposed links to `/funnelspy/history` and `/funnelspy`.
- FunnelSpy rendered its original analyzer heading.
- `/legacy` loaded the original working tools and persisted business data.
- `/dashboard` loaded the original campaign interface and persisted campaign count.
- At a 390×844 viewport, desktop sidebar was hidden.
- Mobile menu control was visible.
- Mobile navigation opened, contained Settings, and closed correctly.
- The temporary viewport override was reset.

Port 3099 was an older local process and did not represent the current build.

An initial batch of HTTP smoke requests timed out while the development server was compiling the older large routes. Browser verification immediately afterward confirmed `/funnelspy`, `/legacy`, and `/dashboard` rendered successfully. The production manifest independently confirms all preserved routes.

## 11. Route preservation

The production manifest contains all baseline API routes. No file under `src/app/api` was modified, moved, or removed.

Required FunnelSpy routes remain:

- `/funnelspy`
- `/funnelspy/history`
- `/funnelspy/compare`
- `/shared/funnelspy/[token]`

## 12. Known limitations

- `/legacy` and `/dashboard` retain their original independent headers.
- Leads, Opportunities, CRM and Settings are transitional surfaces.
- Proposal/outreach lists expose current records but do not yet provide full module workflows.
- There is no active authentication or tenant authorization.
- Some source UI retains historical encoding inconsistencies.
- Data views use client-side API loading because API behavior was explicitly frozen.
- Port 3099 is a stale local server instance.

## 13. Phase 2 handoff

The exact recommended Phase 2 is:

1. Characterize `/api/lead-finder/search`, `/api/local-businesses`, and `/api/discovery`.
2. Define a canonical Lead candidate and Business Intelligence enrichment contract without changing provider behavior.
3. Move the existing `LocalBusinessFinder` into `/leads`.
4. Move the existing enriched business workflow into `/businesses/[id]`.
5. Stop automatic funnel creation only after explicit authorization and regression coverage.
6. Keep compatibility routes until all current callers have migrated.

Phase 2 must not begin by changing FunnelSpy, proposals, outreach, CRM, or database schema.
