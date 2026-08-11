BEGIN;

CREATE TABLE IF NOT EXISTS proposal_documents (
  id UUID PRIMARY KEY,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  audit_id UUID NOT NULL REFERENCES funnelspy_audits(id) ON DELETE RESTRICT,
  consultant_report_id UUID REFERENCES ai_consultant_reports(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  proposal_type VARCHAR(80) NOT NULL,
  status VARCHAR(30) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  current_version INTEGER NOT NULL,
  published_version INTEGER,
  public_token_hash VARCHAR(64),
  public_token_prefix VARCHAR(12),
  public_token_created_at TIMESTAMPTZ,
  public_expires_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS proposal_versions (
  id UUID PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES proposal_documents(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL,
  content_schema_version VARCHAR(100) NOT NULL,
  template_version VARCHAR(100) NOT NULL,
  evidence_snapshot JSONB NOT NULL,
  content JSONB NOT NULL,
  pricing JSONB NOT NULL,
  terms JSONB NOT NULL,
  internal_notes TEXT NOT NULL DEFAULT '',
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(proposal_id, version)
);
CREATE TABLE IF NOT EXISTS proposal_events (
  id UUID PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES proposal_documents(id) ON DELETE RESTRICT,
  event_type VARCHAR(50) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS proposal_documents_business_updated_idx ON proposal_documents(business_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS proposal_documents_audit_updated_idx ON proposal_documents(audit_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS proposal_documents_status_updated_idx ON proposal_documents(status, updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS proposal_documents_public_token_hash_idx ON proposal_documents(public_token_hash) WHERE public_token_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS proposal_versions_proposal_version_idx ON proposal_versions(proposal_id, version DESC);
CREATE INDEX IF NOT EXISTS proposal_events_proposal_created_idx ON proposal_events(proposal_id, created_at DESC);

COMMIT;

-- Manual rollback (destructive only to Phase 5 proposal documents):
-- DROP TABLE IF EXISTS proposal_events;
-- DROP TABLE IF EXISTS proposal_versions;
-- DROP TABLE IF EXISTS proposal_documents;
