# Phase 4 Report — Evidence-Grounded AI Consultant

## Outcome

Phase 4 adds an explicit AI Consultant that consumes one saved business, one persisted associated FunnelSpy audit, and the deterministic opportunities derived from that audit. It validates and persists a versioned strategic report whose major recommendations cite a prebuilt evidence catalog.

Phase 5 was not started. The feature does not crawl, run FunnelSpy, call enrichment providers, create opportunities, change scores, create funnels or proposals, send outreach, or update CRM state.

## Phase 3 handoff

- Branch: `refactor/lead-intelligence-platform`
- Phase 3 commit: `5c38e68112698a46f5538d2b7a6ea8f4636815fd`
- Phase 3 was committed and the working tree was clean before Phase 4.
- Baseline score fixtures: `33` and `100`.
- Baseline Opportunity Engine: `opportunity-rules-v1`; 36 assertions.
- `src/lib/funnel-score.ts` and `src/lib/opportunity-engine/derive.ts` were not modified.

## Pre-change AI behavior matrix

| Caller | Route/library | Provider/model | Prompt/input | Validation | Persistence | Timeout/retry/fallback | Automatic | Deterministic mutation |
|---|---|---|---|---|---|---|---|---|
| `/funnelspy` explicit button | `POST /api/funnelspy/ai` | OpenAI Responses; `OPENAI_MODEL` or `gpt-5.6-terra` | Embedded route prompt; current analysis and optional screenshots | Zod structured output | `funnelspy_audits.report` through `attachReport` | Route max 60 seconds; SDK defaults; no documented fallback | No | Does not change score, but stores legacy narrative on audit |
| Dashboard and legacy explicit actions | `POST /api/campaign-auto-generate` | OpenAI Chat Completions; `gpt-4o-mini` | Embedded route prompt; business name | Manual JSON parse | Separate client save to campaigns | No retry/fallback documented | No | Can produce campaign draft content |
| Funnel routes | `src/lib/funnel-generator.ts` | OpenAI Chat Completions; `gpt-4.1-mini` | Embedded library prompt; business and requested content | Manual JSON parse plus required fields | Downstream funnel route | No retry/fallback | Explicit flow | Creates content, not FunnelSpy evidence |
| Outreach route | `src/lib/outreach-generator.ts` | OpenAI Chat Completions; `gpt-4o-mini` | Embedded library prompt | Manual JSON parse | Existing outreach draft flow | No retry/fallback | Explicit flow | Creates draft content |
| Ads route | `src/lib/ad-generator.ts` | OpenAI Chat Completions; `gpt-4o-mini` | Embedded library prompts | Manual JSON parse | None directly | No retry/fallback | Explicit flow | No evidence mutation |
| Dependency/config only | Anthropic SDK and `GEMINI_API_KEY` | No active caller found | N/A | N/A | N/A | N/A | N/A | N/A |

Existing FunnelSpy AI exposed raw provider error messages and accepted client-supplied analysis. It remains unchanged for legacy compatibility.

## Sources of truth and boundaries

- `businesses.id`: canonical business identity.
- Business Intelligence fields: persisted public business facts.
- `funnelspy_audits`: canonical deep audit evidence and FunnelSpy score.
- Opportunity Engine: deterministic interpretation from one audit under `opportunity-rules-v1`.
- AI Consultant: generated, advisory, evidence-grounded strategy subject to human review; never objective truth.

The context builder has read-only dependencies. It verifies association, derives opportunities through the existing engine, minimizes the business profile, excludes private numeric business fields, screenshots, raw HTML, secrets, headers, cookies, and stack traces, and marks unavailable information.

## Canonical contracts

`AIConsultantRequest` supports:

- `businessId`, `auditId`, `objective`, `locale`, `reportStyle`
- optional `selectedOpportunityIds`, `userInstructions`, `requestedSections`
- `regenerate`

Objectives and report styles are closed enums. Clients cannot choose a provider or model.

`AIConsultantReportRecord` contains lifecycle status, request and context metadata, provider/model, all source versions, safe failure information, warnings, usage metadata, timestamps, and the validated report.

Every strategic recommendation contains title, rationale, qualitative impact, effort, priority, action, evidence IDs, related deterministic opportunity IDs, confidence, and assumptions.

## Evidence-reference design

Evidence IDs are SHA-256-derived stable identifiers built before the provider call. Allowed sources are:

- `business_intelligence`
- `funnel_audit`
- `opportunity`
- `competitor_comparison`
- `user_provided`

Phase 4 emits the first three. Provider output must reproduce the supplied evidence catalog exactly. Unknown or altered evidence IDs fail validation. Every recommendation and roadmap item requires at least one supplied evidence ID.

## Versions

- Prompt: `ai-consultant-prompt-v1`
- Schema: `ai-consultant-schema-v1`
- Context: `ai-consultant-context-v1`
- Audit: `funnel-audit-v1`
- Score: `funnelspy-score-v1`
- Opportunities: `opportunity-rules-v1`

## Prompt and injection protections

The system prompt:

- permits only supplied facts;
- separates facts, inference, assumptions and recommendations;
- prohibits fabricated metrics, guarantees, exact revenue impact, proposals, outreach and funnels;
- treats crawled website text as untrusted data;
- instructs the model to ignore commands embedded in evidence;
- requires supplied evidence IDs and structured output.

User instructions are sanitized, length-limited to 2,000 characters and placed below system policy. The serialized provider context is capped at 100,000 characters.

## Structured and numeric validation

Zod uses strict objects and closed enums. Completion is rejected when:

- JSON/output is malformed;
- schema validation fails;
- a recommendation lacks evidence;
- an evidence ID is unknown;
- evidence is altered;
- qualitative impact, effort or priority is unsupported;
- an unsupported result-oriented percentage, currency amount, or multiplier appears.

Numeric claims are allowed only when the exact value exists in verified evidence. Clearly labeled implementation time estimates in hours, days or weeks are exempt because they are work estimates, not promised business results.

## Provider policy

- Canonical provider: OpenAI.
- API: Responses API with Zod structured output.
- Model: server-side `OPENAI_CONSULTANT_MODEL`, otherwise `gpt-5.6`. It is isolated from legacy `OPENAI_MODEL` selection.
- Timeout: 60 seconds inside the provider; API route maximum 90 seconds.
- SDK retries: `0`; no silent fallback.
- Errors: mapped to safe missing-key, timeout, rate-limit, invalid-output or provider messages.
- Usage: token counts, latency, safe request ID and finish status are stored when available. No cost is invented or displayed.
- Tests use no provider, key, network, or production data mutation.

OpenAI Responses and structured outputs remain an appropriate supported combination according to the official OpenAI model documentation consulted during implementation.

## Lifecycle and idempotency

Statuses:

`pending → generating → completed | failed`

`superseded` is reserved but not automatically applied in Phase 4. Completed reports are immutable. Regeneration creates a new report. Failed reports remain visible and never replace or overwrite a prior completed report.

The fingerprint is SHA-256 over business, audit, objective, locale, style, sorted selected opportunities, requested sections, a hash of user instructions, prompt version, context version and context hash. Identical active requests within the documented 10-minute window reuse the active record. `regenerate:true` intentionally creates another record. Audit/context changes alter the hash and prevent stale reuse.

## Persistence and migration

Migration is additive and idempotent:

```sql
CREATE TABLE IF NOT EXISTS ai_consultant_reports (
  id UUID PRIMARY KEY,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  audit_id UUID NOT NULL REFERENCES funnelspy_audits(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL,
  objective VARCHAR(80) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  report_style VARCHAR(30) NOT NULL,
  provider VARCHAR(100),
  model VARCHAR(100),
  prompt_version VARCHAR(100) NOT NULL,
  schema_version VARCHAR(100) NOT NULL,
  context_version VARCHAR(100) NOT NULL,
  opportunity_rules_version VARCHAR(100),
  audit_schema_version VARCHAR(100),
  scoring_version VARCHAR(100),
  request JSONB NOT NULL,
  context_summary JSONB NOT NULL,
  report JSONB,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_code VARCHAR(100),
  error_message TEXT,
  usage_metadata JSONB,
  request_fingerprint VARCHAR(64) NOT NULL,
  context_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Indexes cover `(business_id, created_at DESC)`, `(audit_id, created_at DESC)`, `status`, and `(request_fingerprint, created_at DESC)`.

`ON DELETE RESTRICT` was selected so a business or audit with consultant history cannot silently destroy its evidence chain. This is stricter than the audit-to-business legacy `SET NULL` rule and is confined to the new table.

Operational migration was applied and verified. `business_id` is `BIGINT`, `audit_id` is `UUID`, both FKs are `RESTRICT`, and all five indexes including the primary key exist.

Rollback, destructive only to Phase 4 report data:

```sql
DROP TABLE IF EXISTS ai_consultant_reports;
```

## Routes

Created UI:

- `/consultant`
- `/consultant/[id]`
- `/businesses/[id]/consultant`

Created APIs:

- `POST /api/ai-consultant/generate`
- `GET /api/ai-consultant`
- `GET /api/ai-consultant/[id]`
- `GET /api/businesses/[id]/consultant-reports`

Changed integrations:

- `/businesses/[id]`: latest report, status/date, history and explicit generation/audit empty state.
- `/audits/[id]`: separate consultant report history and explicit generation for associated audits.
- Application navigation: AI Consultant module.

Preserved:

- `/api/funnelspy/ai`
- all FunnelSpy audit, compare, history, export, monitor and share routes
- historical audit `report` JSON
- shared FunnelSpy reports
- FunnelSpy scoring and Opportunity Engine rules

## UI behavior

- No page opening generates AI.
- The business consultant page selects an associated persisted audit and deterministic opportunities.
- The generate button is explicit.
- AI content has a visible generated/advisory/evidence-grounded/review label.
- Deterministic opportunities remain in their own section and cards.
- Failed reports show safe explanations.
- Detail pages expose evidence and source metadata.
- “Create Proposal” is disabled and labeled Phase 5.

## Browser checks

Production build was served independently on port 3111 so the pre-existing local
server could not mask the new route manifest.

Desktop at 1280×720:

- `/consultant`: passed, filters and truthful empty state rendered; no overflow.
- `/businesses/15/consultant`: passed, advisory label and persisted-audit requirement rendered; no AI call occurred.
- `/businesses/15`: passed, explicit Generate AI Strategy entry rendered.
- `/audits/[id]`: route rendered a truthful not-found state without starting an audit.
- `/funnelspy`: historical FunnelSpy UI rendered and remained usable; no action was clicked.
- `/consultant/[id]`: route rendered a truthful not-found state for an unknown report.

Mobile at 390×844:

- `/consultant`: passed with `scrollWidth = 390`.
- `/consultant/[id]`: passed with `scrollWidth = 390` and readable failure state.
- `/businesses/15/consultant`: passed with `scrollWidth = 390`, visible advisory label and Run Funnel Audit action.

The responsive override was reset after QA. The operational database had no associated
persisted audit/report available for a completed-report visual check. No synthetic
production record or provider call was created to conceal that limitation; completed
report structure and evidence rendering are covered by the 68-assertion offline suite.

## Tests

`npm run test:phase4` contains 68 offline assertions covering:

- request/objective/style/locale validation;
- rejection of provider/model client fields;
- context assembly and association enforcement;
- selected opportunities and invalid selection;
- evidence catalog uniqueness and provenance;
- schema validation;
- evidence-required recommendations;
- unknown and altered evidence rejection;
- unsupported numeric claim rejection and verified numeric allowance;
- implementation estimate allowance;
- prompt injection handling;
- prompt length and secret exclusion;
- idempotency and regenerate inputs;
- provider timeout/rate-limit/general error sanitization;
- version persistence constants;
- score fixtures unchanged;
- deterministic Opportunity Engine output;
- explicit-only UI;
- no proposal, outreach, funnel or audit execution in the generation route;
- legacy FunnelSpy AI route preserved.

Node emits a non-failing `MODULE_TYPELESS_PACKAGE_JSON` performance warning for direct TypeScript ESM characterization. The package module type was intentionally not changed globally.

## Security review

- No `.env` file was modified.
- No secret is sent to the client or persisted.
- Provider selection and key stay server-side.
- Raw provider and database errors are not returned by new APIs.
- Provider retries and fallback are disabled.
- Prompt input is bounded and sanitized.
- Website content is explicitly untrusted.
- No raw HTML, screenshots, cookies, headers or credentials enter the context.
- No destructive migration is present.

Rate limiting is not added in Phase 4 because the current app lacks a shared authenticated rate-limit identity. The route documents this as a pre-production requirement; the active-request fingerprint mitigates duplicate clicks but is not an abuse-control substitute.

## Known limitations and unresolved risks

- AI generation remains synchronous until the planned jobs phase; a process interruption can leave a `generating` record until the active window expires.
- There is no authentication, authorization or tenant boundary yet; provider usage metadata therefore is not rendered in public UI.
- Business Intelligence persistence mixes verified and legacy business fields. The context excludes legacy revenue/conversion/ad-spend fields but further provenance normalization remains future work.
- No provider fallback is configured.
- Exact numeric matching is deliberately conservative and may reject otherwise reasonable prose.
- The current initializer still supports runtime `CREATE TABLE IF NOT EXISTS`; Phase 4 also supplies an explicit migration, but migration-framework convergence is future work.

## Phase 5 handoff

Phase 5 may read only a user-selected completed consultant report and its linked audit/opportunities. It must preserve evidence references, keep pricing human-controlled, create drafts only, never invent ROI, and never publish or send automatically. Phase 5 has not been implemented.
