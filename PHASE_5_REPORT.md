# Phase 5 — Evidence-Based Proposal Builder

## Scope

Phase 5 adds an explicitly initiated Proposal Builder after FunnelSpy, deterministic opportunities, and optional completed AI Consultant advice. It does not run audits, call an AI provider, create funnels, send outreach, or modify CRM state.

The preserved pipeline is:

`Business → persisted FunnelSpy audit → deterministic opportunities → optional completed AI Consultant report → explicit proposal draft → review → ready → explicit publish`

## Architecture

- `src/lib/proposal-builder/contracts.ts`: strict request, content, pricing, terms, lifecycle, and persisted-record contracts.
- `evidence.ts`: verifies business/audit/report ownership and snapshots persisted evidence.
- `draft.ts` and `template.ts`: deterministic blank, evidence-assisted, and template drafts. No service price is inferred.
- `pricing.ts`: integer minor-unit arithmetic and basis points using `BigInt` internally.
- `validation.ts` and `sanitization.ts`: completeness, evidence-reference, unsafe financial-claim, text, and export boundaries.
- `store.ts`: additive PostgreSQL persistence, immutable versions, optimistic edits, lifecycle events, hashed public tokens, and view telemetry.
- `public-token.ts`: 256-bit random public tokens; only SHA-256 hashes and short non-secret prefixes are persisted.
- `export.ts`: sanitized JSON and printable HTML exports that exclude internal notes and token metadata.

AI Consultant text is labeled advisory. FunnelSpy evidence and Opportunity Engine output remain authoritative, separate inputs. No OpenAI or Anthropic call exists in the Proposal Builder.

## Database changes

The existing `proposals` revenue-share table and `/api/revenue-share` behavior remain intact. New functionality uses:

- `proposal_documents`: proposal identity, ownership, state, current/published version pointers, hashed public access, and view metadata.
- `proposal_versions`: immutable content, evidence snapshot, pricing, terms, internal notes, warnings, and schema/template versions.
- `proposal_events`: append-only lifecycle event log.

Foreign keys to businesses, FunnelSpy audits, AI Consultant reports, proposal versions, and proposal events use `ON DELETE RESTRICT`. Relevant business, audit, status, version, event, and partial token-hash indexes are present.

`npm run init` applied the additive schema successfully. Verification found all four proposal-related tables, zero new proposal documents/versions/events, one preserved legacy proposal, and five `RESTRICT` foreign keys.

## Lifecycle

- `draft → ready → published`
- A reviewed proposal may return to `draft`.
- Published/viewed/expired proposals may be archived or returned to draft where defined.
- `archive` invalidates public access.
- Publishing and token rotation are explicit.
- Editing creates a new immutable version through an optimistic `expectedVersion` check.
- The raw public token is returned once and is never stored.

Accepted and rejected statuses are reserved in the contract but intentionally have no Phase 5 transition or action because acceptance workflow is out of scope.

## Routes

Frontend:

- `/proposals`
- `/proposals/new`
- `/proposals/[id]`
- `/proposal/[token]` (public, noindex)

API:

- `GET|POST /api/proposals`
- `GET|PATCH|DELETE /api/proposals/[id]`
- `POST /api/proposals/[id]/ready`
- `POST /api/proposals/[id]/publish`
- `POST /api/proposals/[id]/duplicate`
- `POST /api/proposals/[id]/archive`
- `POST /api/proposals/[id]/rotate-token`
- `GET /api/proposals/[id]/versions`
- `GET /api/proposals/[id]/versions/[version]`
- `POST /api/proposals/[id]/export`
- `GET /api/public/proposals/[token]`

Business and audit views list their associated proposals. A completed AI Consultant report exposes an explicit “Create Proposal Draft” action with the correct business, audit, and report identifiers.

## Security and privacy

- Public access requires a high-entropy token whose SHA-256 hash is stored.
- Public rendering uses the published immutable version, not a later draft.
- Expired and archived access is denied.
- Internal notes and token prefixes are excluded from public/export payloads.
- HTML export escapes user-controlled values and strips script content.
- Proposal text is checked for unsupported guarantees and invented quantitative financial claims.
- Public pages are marked `noindex, nofollow`.
- No environment files, credentials, provider keys, or secrets were changed.

Authentication and tenant isolation remain existing platform gaps; Phase 5 does not pretend they are solved.

## Validation results

- `npm run init`: passed.
- Operational schema verification: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:phase2`: passed, 18 assertions.
- `npm run test:phase3`: passed, 36 assertions.
- `npm run test:phase4`: passed, 68 assertions.
- `npm run test:phase5`: passed, 67 assertions.
- `npm run build`: passed; 50 static pages generated and all Phase 5 routes present.
- Production-server HTTP verification: `/proposals` returned 200.
- Browser QA: desktop and mobile routes rendered without console errors; no horizontal overflow was detected at the mobile breakpoint; empty and not-found states were correct.
- `git diff --check`: passed.

The Phase 5 suite is pure/offline and uses no database mutation, network, AI provider, outreach, CRM, or funnel creation. Node emits a non-failing module-type performance warning because the repository is not globally declared as ESM.

## Preserved behavior

- FunnelSpy score fixtures remain 33 and 100.
- FunnelSpy scoring source is unchanged.
- Deterministic opportunity derivation remains the evidence source.
- AI Consultant generation, provider orchestration, evidence validation, and persistence are not modified.
- Legacy revenue-share creation remains available under its original API.
- No automatic proposal creation is introduced.

## Known limitations and risks

- There is no platform authentication, authorization, tenant boundary, role model, rate limiter, or audit actor identity.
- Public view counting records a route request, not guaranteed human attention.
- Token revocation is archive or rotation; there is no separate revocation action in Phase 5.
- Exports are JSON/printable HTML; PDF generation, email delivery, e-signature, acceptance, billing, outreach, and CRM synchronization are future phases.
- Currency math is deterministic, but currency-specific minor-unit scale is currently two decimals in display.
- Existing production data has no new Phase 5 records, so live end-to-end editor/public-link QA requires an explicitly created proposal from a real associated persisted audit.

## Rollback

1. Revert the Phase 5 commit to remove application routes and code.
2. Leave the additive empty tables in place for a non-destructive rollback.
3. If schema removal is later required, obtain explicit approval, verify all three new tables are empty, back up the database, and remove them in dependency order: `proposal_events`, `proposal_versions`, `proposal_documents`.
4. Do not alter the legacy `proposals` table or `/api/revenue-share`.
