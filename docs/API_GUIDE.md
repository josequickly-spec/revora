# API Guide

Phase 8 endpoints:

- `GET /api/executive/{executive|sales|marketing|operations|security}?granularity=monthly`
- `GET /api/executive/forecasts`
- `GET|POST /api/executive/advisors`
- `POST /api/warehouse/refresh`
- `GET /api/observability/health`
- `GET /api/observability/metrics`
- `GET /api/observability/alerts`

Private routes accept a Phase 7 JWT cookie/Bearer token or scoped API key and enforce RBAC. Metrics require `Authorization: Bearer $METRICS_BEARER_TOKEN`. Health is intentionally public and returns only safe dependency states.

State-changing cookie requests require a same-origin `Origin` header. Errors use `{error, code}` and never return provider credentials or raw tokens. Dashboard results expose snapshot period, calculation time, source watermark and evidence references. Empty sources return empty/unavailable states, never substitute figures.

The Phase 7 OpenAPI document remains at `/api/openapi`; Phase 8 paths are described in `PHASE_8_REPORT.md` until the next versioned OpenAPI publication.
