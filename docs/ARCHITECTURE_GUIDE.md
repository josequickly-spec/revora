# Architecture Guide

Revora is a modular monolith with PostgreSQL as the transactional source of truth. Phase 1–7 bounded contexts own their write models. Phase 8 adds read-only intelligence around them:

```text
Operational contexts → warehouse refresh → dimensions/facts → metric snapshots
                                                        ↘ forecasts
                                                         ↘ executive advisors
```

Warehouse refreshes are explicit, tenant-scoped and transactional. They never update operational tables. Facts are append-only and idempotent by source record/version. Dimensions retain validity windows. Dashboards read only metric snapshots. Forecasts require at least three historical observations and carry a non-guarantee disclaimer. Executive AI receives an evidence catalog and cannot invoke commands.

Synchronous HTTP remains appropriate for reads and explicit commands. Durable jobs, schedules, outbox and inbox provide asynchronous boundaries. PostgreSQL, object storage, Redis-compatible cache and OTLP/Prometheus endpoints are replaceable infrastructure adapters.

See the normative root documents for bounded-context ownership, event envelopes, database isolation and AI policies.
