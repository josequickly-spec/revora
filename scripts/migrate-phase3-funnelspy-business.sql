-- Phase 3 additive operational PostgreSQL migration.
ALTER TABLE funnelspy_audits
  ADD COLUMN IF NOT EXISTS business_id BIGINT
  REFERENCES businesses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS funnelspy_audits_business_created_idx
  ON funnelspy_audits(business_id, created_at DESC);

ALTER TABLE funnelspy_monitors
  ADD COLUMN IF NOT EXISTS business_id BIGINT
  REFERENCES businesses(id) ON DELETE SET NULL;

-- Rollback (manual, only if Phase 3 must be reverted):
-- DROP INDEX IF EXISTS funnelspy_audits_business_created_idx;
-- ALTER TABLE funnelspy_audits DROP COLUMN IF EXISTS business_id;
-- ALTER TABLE funnelspy_monitors DROP COLUMN IF EXISTS business_id;
