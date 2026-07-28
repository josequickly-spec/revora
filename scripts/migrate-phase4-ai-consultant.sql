BEGIN;

CREATE TABLE IF NOT EXISTS ai_consultant_reports (
  id UUID PRIMARY KEY,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  audit_id UUID NOT NULL REFERENCES funnelspy_audits(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL,
  objective VARCHAR(80) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  report_style VARCHAR(30) NOT NULL,
  provider VARCHAR(100),
  model VARCHAR(100),
  prompt_version VARCHAR(100) NOT NULL,
  schema_version VARCHAR(100) NOT NULL,
  context_version VARCHAR(100) NOT NULL,
  opportunity_rules_version VARCHAR(100),
  audit_schema_version VARCHAR(100),
  scoring_version VARCHAR(100),
  request JSONB NOT NULL,
  context_summary JSONB NOT NULL,
  report JSONB,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_code VARCHAR(100),
  error_message TEXT,
  usage_metadata JSONB,
  request_fingerprint VARCHAR(64) NOT NULL,
  context_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_consultant_reports_business_created_idx
  ON ai_consultant_reports(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_consultant_reports_audit_created_idx
  ON ai_consultant_reports(audit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_consultant_reports_status_idx
  ON ai_consultant_reports(status);
CREATE INDEX IF NOT EXISTS ai_consultant_reports_fingerprint_active_idx
  ON ai_consultant_reports(request_fingerprint, created_at DESC);

COMMIT;

-- Rollback (manual, destructive to Phase 4 reports only):
-- DROP TABLE IF EXISTS ai_consultant_reports;
