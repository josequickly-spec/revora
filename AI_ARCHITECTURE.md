# Revora Enterprise SaaS — AI Architecture

Status: **Normative**

## 1. Purpose

AI in Revora interprets verified intelligence and produces structured consulting artifacts. It must not become the source of truth for public business facts, performance measurements, contact verification, delivery outcomes, or revenue.

## 2. AI boundary

All model calls are owned by AI Consulting. Other contexts submit typed AI tasks and receive versioned structured artifacts.

Direct OpenAI, Anthropic, Gemini, or future provider calls outside registered AI adapters are prohibited after migration.

## 3. AI task taxonomy

| Task | Inputs | Output |
|---|---|---|
| Consultant report | Audit, opportunities, business profile | Structured strategic report |
| Funnel content | Approved strategy and brand context | Versioned localized funnel draft |
| Outreach sequence | Proposal, contact role, evidence | Draft email/video sequence |
| Proposal narrative | Opportunities and pricing model | Proposal draft |
| Ad creative | Approved offer and audience | Reviewable ad draft |
| Classification | Normalized evidence | Bounded taxonomy label |
| Summarization | Selected source artifacts | Cited summary |

Deterministic calculations, contact verification, scores, metrics, and authorization are not AI tasks.

## 4. Orchestration model

An AI workflow contains versioned steps:

```text
Validate task
→ Resolve authorized context
→ Assemble evidence pack
→ Apply data minimization
→ Select workflow/model policy
→ Execute structured generation
→ Validate schema
→ Verify grounding and policy
→ Evaluate quality
→ Persist artifact and usage
→ Publish completion event
```

Each step is independently observable and retryable when safe.

## 5. Evidence packs

AI receives a bounded evidence pack, not unrestricted database access.

An evidence item includes:

- Evidence ID.
- Source type and owner.
- Immutable source version.
- Observation timestamp.
- Provider/source attribution.
- Confidence.
- Allowed-use classification.
- Redacted content or object-storage reference.

Generated claims reference evidence IDs. Statements without support are marked as inference or recommendation.

## 6. Workflow registry

Every production AI workflow declares:

- Workflow ID and semantic version.
- Owning product capability.
- Input and output schemas.
- System and task prompt versions.
- Model capability requirements.
- Allowed providers/models.
- Temperature and token limits.
- Tool permissions.
- Data classification.
- Evaluation suite.
- Human-approval requirements.
- Cost and latency budget.
- Fallback policy.

Prompt changes are versioned releases and do not overwrite historical workflow definitions.

## 7. Model routing

Routing considers:

- Required reasoning and structured-output capability.
- Language.
- Context size.
- Tenant policy and region.
- Data sensitivity.
- Current provider health.
- Cost and latency budget.
- Evaluation performance.

Fallback is allowed only when the fallback model has passed the workflow's evaluation threshold. Provider fallback never silently weakens data policy.

## 8. Structured outputs

- Every production artifact uses a schema.
- Model output is parsed and validated.
- Repair attempts are bounded and recorded.
- Invalid output ends in an explicit failed state.
- Free-form prose is stored inside a structured envelope.
- Consumers never parse undocumented text patterns.

## 9. Tool use

AI tools are narrow capabilities:

- Fetch a specific authorized evidence item.
- Request a deterministic calculation.
- Request a read-only projection.
- Produce a draft artifact.

The model cannot:

- Execute arbitrary SQL.
- Access secrets.
- Send email.
- Publish a funnel.
- Approve a proposal.
- Change CRM stages.
- Trigger destructive actions.

Mutating actions require a separately authorized application command and, where appropriate, human approval.

## 10. Human approval

Mandatory approval gates:

- Publishing funnels or ads.
- Sending first-contact outreach.
- Approving proposals.
- Using sensitive or licensed data.
- High-cost batch AI runs.
- Actions with legal or reputational impact.

Generation success is never equivalent to approval.

## 11. Safety and privacy

- Minimize personal data in prompts.
- Redact credentials, access tokens, and unrelated contact data.
- Apply tenant-specific provider/data residency policies.
- Defend against prompt injection in crawled websites by treating site content as untrusted evidence.
- Never allow crawled instructions to redefine the system task or tools.
- Separate user instructions from retrieved content.
- Record safety decisions without persisting unnecessary sensitive content.

## 12. Hallucination controls

- Prefer deterministic extraction before AI interpretation.
- Require citations to evidence IDs for material claims.
- Store observed fact, inferred conclusion, and recommendation separately.
- Reject invented contact details, metrics, competitor facts, or performance values.
- Surface missing data explicitly.
- Compare numerical claims to deterministic calculators.

## 13. Evaluation

Every workflow requires:

- Golden examples.
- Schema-validity rate.
- Grounding/citation accuracy.
- Unsupported-claim rate.
- Language and tone checks.
- Safety and injection tests.
- Regression comparisons across prompt/model versions.
- Cost and latency distributions.

Production rollout uses shadow, canary, or tenant opt-in strategies. A model or prompt does not become default solely because it is newer.

## 14. AI observability and cost

Record per run:

- Tenant, workflow, model, provider, and versions.
- Input/output token usage.
- Cached token usage where available.
- Latency and retries.
- Estimated and reconciled cost.
- Schema and evaluation outcomes.
- Evidence IDs, not raw secrets.
- Human approval/rejection.

Quotas are enforced before execution and reconciled afterward in a usage ledger.

## 15. Caching and reproducibility

- Cache only when tenant, workflow version, evidence hash, locale, and policy match.
- Do not share tenant-private outputs across tenants.
- Store normalized input hash and model configuration.
- Preserve enough metadata to explain how an artifact was produced.
- Re-running with a newer model creates a new version; it does not rewrite history.

## 16. Existing AI migration

Current model calls are distributed among FunnelSpy, campaign auto-generation, funnel generation, outreach, and ads.

Migration order:

1. Inventory each call and its schema.
2. Register current prompts as versioned workflows.
3. Wrap current providers in adapters without changing output behavior.
4. Route calls through durable AI jobs.
5. Add evidence packs, usage records, evaluation, and approval policies.
6. Remove direct provider access only after compatibility validation.

## 17. AI plugin interface

AI provider plugins implement:

- Capability declaration.
- Model discovery and health.
- Structured generation.
- Streaming where supported.
- Usage normalization.
- Error classification.
- Data residency and retention metadata.
- Cancellation semantics.

Domain workflows remain provider-neutral. Provider-specific options stay inside adapter configuration.
