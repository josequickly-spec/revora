# Deployment Guide

Never deploy directly from a developer `.env`.

1. Create PostgreSQL, cache, secret manager, backup bucket, observability and network resources.
2. Store all required environment variables in the platform secret manager.
3. Build the immutable Docker image and scan it.
4. Run the migration image as a one-off job. Verify `npm run init` twice.
5. Deploy canary or inactive blue/green slot.
6. Verify health, metrics, login, one private 401 check and a tenant-scoped read.
7. Shift limited traffic, observe, then promote.
8. Keep the prior image and database forward-mitigation plan.

Kubernetes manifests are under `infrastructure/kubernetes`; AWS resources are under `infrastructure/terraform`. Replace example domains/images and create `revora-secrets` out-of-band. Terraform state must use an encrypted, locked remote backend.

Required production configuration includes database, authentication/encryption, worker, metrics, Stripe/OAuth/email as enabled, cache and OTLP endpoints. CDN may cache immutable `/_next/static` assets only; authenticated API responses remain private.
