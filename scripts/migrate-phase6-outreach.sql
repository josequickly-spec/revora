CREATE TABLE IF NOT EXISTS outreach_provider_connections (
  id UUID PRIMARY KEY, provider VARCHAR(50) NOT NULL, display_label VARCHAR(150) NOT NULL,
  credential_reference_key VARCHAR(150), verification_status VARCHAR(30) NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outreach_sender_identities (
  id UUID PRIMARY KEY, display_name VARCHAR(200) NOT NULL, from_email VARCHAR(320) NOT NULL,
  reply_to VARCHAR(320) NOT NULL, business_name VARCHAR(200) NOT NULL, physical_address TEXT NOT NULL,
  domain VARCHAR(253) NOT NULL, verification_status VARCHAR(30) NOT NULL,
  provider_connection_id UUID NOT NULL REFERENCES outreach_provider_connections(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY, name VARCHAR(200) NOT NULL, status VARCHAR(30) NOT NULL,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  proposal_id UUID REFERENCES proposal_documents(id) ON DELETE RESTRICT,
  audit_id UUID REFERENCES funnelspy_audits(id) ON DELETE RESTRICT,
  consultant_report_id UUID REFERENCES ai_consultant_reports(id) ON DELETE RESTRICT,
  objective TEXT NOT NULL, sender_identity_id UUID NOT NULL REFERENCES outreach_sender_identities(id) ON DELETE RESTRICT,
  provider_connection_id UUID NOT NULL REFERENCES outreach_provider_connections(id) ON DELETE RESTRICT,
  timezone VARCHAR(100) NOT NULL, sending_window JSONB NOT NULL, daily_limit INTEGER NOT NULL, hourly_limit INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1, sequence_version VARCHAR(100) NOT NULL, content_version INTEGER NOT NULL DEFAULT 1,
  compliance_version VARCHAR(100) NOT NULL, warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_at TIMESTAMPTZ, scheduled_at TIMESTAMPTZ, paused_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outreach_recipients (
  id UUID PRIMARY KEY, campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE RESTRICT,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  contact_id BIGINT NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT, email VARCHAR(320) NOT NULL,
  normalized_email VARCHAR(320) NOT NULL, verification_status VARCHAR(40) NOT NULL, verification_source VARCHAR(200) NOT NULL,
  verification_date TIMESTAMPTZ, provenance VARCHAR(100) NOT NULL, risky_approved BOOLEAN NOT NULL DEFAULT FALSE,
  sequence_state VARCHAR(40) NOT NULL DEFAULT 'candidate', current_step INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ, next_scheduled_at TIMESTAMPTZ, bounce_status VARCHAR(40),
  unsubscribe_status VARCHAR(40), reply_status VARCHAR(40), unsubscribe_token_hash VARCHAR(64) NOT NULL,
  unsubscribe_token_prefix VARCHAR(12) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, normalized_email)
);
CREATE TABLE IF NOT EXISTS outreach_sequence_steps (
  id UUID PRIMARY KEY, campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL, delay_value INTEGER NOT NULL, delay_unit VARCHAR(10) NOT NULL,
  subject_template VARCHAR(200) NOT NULL, body_template TEXT NOT NULL, message_type VARCHAR(40) NOT NULL,
  requires_manual_review BOOLEAN NOT NULL DEFAULT TRUE, enabled BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, position)
);
CREATE TABLE IF NOT EXISTS outbound_messages (
  id UUID PRIMARY KEY, campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES outreach_recipients(id) ON DELETE RESTRICT,
  sequence_step_id UUID NOT NULL REFERENCES outreach_sequence_steps(id) ON DELETE RESTRICT,
  provider_message_id VARCHAR(255), idempotency_key VARCHAR(64) NOT NULL UNIQUE, subject VARCHAR(200) NOT NULL,
  body_html TEXT NOT NULL, body_text TEXT NOT NULL, status VARCHAR(40) NOT NULL,
  content_version INTEGER NOT NULL, scheduled_at TIMESTAMPTZ NOT NULL, queued_at TIMESTAMPTZ, sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ, bounced_at TIMESTAMPTZ, failed_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0, next_attempt_at TIMESTAMPTZ, provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  safe_error_code VARCHAR(100), safe_error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outreach_suppressions (
  id UUID PRIMARY KEY, normalized_email VARCHAR(320) NOT NULL, normalized_email_hash VARCHAR(64) NOT NULL,
  scope VARCHAR(30) NOT NULL, campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE RESTRICT,
  sender_identity_id UUID REFERENCES outreach_sender_identities(id) ON DELETE RESTRICT,
  suppression_type VARCHAR(50) NOT NULL, source VARCHAR(100) NOT NULL, reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outreach_events (
  id UUID PRIMARY KEY, campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE RESTRICT,
  recipient_id UUID REFERENCES outreach_recipients(id) ON DELETE RESTRICT,
  message_id UUID REFERENCES outbound_messages(id) ON DELETE RESTRICT, event_type VARCHAR(60) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outreach_webhook_events (
  id UUID PRIMARY KEY, provider VARCHAR(50) NOT NULL, provider_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(60) NOT NULL, safe_payload JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS outreach_campaigns_business_updated_idx ON outreach_campaigns(business_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS outreach_campaigns_status_schedule_idx ON outreach_campaigns(status,scheduled_at);
CREATE INDEX IF NOT EXISTS outreach_recipients_campaign_state_idx ON outreach_recipients(campaign_id,sequence_state);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_recipients_token_hash_idx ON outreach_recipients(unsubscribe_token_hash);
CREATE INDEX IF NOT EXISTS outbound_messages_queue_idx ON outbound_messages(status,next_attempt_at,scheduled_at);
CREATE INDEX IF NOT EXISTS outreach_suppressions_hash_scope_idx ON outreach_suppressions(normalized_email_hash,scope);
CREATE INDEX IF NOT EXISTS outreach_events_campaign_created_idx ON outreach_events(campaign_id,created_at DESC);
INSERT INTO outreach_provider_connections(id,provider,display_label,verification_status,configuration)
VALUES('00000000-0000-4000-8000-000000000006','dry-run','Dry-run provider','verified','{"liveSending":false}'::jsonb)
ON CONFLICT(id) DO NOTHING;
INSERT INTO outreach_sender_identities(id,display_name,from_email,reply_to,business_name,physical_address,domain,verification_status,provider_connection_id)
VALUES('00000000-0000-4000-8000-000000000016','Revora Review','review@example.invalid','reply@example.invalid','Revora',
'Configure a verified physical address before live delivery','example.invalid','verified','00000000-0000-4000-8000-000000000006')
ON CONFLICT(id) DO NOTHING;
