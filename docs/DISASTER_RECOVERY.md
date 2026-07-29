# Disaster Recovery

Target objectives must be approved per environment; recommended production targets are RPO ≤ 15 minutes and RTO ≤ 4 hours.

Back up PostgreSQL with PITR and daily snapshots, version analytical artifacts, replicate critical object storage and retain Terraform/state securely. Backups are encrypted and access-audited.

Quarterly restore drill:

1. Restore into an isolated account/network.
2. Validate checksums, schema migrations and row counts.
3. Verify tenant isolation and public-token behavior.
4. Run all characterization suites and critical browser journeys.
5. Record achieved RPO/RTO in `platform_backup_records`.
6. Destroy the drill environment securely.

During regional loss, provision from Terraform, restore data, inject rotated secrets, deploy the last approved image, validate privately and update DNS only after approval. Never infer a successful restore from backup-job status alone.
