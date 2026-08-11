# Security and Operations Remediation Report

Date: 2026-07-29

## Scope

This remediation protects the existing Enterprise Intelligence Platform without
changing FunnelSpy scoring or introducing new product flows.

## Completed

- Removed live-looking database and authentication credentials from current
  documentation and added automated repository secret scanning.
- Added authentication and permission enforcement at the application proxy for
  private pages and APIs.
- Quarantined legacy global business data behind a single authenticated
  organization owner until it can be migrated to row-level tenancy.
- Added request-size, CSRF and endpoint-class rate limits. Redis/Upstash is used
  for distributed production limits; readiness fails when production Redis is
  unavailable.
- Added nonce-based Content Security Policy headers.
- Added signature and replay validation for Resend, Meta, Google Ads and
  analytics webhooks.
- Made FunnelSpy monitor execution fail closed when `CRON_SECRET` is absent.
- Hardened public funnel lead validation and added a honeypot field.
- Made readiness depend on live PostgreSQL, authentication configuration and
  production Redis.
- Added deterministic workflow schedule enqueueing, warehouse retention
  execution and a signed Kubernetes maintenance worker.
- Updated vulnerable transitive dependencies; `npm audit` reports zero known
  vulnerabilities.
- Expanded CI with dependency audit, secret scan, security characterization,
  Kubernetes rendering, Terraform validation and container build.
- Replaced stale deployment and environment documentation with the current
  architecture and required variables.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test:phase2`: 18 assertions passed.
- `npm run test:phase3`: 36 assertions passed.
- `npm run test:phase4`: 68 assertions passed.
- `npm run test:phase5`: 67 assertions passed.
- `npm run test:phase6`: 96 assertions passed.
- `npm run test:phase7`: 74 assertions passed.
- `npm run test:phase8`: 106 assertions passed.
- `npm run test:security`: 17 assertions passed.
- `npm run scan:secrets`: passed.
- `npm audit`: zero vulnerabilities.
- `npm run init`: passed.
- `npm run build`: passed; 89 static pages generated.
- `docker compose config --quiet`: passed.
- `kubectl kustomize infrastructure/kubernetes/base`: passed.
- `git diff --check`: passed.

The characterization scripts emit a Node 25 module-format performance warning;
CI uses the supported Node 22 runtime.

## Required External Incident Actions

The repository history previously contained credentials. Removing them from the
current tree does not invalidate copies already cloned or cached.

Before production promotion, an authorized administrator must:

1. Revoke and rotate the exposed database and authentication credentials at
   their providers.
2. Update deployment secrets without committing them.
3. Purge the affected values from Git history and force-push only through an
   approved incident procedure.
4. Invalidate outstanding sessions and review provider audit logs.

These actions are intentionally not automated by this patch because they affect
external accounts and shared Git history.

## Remaining Architectural Limitation

Legacy business, audit, proposal and opportunity tables are not yet fully
tenant-keyed. The remediation prevents cross-organization access by assigning
that legacy dataset to one organization. Supporting multiple organizations on
those legacy modules requires an explicit data migration that adds organization
ownership to every row, backfills it, verifies it and then enables database
row-level policies. Do not bypass the dataset-owner guard before that migration.
