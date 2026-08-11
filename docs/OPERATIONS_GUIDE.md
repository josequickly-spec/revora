# Operations Guide

Primary signals:

- `/api/observability/health` readiness and database latency.
- Production readiness requires PostgreSQL, authentication secrets and Redis.
- API throttling uses Redis when configured; if Redis is unavailable, production
  readiness fails so traffic is not admitted with only a process-local limiter.
- Prometheus operation duration/error counts.
- Workflow queue age, running leases, retries and dead-letter jobs.
- Warehouse refresh age/failures and snapshot watermark.
- Open observability alerts.
- PostgreSQL connections, storage, replication and backup age.
- Cache latency/error rate.

Run migrations separately from app rollout. Never allow every replica to migrate at startup. Scale web and workers independently. Reconcile outbox/inbox, Stripe receipts and provider delivery events. Acknowledge alerts only after recording evidence and owner.

Maintenance includes dependency/image scanning, index/query-plan review, retention execution, restore drills, key rotation, failed-job triage and capacity forecasts.

The Kubernetes `revora-maintenance` CronJob calls the authenticated maintenance
worker every five minutes. It enqueues due schedules and applies warehouse
retention transactionally. Monitor CronJob failures, disabled invalid schedules,
queue age and deleted-row counts.

Readiness is successful only when PostgreSQL responds and the JWT/encryption
secrets are configured. Optional integrations are reported separately and must
have their own alerts when enabled.
