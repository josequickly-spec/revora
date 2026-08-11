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
  timezone VARCHAR(100) NOT NULL, sending_window JSONB NOT NULL, daily_limit INTEGER NOT NULL,
  hourly_limit INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1, sequence_version VARCHAR(100) NOT NULL, content_version INTEGER NOT NULL DEFAULT 1,
  compliance_version VARCHAR(100) NOT NULL, warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  approved_at TIMESTAMPTZ, scheduled_at TIMESTAMPTZ, paused_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ, archived_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE outreach_campaigns ADD COLUMN IF NOT EXISTS video_pitch JSONB;
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
ALTER TABLE outreach_sequence_steps ADD COLUMN IF NOT EXISTS selected_insights JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE outreach_sequence_steps ADD COLUMN IF NOT EXISTS subject_options JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE outreach_sequence_steps ADD COLUMN IF NOT EXISTS generation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE outreach_sequence_steps ADD COLUMN IF NOT EXISTS confidence INTEGER;
CREATE TABLE IF NOT EXISTS outbound_messages (
  id UUID PRIMARY KEY, campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES outreach_recipients(id) ON DELETE RESTRICT,
  sequence_step_id UUID NOT NULL REFERENCES outreach_sequence_steps(id) ON DELETE RESTRICT,
  provider_message_id VARCHAR(255), idempotency_key VARCHAR(64) NOT NULL UNIQUE, subject VARCHAR(200) NOT NULL,
  body_html TEXT NOT NULL, body_text TEXT NOT NULL, status VARCHAR(40) NOT NULL,
  content_version INTEGER NOT NULL, scheduled_at TIMESTAMPTZ NOT NULL, queued_at TIMESTAMPTZ, sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ, bounced_at TIMESTAMPTZ, failed_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ,
  attempt_count INTEGER NOT NULL DEFAULT 0, next_attempt_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ, locked_by VARCHAR(200), lease_expires_at TIMESTAMPTZ,
  provider_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  safe_error_code VARCHAR(100), safe_error_message TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS outreach_suppressions (
  id UUID PRIMARY KEY, normalized_email VARCHAR(320) NOT NULL, normalized_email_hash VARCHAR(64) NOT NULL,
  scope VARCHAR(30) NOT NULL, campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE RESTRICT,
  sender_identity_id UUID REFERENCES outreach_sender_identities(id) ON DELETE RESTRICT,
  suppression_type VARCHAR(50) NOT NULL, source VARCHAR(100) NOT NULL, reason TEXT NOT NULL, released_at TIMESTAMPTZ,
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
  provider_message_id VARCHAR(255), message_id UUID REFERENCES outbound_messages(id) ON DELETE RESTRICT,
  event_type VARCHAR(60) NOT NULL, provider_occurred_at TIMESTAMPTZ, processed_at TIMESTAMPTZ,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'pending', safe_error_code VARCHAR(100),
  safe_payload JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider, provider_event_id)
);
CREATE TABLE IF NOT EXISTS outreach_delivery_attempts (
  id UUID PRIMARY KEY, message_id UUID NOT NULL REFERENCES outbound_messages(id) ON DELETE RESTRICT,
  attempt_number INTEGER NOT NULL CHECK(attempt_number>0), provider VARCHAR(50) NOT NULL, status VARCHAR(40) NOT NULL,
  provider_request_id VARCHAR(255), safe_error_code VARCHAR(100), safe_error_message TEXT,
  latency_ms INTEGER CHECK(latency_ms>=0), started_at TIMESTAMPTZ NOT NULL, completed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ, metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(message_id,attempt_number)
);

-- Existing Phase 6 installations must receive additive columns before indexes
-- and constraints reference them.
ALTER TABLE outbound_messages ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE outbound_messages ADD COLUMN IF NOT EXISTS locked_by VARCHAR(200);
ALTER TABLE outbound_messages ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ;
ALTER TABLE outreach_suppressions ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;
ALTER TABLE outreach_webhook_events ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255);
ALTER TABLE outreach_webhook_events ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES outbound_messages(id) ON DELETE RESTRICT;
ALTER TABLE outreach_webhook_events ADD COLUMN IF NOT EXISTS provider_occurred_at TIMESTAMPTZ;
ALTER TABLE outreach_webhook_events ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE outreach_webhook_events ADD COLUMN IF NOT EXISTS processing_status VARCHAR(30) NOT NULL DEFAULT 'pending';
ALTER TABLE outreach_webhook_events ADD COLUMN IF NOT EXISTS safe_error_code VARCHAR(100);

CREATE INDEX IF NOT EXISTS outreach_campaigns_business_updated_idx ON outreach_campaigns(business_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS outreach_campaigns_status_schedule_idx ON outreach_campaigns(status,scheduled_at);
CREATE INDEX IF NOT EXISTS outreach_recipients_campaign_state_idx ON outreach_recipients(campaign_id,sequence_state);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_recipients_token_hash_idx ON outreach_recipients(unsubscribe_token_hash);
CREATE INDEX IF NOT EXISTS outbound_messages_queue_idx ON outbound_messages(status,next_attempt_at,scheduled_at);
CREATE INDEX IF NOT EXISTS outbound_messages_provider_message_idx ON outbound_messages(provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_recipients_status_idx ON outreach_recipients(campaign_id,sequence_state,verification_status);
CREATE INDEX IF NOT EXISTS outreach_suppressions_hash_scope_idx ON outreach_suppressions(normalized_email_hash,scope);
CREATE UNIQUE INDEX IF NOT EXISTS outreach_suppressions_active_unique_idx ON outreach_suppressions(
  normalized_email_hash,scope,COALESCE(campaign_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(sender_identity_id,'00000000-0000-0000-0000-000000000000'::uuid),suppression_type
) WHERE released_at IS NULL;
CREATE INDEX IF NOT EXISTS outreach_events_campaign_created_idx ON outreach_events(campaign_id,created_at DESC);
CREATE INDEX IF NOT EXISTS outreach_delivery_attempts_message_started_idx ON outreach_delivery_attempts(message_id,started_at DESC);
CREATE INDEX IF NOT EXISTS outreach_delivery_attempts_retry_idx ON outreach_delivery_attempts(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_webhook_provider_message_idx ON outreach_webhook_events(provider,provider_message_id) WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_webhook_message_idx ON outreach_webhook_events(message_id) WHERE message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS outreach_webhook_processing_idx ON outreach_webhook_events(processing_status,created_at);

DO $$ BEGIN
  ALTER TABLE outreach_campaigns ADD CONSTRAINT outreach_campaigns_status_check CHECK(status IN ('draft','review_required','approved','scheduled','running','paused','completed','cancelled','failed','archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE outreach_campaigns ADD CONSTRAINT outreach_campaigns_limits_check CHECK(daily_limit>0 AND hourly_limit>0 AND hourly_limit<=daily_limit);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE outreach_recipients ADD CONSTRAINT outreach_recipients_verification_check CHECK(verification_status IN ('unverified','syntax_valid','domain_valid','provider_verified','provider_risky','invalid','unknown'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE outbound_messages ADD CONSTRAINT outbound_messages_status_check CHECK(status IN ('scheduled','queued','sending','sent','delivered','deferred','failed','bounced','cancelled','suppressed','unknown'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE outbound_messages ADD CONSTRAINT outbound_messages_attempt_count_check CHECK(attempt_count>=0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE outreach_sequence_steps ADD CONSTRAINT outreach_sequence_steps_delay_check CHECK(delay_unit IN ('hour','day') AND position>=1);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE outreach_webhook_events ADD CONSTRAINT outreach_webhook_events_processing_status_check
    CHECK(processing_status IN ('pending','processing','processed','ignored','failed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE outreach_webhook_events ADD CONSTRAINT outreach_webhook_events_safe_payload_check
    CHECK(
      jsonb_typeof(safe_payload)='object'
      AND safe_payload - ARRAY['type','messageId']::text[] = '{}'::jsonb
      AND jsonb_typeof(COALESCE(safe_payload->'type','null'::jsonb)) IN ('string','null')
      AND jsonb_typeof(COALESCE(safe_payload->'messageId','null'::jsonb)) IN ('string','null')
      AND COALESCE(safe_payload->>'messageId','') !~ '@'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Cross-table invariants cannot be expressed as CHECK constraints.
CREATE OR REPLACE FUNCTION enforce_outreach_campaign_sender_provider()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE sender_provider UUID;
BEGIN
  SELECT provider_connection_id INTO sender_provider
  FROM outreach_sender_identities
  WHERE id=NEW.sender_identity_id;
  IF sender_provider IS DISTINCT FROM NEW.provider_connection_id THEN
    RAISE EXCEPTION 'campaign sender identity and provider connection must match'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS outreach_campaign_sender_provider_guard ON outreach_campaigns;
CREATE TRIGGER outreach_campaign_sender_provider_guard
BEFORE INSERT OR UPDATE OF sender_identity_id,provider_connection_id ON outreach_campaigns
FOR EACH ROW EXECUTE FUNCTION enforce_outreach_campaign_sender_provider();

CREATE OR REPLACE FUNCTION freeze_approved_outreach_campaign()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IN ('approved','scheduled','running','paused','completed','cancelled','failed','archived')
     AND (
       NEW.sender_identity_id IS DISTINCT FROM OLD.sender_identity_id
       OR NEW.provider_connection_id IS DISTINCT FROM OLD.provider_connection_id
       OR NEW.compliance_version IS DISTINCT FROM OLD.compliance_version
       OR NEW.sequence_version IS DISTINCT FROM OLD.sequence_version
       OR NEW.content_version IS DISTINCT FROM OLD.content_version
     ) THEN
    RAISE EXCEPTION 'approved outreach campaign content and delivery identity are immutable'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS outreach_campaign_approved_freeze_guard ON outreach_campaigns;
CREATE TRIGGER outreach_campaign_approved_freeze_guard
BEFORE UPDATE ON outreach_campaigns
FOR EACH ROW EXECUTE FUNCTION freeze_approved_outreach_campaign();

CREATE OR REPLACE FUNCTION freeze_outreach_sequence_after_review()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE campaign_status VARCHAR(30);
DECLARE target_campaign_id UUID;
BEGIN
  IF TG_OP='DELETE' THEN
    target_campaign_id:=OLD.campaign_id;
  ELSE
    target_campaign_id:=NEW.campaign_id;
  END IF;
  SELECT status INTO campaign_status
  FROM outreach_campaigns
  WHERE id=target_campaign_id;
  IF campaign_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'outreach sequence is immutable after draft review begins'
      USING ERRCODE='23514';
  END IF;
  IF TG_OP='DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS outreach_sequence_freeze_guard ON outreach_sequence_steps;
CREATE TRIGGER outreach_sequence_freeze_guard
BEFORE INSERT OR UPDATE OR DELETE ON outreach_sequence_steps
FOR EACH ROW EXECUTE FUNCTION freeze_outreach_sequence_after_review();

CREATE OR REPLACE FUNCTION freeze_outbound_message_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.campaign_id IS DISTINCT FROM OLD.campaign_id
     OR NEW.recipient_id IS DISTINCT FROM OLD.recipient_id
     OR NEW.sequence_step_id IS DISTINCT FROM OLD.sequence_step_id
     OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
     OR NEW.subject IS DISTINCT FROM OLD.subject
     OR NEW.body_html IS DISTINCT FROM OLD.body_html
     OR NEW.body_text IS DISTINCT FROM OLD.body_text
     OR NEW.content_version IS DISTINCT FROM OLD.content_version THEN
    RAISE EXCEPTION 'queued outbound message snapshots are immutable'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS outbound_message_snapshot_freeze_guard ON outbound_messages;
CREATE TRIGGER outbound_message_snapshot_freeze_guard
BEFORE UPDATE ON outbound_messages
FOR EACH ROW EXECUTE FUNCTION freeze_outbound_message_snapshot();

CREATE OR REPLACE FUNCTION prevent_unsafe_live_outreach_delivery()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE provider_name VARCHAR(50);
DECLARE sender_verification VARCHAR(30);
DECLARE sender_domain VARCHAR(253);
DECLARE sender_address TEXT;
BEGIN
  IF NEW.status IN ('sending','sent','delivered')
     AND (TG_OP='INSERT' OR NEW.status IS DISTINCT FROM OLD.status) THEN
    SELECT pc.provider,si.verification_status,si.domain,si.physical_address
      INTO provider_name,sender_verification,sender_domain,sender_address
    FROM outreach_campaigns c
    JOIN outreach_provider_connections pc ON pc.id=c.provider_connection_id
    JOIN outreach_sender_identities si ON si.id=c.sender_identity_id
    WHERE c.id=NEW.campaign_id;
    IF provider_name='dry-run'
       OR sender_verification IS DISTINCT FROM 'provider_verified'
       OR LOWER(sender_domain) LIKE '%.invalid'
       OR LOWER(sender_address) LIKE '%configure%'
       OR LOWER(sender_address) LIKE '%placeholder%' THEN
      RAISE EXCEPTION 'live outreach delivery requires a live provider, verified sender domain, and physical address'
        USING ERRCODE='23514';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS outbound_message_live_delivery_guard ON outbound_messages;
CREATE TRIGGER outbound_message_live_delivery_guard
BEFORE INSERT OR UPDATE OF status ON outbound_messages
FOR EACH ROW EXECUTE FUNCTION prevent_unsafe_live_outreach_delivery();

INSERT INTO outreach_provider_connections(id,provider,display_label,verification_status,configuration)
VALUES('00000000-0000-4000-8000-000000000006','dry-run','Dry-run provider','verified','{"liveSending":false}'::jsonb)
ON CONFLICT(id) DO NOTHING;
INSERT INTO outreach_sender_identities(id,display_name,from_email,reply_to,business_name,physical_address,domain,verification_status,provider_connection_id)
VALUES('00000000-0000-4000-8000-000000000016','Revora Review','review@example.invalid','reply@example.invalid','Revora',
'Configure a verified physical address before live delivery','example.invalid','unverified','00000000-0000-4000-8000-000000000006')
ON CONFLICT(id) DO NOTHING;
UPDATE outreach_sender_identities SET verification_status='unverified'
WHERE id='00000000-0000-4000-8000-000000000016' AND domain='example.invalid';
