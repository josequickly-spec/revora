# Phase 8 — Enterprise Intelligence Platform

## Final outcome

Phase 8 adds a production-facing intelligence and operations layer around the stable Phase 1–7 bounded contexts. No existing business module changes ownership, scoring or lifecycle behavior.

Starting commit: `a76a6df1322fa80cdd2fc530a4c934746c8678db`.

## Final architecture

```text
Executive dashboards ─┬─ warehouse metric snapshots
Forecast engine ──────┤
AI Executive ─────────┘ evidence IDs only
          ↑
Dimensions + append-only facts + refresh runs
          ↑ read-only extraction
Business / FunnelSpy / Opportunity / Consultant / Proposal / Outreach
CRM / Identity / Billing / Workflow

Cross-cutting: cache · metrics · traces · logs · security · infrastructure
```

Operational contexts remain authoritative. Warehouse refresh code contains no update/delete statement targeting operational tables. CRM stage changes remain explicit Phase 7 commands; Executive AI cannot invoke them.

## Module inventory

Stable business/operations modules:

- Lead Finder and Business Intelligence.
- FunnelSpy.
- Opportunity Engine.
- AI Consultant.
- Proposal Builder.
- Outreach.
- CRM.
- Identity/organizations/RBAC.
- Billing.
- Workflow engine.

Phase 8 modules:

- `src/lib/warehouse`: aggregations, dimensions, facts, metrics, snapshots and retention.
- `src/lib/forecast`: deterministic historical forecasting.
- `src/lib/executive-ai`: evidence assembly, structured provider, validation and persistence.
- `src/lib/cache`: Redis/Upstash/query cache.
- `src/lib/observability`: health, Prometheus metrics, structured logs and OTLP export.
- Executive analytics APIs and UI.
- Reproducible infrastructure and operations documentation.

## Data warehouse schema

Additive migration: `scripts/migrate-phase8-intelligence.sql`.

Dimensions:

- `warehouse_dim_business`
- `warehouse_dim_date`
- `warehouse_dim_user`
- `warehouse_dim_plan`
- `warehouse_dim_pipeline`
- `warehouse_dim_campaign`
- `warehouse_dim_region`
- `warehouse_dim_industry`

Facts:

- `warehouse_fact_business`
- `warehouse_fact_opportunity`
- `warehouse_fact_proposal`
- `warehouse_fact_outreach`
- `warehouse_fact_crm`
- `warehouse_fact_revenue`
- `warehouse_fact_user`
- `warehouse_fact_workflow`

Supporting tables:

- `warehouse_refresh_runs`
- `warehouse_metric_snapshots`
- `warehouse_forecasts`
- `executive_ai_runs`
- `executive_ai_recommendations`
- `observability_alerts`
- `platform_backup_records`
- `security_rotation_records`

Date and fact keys support daily, weekly, monthly, quarterly and yearly snapshots. Facts deduplicate by organization plus source record/version. Slowly changing dimensions retain validity windows. Analytical indexes cover tenant/date, stage/status and latest snapshot access.

Refresh is explicit, tenant-scoped and transactional:

```text
BEGIN
→ refresh date/SCD dimensions
→ append missing fact versions
→ calculate five granularities
→ record source watermark and counts
COMMIT
```

A failure rolls back analytical changes and records a safe failed run. It never falls back to mock metrics.

## Dashboard catalog

Routes:

- `/executive`
- `/analytics/sales`
- `/analytics/marketing`
- `/analytics/operations`
- `/analytics/security`
- `/executive/advisors`

Executive: revenue, growth, MRR, ARR, USD pipeline, conversion, customers, churn and retention.

Sales: opportunities, win rate, average USD deal and weighted forecast.

Marketing: linked leads, FunnelSpy audit count and sent/delivered campaign messages. SEO, reviews and traffic remain explicitly unavailable until authoritative providers are connected.

Operations: jobs, success rate, retries, failures and average latency.

Security: users, active sessions, verified MFA factors, API keys, OAuth identities and denied actions.

Every card comes from a warehouse snapshot and includes evidence count, period and refresh timestamp. Empty warehouses show an explicit empty state.

## Forecast engine

Forecast families:

- Revenue.
- Pipeline.
- Growth.
- Capacity.
- Usage.

`linear_trend_v1` requires at least three historical monthly points. It records estimate, residual-based lower/upper bounds, sample size, unit, exact evidence and source watermark. Insufficient history produces no forecast.

Every forecast stores: “Estimate based on historical data. It is not a guarantee of future results.”

## AI Executive

Advisors:

- Business.
- Revenue.
- Sales.
- Marketing.
- Operations.
- Security.
- Growth.

Generation is explicit and permission-controlled. The provider receives only warehouse evidence with stable `evidenceId` values. Structured output validation rejects unknown references and recommendations without evidence. Runs preserve the evidence catalog/hash, versions, summary, limitations, provider/model metadata and safe failures.

AI Executive can recommend, prioritize and explain risks. It cannot call CRM stage, workflow, billing, outreach, proposal or operational mutation endpoints.

Required provider configuration: `OPENAI_API_KEY`; optional model override: `OPENAI_EXECUTIVE_MODEL`.

## API routes

- `GET /api/executive/[dashboard]`
- `GET /api/executive/forecasts`
- `GET|POST /api/executive/advisors`
- `POST /api/warehouse/refresh`
- `GET /api/observability/health`
- `GET /api/observability/metrics`
- `GET /api/observability/alerts`

Dashboard APIs enforce the relevant Phase 7 permission. Warehouse refresh and advisor generation require workflow-management permission. Metrics require a dedicated Bearer token. Health reveals safe dependency status only.

## Observability

- Prometheus text endpoint and operation counters/duration summaries.
- OTLP/HTTP trace export with correlation-safe span IDs.
- JSON structured logging with sensitive-key removal.
- Database readiness plus cache/provider configuration states.
- Tenant-scoped alert persistence.
- Prometheus, Grafana datasource and OpenTelemetry Collector configuration.

Required observability environment:

- `METRICS_BEARER_TOKEN`
- `OTEL_EXPORTER_OTLP_ENDPOINT`
- optional `OTEL_EXPORTER_OTLP_HEADERS`

## Performance

- Existing PostgreSQL connection pool remains the database access boundary.
- Dashboard query cache supports `REDIS_URL` or Upstash REST.
- Development alone may use bounded in-memory cache; production without Redis disables cache.
- Cache keys include organization, dashboard and granularity.
- Refresh invalidates dashboard keys using cursor-based Redis `SCAN`, not blocking `KEYS`.
- Next.js compression and standalone output enabled.
- Authenticated dashboard responses are private and vary by authorization/cookie.
- Immutable Next.js assets are CDN-ready.
- UI dashboards load client-side with explicit loading/empty states.
- Warehouse indexes isolate analytical access from operational query patterns.

## Security hardening

- CSP, HSTS in production, frame denial, MIME protection, restrictive permissions/referrer/cross-origin policies.
- Same-origin Origin validation for cookie-authenticated mutations.
- Per-process rate limiting for authentication/API traffic.
- Two-megabyte API request-body limit.
- Request IDs and WAF-ready marker.
- Metrics endpoint secret.
- Read-only/non-root container and dropped Linux capabilities.
- KMS-backed infrastructure encryption, encrypted PostgreSQL/Redis and private subnets.
- Rotation/backup evidence tables and complete pen-test checklist.

The in-process rate limiter is defense in depth. Production must additionally enforce distributed rate limiting and a managed WAF at ingress/CDN.

## Infrastructure

- Multi-stage `Dockerfile`.
- `docker-compose.yml` with PostgreSQL, Redis, app, migration profile, Prometheus and Grafana.
- Kubernetes Deployment, Service, Ingress, HPA, PDB and migration Job.
- Canary and blue/green overlays.
- Terraform for KMS, Secrets Manager, RDS PostgreSQL, ElastiCache Redis, encrypted backup bucket, CloudWatch, ECS cluster/task/service.
- GitHub Actions validation and manually gated production publication/deployment handoff.

Images use immutable commit tags in CI. Example image/domain placeholders must be replaced before deployment. Secrets are injected out-of-band and never committed.

## Documentation

- `docs/ARCHITECTURE_GUIDE.md`
- `docs/API_GUIDE.md`
- `docs/DEVELOPER_GUIDE.md`
- `docs/ADMINISTRATOR_GUIDE.md`
- `docs/SECURITY_GUIDE.md`
- `docs/DEPLOYMENT_GUIDE.md`
- `docs/OPERATIONS_GUIDE.md`
- `docs/RUNBOOKS.md`
- `docs/INCIDENT_RESPONSE.md`
- `docs/DISASTER_RECOVERY.md`

## Migration and rollback

`npm run init` applies the Phase 8 migration after Phase 7. Reapplication is idempotent.

Rollback is destructive to analytics history and requires backup plus explicit approval. Drop in reverse dependency order:

1. Executive recommendations and runs.
2. Forecasts, metric snapshots and observability/backup/rotation records.
3. Fact tables.
4. Dimension tables.
5. Refresh runs.

Never drop or mutate Phase 1–7 operational tables during rollback. Prefer a forward application rollback that stops readers while retaining warehouse evidence.

## Validation

Final execution results:

- `npm run init`: passed twice, proving the additive migration is idempotent.
- `npm run lint`: passed.
- `npm run typecheck`: passed. An initial run encountered stale/corrupt generated `.next/dev/types`; after isolating that ignored build artifact, the unchanged source passed.
- `npm run build`: passed and generated 88 pages.
- `npm run test:phase2`: 18 assertions passed.
- `npm run test:phase3`: 36 assertions passed.
- `npm run test:phase4`: 68 assertions passed.
- `npm run test:phase5`: 67 assertions passed.
- `npm run test:phase6`: 96 assertions passed.
- `npm run test:phase7`: 74 assertions passed.
- `npm run test:phase8`: 106 assertions passed.
- Total characterization assertions: 465 passed.
- Database inspection: 24 Phase 8 tables and 54 analytical indexes present; no synthetic refresh, snapshot, forecast or AI rows were inserted.
- Production HTTP validation: health returned `200`; `/executive` returned `200` with CSP; protected Executive and metrics APIs returned `401` without authentication.
- Browser validation: Executive and Operations dashboards rendered their authenticated empty/error boundary without console warnings or errors.
- `docker compose config --quiet`: passed.
- `git diff --check`: passed.
- Kubernetes cluster dry-run and Docker image build were unavailable because the local Docker Desktop Kubernetes/API and Linux engine were stopped.

The characterization suites emit the pre-existing Node
`MODULE_TYPELESS_PACKAGE_JSON` performance warning because the package does not
declare a module type. It does not fail assertions, lint, type checking or the
production build; changing the package module mode is outside this phase.

## Known limitations

- External OpenAI, OTLP, Stripe, OAuth, Resend, Redis cloud and deployment providers were not called without real approved credentials.
- Historical MRR/ARR/churn accuracy begins when subscription facts/snapshots are collected; earlier operational history cannot be invented.
- Marketing SEO/reviews/traffic remain unavailable until authoritative connectors are added.
- Forecasts require three periods and may therefore be unavailable in new organizations.
- Prometheus process-local counters reset on replica restart; long-term state belongs in Prometheus.
- The proxy rate limiter is replica-local; ingress/CDN must provide distributed limits.
- CSP retains inline script/style compatibility required by the current Next.js rendering; nonce-based CSP is a future hardening step.
- Terraform requires reviewed remote backend parameters and existing network/ALB inputs.
- Kubernetes client dry-run could not contact the stopped local Docker Kubernetes cluster; CI/static checks cover manifest presence, and cluster-side validation remains a deployment gate.
- Docker Compose configuration is validated, but the local Docker engine was not running for an image build.
