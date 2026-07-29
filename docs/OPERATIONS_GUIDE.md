# Operations Guide

Primary signals:

- `/api/observability/health` readiness and database latency.
- Prometheus operation duration/error counts.
- Workflow queue age, running leases, retries and dead-letter jobs.
- Warehouse refresh age/failures and snapshot watermark.
- Open observability alerts.
- PostgreSQL connections, storage, replication and backup age.
- Cache latency/error rate.

Run migrations separately from app rollout. Never allow every replica to migrate at startup. Scale web and workers independently. Reconcile outbox/inbox, Stripe receipts and provider delivery events. Acknowledge alerts only after recording evidence and owner.

Maintenance includes dependency/image scanning, index/query-plan review, retention execution, restore drills, key rotation, failed-job triage and capacity forecasts.
