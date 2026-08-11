# Revora Baseline Report

Date: 2026-07-28

Phase: 0 — baseline protection

Status: validated checkpoint candidate

## 1. Scope

This report records the current Revora application before Lead Intelligence consolidation. Phase 0 does not add product functionality, refactor application behavior, change configuration, install packages, modify secrets, or delete files.

## 2. Architecture summary

Revora is a full-stack Next.js 16 application using the App Router, React 19, strict TypeScript, Tailwind CSS 4, and PostgreSQL.

The web UI, public funnels, and API route handlers are deployed as one application. Route handlers currently call PostgreSQL and external providers directly. Long-running FunnelSpy operations execute in Node.js route handlers rather than a durable worker.

Main capabilities:

- Geographic business search through OpenStreetMap Nominatim and Overpass.
- Business enrichment through public site inspection, Hunter, and BuiltWith.
- Business, contact, funnel, proposal, outreach, campaign, and metric persistence.
- FunnelSpy analysis through Cheerio, Playwright, PageSpeed, RDAP, and urlscan.
- AI-generated consultant reports through OpenAI.
- Funnel comparison, history, monitoring, export, and public report sharing.
- Original bilingual funnel generation and public `/es` and `/en` rendering.
- Lead capture, proposal calculation, outreach generation/delivery, CRM pipeline, campaigns, ads readiness, and provider webhooks.

Important architecture sources:

- `SYSTEM_ARCHITECTURE.md`
- `EVENT_ARCHITECTURE.md`
- `DATABASE_ARCHITECTURE.md`
- `AI_ARCHITECTURE.md`
- `MODULE_DEPENDENCIES.md`
- `ROADMAP.md`
- `ARCHITECTURE_LEAD_INTELLIGENCE.md`

## 3. Active frontend routes

Confirmed by the production build:

| Route | Rendering | Purpose |
|---|---|---|
| `/` | Static | Main Revora workspace |
| `/dashboard` | Static | Campaign dashboard |
| `/campaign/[id]` | Dynamic | Persisted campaign dossier |
| `/funnel/[slug]` | Dynamic | Legacy/browser-language funnel entry |
| `/[lang]/funnel/[slug]` | Dynamic | Localized public funnel |
| `/funnelspy` | Static | Funnel analysis workspace |
| `/funnelspy/compare` | Static | Competitor comparison |
| `/funnelspy/history` | Static | Audit history |
| `/shared/funnelspy/[token]` | Dynamic | Public shared audit report |

Next.js also generates `/_not-found`.

## 4. Active API routes

Confirmed by the production build:

### Lead and business intelligence

- `/api/businesses`
- `/api/contacts`
- `/api/discovery`
- `/api/lead-finder/search`
- `/api/local-businesses`

### Funnels and lead capture

- `/api/funnels`
- `/api/funnels/generate`
- `/api/funnel-leads`

### FunnelSpy

- `/api/funnelspy/analyze`
- `/api/funnelspy/ai`
- `/api/funnelspy/compare`
- `/api/funnelspy/create-funnel`
- `/api/funnelspy/export`
- `/api/funnelspy/history`
- `/api/funnelspy/monitor`

### Proposals, outreach, and campaigns

- `/api/proposals`
- `/api/revenue-share`
- `/api/outreach`
- `/api/outreach/generate`
- `/api/campaigns`
- `/api/campaign-auto-generate`
- `/api/campaign-execute`
- `/api/ads/generate`

### Operations and provider events

- `/api/health`
- `/api/integrations`
- `/api/webhooks/analytics`
- `/api/webhooks/google-ads`
- `/api/webhooks/meta`
- `/api/webhooks/resend`

## 5. Database

PostgreSQL is the active runtime database. The main schema is created by `scripts/init-db.mjs`, with additional current runtime DDL in FunnelSpy storage and some route handlers.

### Active tables

| Table | Purpose |
|---|---|
| `businesses` | Canonical business and commercial profile |
| `contacts` | Business contacts and email confidence |
| `funnels` | Generated funnel content and public slug |
| `funnel_leads` | Leads captured by public funnels |
| `outreach_messages` | Draft and sent outreach |
| `proposals` | Revenue-share and proposal calculations |
| `campaigns` | Generated campaign packages and status |
| `campaign_metrics` | Campaign performance snapshots |
| `funnelspy_audits` | FunnelSpy analysis and AI report JSON |
| `funnelspy_monitors` | Recurring domain-monitor definitions |

### Duplicate or conflicting schema definitions

- `scripts/init-db.mjs` defines the active PostgreSQL baseline.
- `src/db/schema.ts` defines an incompatible SQLite/Drizzle model.
- `src/lib/supabase-schema.sql` defines a historical Supabase model.
- `src/lib/db-init.ts` duplicates campaign table initialization.
- `src/lib/funnelspy-store.ts` creates FunnelSpy tables during runtime.
- Some route/library code performs lazy `ALTER TABLE`.

No schema changes were made in Phase 0.

## 6. Environment variables

No values are recorded in this report.

### Core runtime

- `DATABASE_URL`

### AI

- `OPENAI_API_KEY`
- `OPENAI_MODEL` — optional override
- `GEMINI_API_KEY` — present as an available integration

### Business enrichment and web intelligence

- `HUNTER_API_KEY`
- `BUILTWITH_API_KEY`
- `BUILTWITH_API_TIER`
- `GOOGLE_API_KEY`
- `URLSCAN_API_KEY`
- `OPENPAGERANK_API_KEY`

### Email and webhook processing

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`

### Ads integrations

- `GOOGLE_ADS_CUSTOMER_ID`
- `GOOGLE_ADS_ACCESS_TOKEN`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `META_AD_ACCOUNT_ID`
- `META_ACCESS_TOKEN`
- `META_WEBHOOK_SECRET`
- `META_VERIFY_TOKEN`

### Authentication

- `AUTH_JWT_SECRET`
- `AUTH_ENCRYPTION_KEY`

The current application uses its built-in authentication system.

### Operations and deployment

- `CRON_SECRET`
- `VERCEL_TOKEN`
- `GOOGLE_SERVICE_ACCOUNT_JSON`
- `NODE_ENV`

`.env.local` is ignored by Git. The Phase 0 credential scan checked only changed and untracked checkpoint candidates and found no credential patterns.

## 7. Current Git changes

Classification recorded before any Git mutation:

### Existing authorized application work

- `src/app/page.tsx`
- `src/app/funnel/[slug]/page.tsx`
- `src/app/api/funnelspy/ai/route.ts`
- `src/app/api/funnelspy/analyze/route.ts`
- `src/app/api/funnelspy/compare/route.ts`
- `src/app/api/funnelspy/create-funnel/route.ts`
- `src/app/api/funnelspy/export/route.ts`
- `src/app/api/funnelspy/history/route.ts`
- `src/app/api/funnelspy/monitor/route.ts`
- `src/app/funnelspy/compare/page.tsx`
- `src/app/funnelspy/history/page.tsx`
- `src/app/funnelspy/layout.tsx`
- `src/app/funnelspy/page.tsx`
- `src/app/shared/funnelspy/[token]/page.tsx`
- `src/components/FunnelSpyLanguage.tsx`
- `src/components/FunnelSpyPrintButton.tsx`
- `src/lib/funnelspy-ai.ts`
- `src/lib/funnelspy-rate-limit.ts`
- `src/lib/funnelspy-store.ts`
- `src/lib/funnelspy.ts`

### Generated

- `package-lock.json`

### Configuration/dependency change

- `package.json`

### Documentation

- `VERCEL_DEPLOYMENT.md`
- `SYSTEM_ARCHITECTURE.md`
- `EVENT_ARCHITECTURE.md`
- `DATABASE_ARCHITECTURE.md`
- `AI_ARCHITECTURE.md`
- `MODULE_DEPENDENCIES.md`
- `ROADMAP.md`
- `BASELINE_REPORT.md`
- `ARCHITECTURE_LEAD_INTELLIGENCE.md`

### Suspicious or unclear

No credential, unexplained destructive change, deletion, or sensitive data was found.

`VERCEL_DEPLOYMENT.md` is safe to commit but contains an unverified statement that the application is ready for production. The successful local build does not by itself validate production deployment, authentication, provider configuration, cron, or webhook security.

## 8. FunnelSpy consistency assessment

The uncommitted FunnelSpy implementation is internally connected:

- `/` links to `/funnelspy`.
- The FunnelSpy UI calls analyze, AI, monitor, create-funnel, export, history, and comparison routes.
- Analyze and compare call the common `analyzeFunnel` engine.
- Audit persistence, report attachment, history, sharing, export, and monitoring use `funnelspy-store`.
- AI output is schema-validated.
- Funnel creation reuses the existing business database, industry configuration, and localized funnel generator.
- Generated funnels link back to FunnelSpy and Revora.
- Required dependencies are declared in `package.json` and resolved by the lockfile.
- Type checking and the production build include every FunnelSpy route.

Known consistency limitations:

- Audit storage falls back to process memory when PostgreSQL is unavailable.
- FunnelSpy tables are created lazily.
- Rate limiting is process-local.
- Monitor scheduling is exposed as an endpoint but no deployment schedule is defined.
- Private FunnelSpy/history/mutation routes are not protected by user authentication.
- Long-running Playwright/AI routes depend on deployment execution limits.

## 9. Verification results

### `npm run lint`

Result: **passed with warning**

Exit code: `0`

Warning:

- File: `src/app/funnel/[slug]/page.tsx`
- Line: `44:6`
- Rule: `react-hooks/exhaustive-deps`
- Message: `useEffect` has a missing dependency: `lang`.
- Probable cause: the effect reads `lang` while its dependency array does not include it.
- Severity: medium; it may use a stale language value if language changes without another dependency changing.

No lint errors were reported.

### `npm run typecheck`

Result: **passed**

Exit code: `0`

No TypeScript errors or warnings were reported.

### `npm run build`

Result: **passed**

Exit code: `0`

Evidence:

- Next.js `16.2.12`, Webpack build.
- Production compilation succeeded.
- TypeScript stage succeeded.
- Page data collection succeeded.
- `35/35` static pages were generated.
- Build traces were collected.
- All FunnelSpy UI and API routes appeared in the final route manifest.

The build detected `.env.local`, but no values were printed or recorded.

### `git diff --check`

Result: **passed with line-ending warnings**

Exit code: `0`

Warnings:

- `VERCEL_DEPLOYMENT.md`
- `package-lock.json`
- `package.json`
- `src/app/funnel/[slug]/page.tsx`
- `src/app/page.tsx`

Message: LF will be replaced by CRLF the next time Git touches each file.

Probable cause: Windows Git line-ending configuration and the current working-tree encoding.

Severity: low; it can create noisy future diffs but did not fail the whitespace check.

## 10. Known risks

### Critical/high

- No active authentication or tenant authorization.
- PostgreSQL, SQLite/Drizzle, and Supabase schema definitions conflict.
- FunnelSpy performs runtime DDL.
- Long-running analysis runs synchronously in web requests.
- Webhook signature handling is not uniform.
- No automated test suite exists.
- No durable distributed queue, rate limit, or cron schedule exists.
- FunnelSpy memory fallback can report non-durable success.

### Medium

- Missing React hook dependency at `src/app/funnel/[slug]/page.tsx:44`.
- Root page and dashboard contain duplicated workflow surfaces.
- Discovery and FunnelSpy can both create businesses and funnels.
- Campaigns duplicate analysis/content in JSON.
- Deployment documentation overstates production readiness.
- Mixed localization approaches and visible encoding inconsistencies exist.

### Low

- LF/CRLF conversion warnings.
- Several component prototypes are currently unused.

## 11. Rollback instructions

This checkpoint is intended to make future Phase 1 work reversible.

### Return to the checkpoint without destroying unrelated work

1. Record or commit any newer work first.
2. Identify the checkpoint:

   ```powershell
   git log --oneline --decorate -n 10
   ```

3. Create a recovery branch at the checkpoint:

   ```powershell
   git switch -c recovery/revora-baseline <checkpoint-commit>
   ```

This preserves all later branches and avoids destructive reset operations.

### Compare later work with the baseline

```powershell
git diff <checkpoint-commit>..HEAD
```

### Restore individual files

Use a new branch and explicitly restore only the intended paths from the checkpoint:

```powershell
git restore --source <checkpoint-commit> -- path/to/file
```

Review the diff before committing. Do not use `git reset --hard`, delete database records, overwrite `.env.local`, or remove untracked user files as a rollback shortcut.

### Database rollback

Phase 0 performs no database migration. Future schema phases must provide their own forward migration, validation, backup evidence, and rollback/mitigation procedure.
