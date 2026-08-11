# Runbooks

## Database unavailable

Stop mutating traffic, confirm provider status and connection saturation, fail readiness, preserve logs/traces, restore connectivity, verify migrations and reconcile queued jobs. Do not switch to mock storage.

## Queue backlog

Measure oldest job, error class and provider throttling. Scale workers only when the dependency can accept traffic. Retry transient failures; dead-letter permanent policy/validation failures. Never replay without idempotency review.

## Warehouse refresh failed

Read the safe error code and source watermark. Verify operational tables remain unchanged. Fix the analytical query/migration, rerun idempotently and compare fact counts before publishing snapshots.

## Authentication incident

Revoke affected sessions/API keys, rotate signing secrets using the rotation procedure, inspect audit logs, preserve evidence and notify incident response. Avoid logging raw tokens.

## Bad deployment

Stop traffic promotion, return service traffic to the prior healthy slot, keep additive migrations, deploy a forward-compatible application fix and reconcile events/jobs.
