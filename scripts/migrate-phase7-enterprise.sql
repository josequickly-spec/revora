-- Phase 7: additive Enterprise Operations Platform schema.
-- Business Intelligence remains the owner of businesses and contacts.

CREATE TABLE IF NOT EXISTS enterprise_users (
  id UUID PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  normalized_email VARCHAR(320) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  password_hash TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(status IN ('invited','active','suspended','disabled'))
);

CREATE TABLE IF NOT EXISTS enterprise_organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(status IN ('active','suspended','closed'))
);

CREATE TABLE IF NOT EXISTS enterprise_workspaces (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,slug)
);

CREATE TABLE IF NOT EXISTS enterprise_teams (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  workspace_id UUID REFERENCES enterprise_workspaces(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,workspace_id,name)
);

CREATE TABLE IF NOT EXISTS enterprise_roles (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,code)
);

CREATE TABLE IF NOT EXISTS enterprise_permissions (
  code VARCHAR(100) PRIMARY KEY,
  description VARCHAR(300) NOT NULL
);

CREATE TABLE IF NOT EXISTS enterprise_role_permissions (
  role_id UUID NOT NULL REFERENCES enterprise_roles(id) ON DELETE RESTRICT,
  permission_code VARCHAR(100) NOT NULL REFERENCES enterprise_permissions(code) ON DELETE RESTRICT,
  PRIMARY KEY(role_id,permission_code)
);

CREATE TABLE IF NOT EXISTS enterprise_memberships (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  role_id UUID NOT NULL REFERENCES enterprise_roles(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,user_id),
  CHECK(status IN ('invited','active','suspended','removed'))
);

CREATE TABLE IF NOT EXISTS enterprise_team_members (
  team_id UUID NOT NULL REFERENCES enterprise_teams(id) ON DELETE RESTRICT,
  membership_id UUID NOT NULL REFERENCES enterprise_memberships(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(team_id,membership_id)
);

CREATE TABLE IF NOT EXISTS enterprise_auth_identities (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  provider VARCHAR(30) NOT NULL,
  provider_subject VARCHAR(255) NOT NULL,
  provider_email VARCHAR(320),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider,provider_subject),
  CHECK(provider IN ('google','microsoft'))
);

CREATE TABLE IF NOT EXISTS enterprise_mfa_factors (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  factor_type VARCHAR(30) NOT NULL DEFAULT 'totp',
  encrypted_secret TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(factor_type='totp')
);

CREATE TABLE IF NOT EXISTS enterprise_device_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
  user_agent_hash VARCHAR(64),
  ip_hash VARCHAR(64),
  expires_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enterprise_password_reset_tokens (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enterprise_api_keys (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  created_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  name VARCHAR(120) NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enterprise_audit_logs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID,
  action VARCHAR(120) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  outcome VARCHAR(20) NOT NULL,
  correlation_id UUID NOT NULL,
  safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(actor_type IN ('user','api_key','service','system')),
  CHECK(outcome IN ('success','denied','failure'))
);

CREATE TABLE IF NOT EXISTS crm_accounts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES enterprise_workspaces(id) ON DELETE RESTRICT,
  business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
  owner_membership_id UUID REFERENCES enterprise_memberships(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,business_id),
  CHECK(status IN ('active','inactive','archived'))
);

CREATE TABLE IF NOT EXISTS crm_pipelines (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES enterprise_workspaces(id) ON DELETE RESTRICT,
  name VARCHAR(150) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id,name)
);

CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
  id UUID PRIMARY KEY,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE RESTRICT,
  name VARCHAR(100) NOT NULL,
  position INTEGER NOT NULL,
  probability_basis_points INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  is_won BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pipeline_id,position),
  CHECK(position>=1),
  CHECK(probability_basis_points BETWEEN 0 AND 10000),
  CHECK(NOT is_won OR is_closed)
);

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES enterprise_workspaces(id) ON DELETE RESTRICT,
  account_id UUID NOT NULL REFERENCES crm_accounts(id) ON DELETE RESTRICT,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE RESTRICT,
  stage_id UUID NOT NULL REFERENCES crm_pipeline_stages(id) ON DELETE RESTRICT,
  owner_membership_id UUID REFERENCES enterprise_memberships(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  amount_minor BIGINT,
  currency VARCHAR(3),
  expected_close_date DATE,
  source_context VARCHAR(50) NOT NULL DEFAULT 'manual',
  source_id VARCHAR(100),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(amount_minor IS NULL OR amount_minor>=0),
  CHECK((amount_minor IS NULL AND currency IS NULL) OR (amount_minor IS NOT NULL AND currency IS NOT NULL)),
  CHECK(source_context IN ('manual','proposal','outreach','import'))
);

CREATE TABLE IF NOT EXISTS crm_opportunity_stage_history (
  id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES crm_opportunities(id) ON DELETE RESTRICT,
  from_stage_id UUID REFERENCES crm_pipeline_stages(id) ON DELETE RESTRICT,
  to_stage_id UUID NOT NULL REFERENCES crm_pipeline_stages(id) ON DELETE RESTRICT,
  changed_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE RESTRICT,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE RESTRICT,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE RESTRICT,
  activity_type VARCHAR(40) NOT NULL,
  subject VARCHAR(240) NOT NULL,
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_notes (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE RESTRICT,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES enterprise_workspaces(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE RESTRICT,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE RESTRICT,
  assignee_membership_id UUID REFERENCES enterprise_memberships(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  description TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'open',
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(status IN ('open','in_progress','completed','cancelled')),
  CHECK(priority IN ('low','normal','high','urgent'))
);

CREATE TABLE IF NOT EXISTS crm_calendar_events (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES enterprise_workspaces(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE RESTRICT,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  location TEXT,
  created_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(ends_at>starts_at)
);

CREATE TABLE IF NOT EXISTS crm_suggested_actions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  account_id UUID REFERENCES crm_accounts(id) ON DELETE RESTRICT,
  opportunity_id UUID REFERENCES crm_opportunities(id) ON DELETE RESTRICT,
  action_type VARCHAR(80) NOT NULL,
  rationale TEXT NOT NULL,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'suggested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  CHECK(status IN ('suggested','accepted','dismissed','expired'))
);

CREATE TABLE IF NOT EXISTS crm_events (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  aggregate_type VARCHAR(60) NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_version INTEGER NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  actor_type VARCHAR(20) NOT NULL,
  actor_id UUID,
  correlation_id UUID NOT NULL,
  causation_id UUID,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(aggregate_type,aggregate_id,aggregate_version)
);

CREATE TABLE IF NOT EXISTS crm_forecast_snapshots (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  workspace_id UUID NOT NULL REFERENCES enterprise_workspaces(id) ON DELETE RESTRICT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  currency VARCHAR(3) NOT NULL,
  open_amount_minor BIGINT NOT NULL DEFAULT 0,
  weighted_amount_minor BIGINT NOT NULL DEFAULT 0,
  won_amount_minor BIGINT NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(period_end>=period_start)
);

CREATE TABLE IF NOT EXISTS billing_plans (
  id UUID PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  stripe_price_id VARCHAR(255),
  monthly_price_minor BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  included_credits BIGINT NOT NULL DEFAULT 0,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(monthly_price_minor>=0),
  CHECK(included_credits>=0)
);

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL UNIQUE REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES billing_plans(id) ON DELETE RESTRICT,
  provider VARCHAR(30) NOT NULL DEFAULT 'stripe',
  provider_customer_id VARCHAR(255),
  provider_subscription_id VARCHAR(255),
  status VARCHAR(30) NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(provider='stripe'),
  CHECK(status IN ('trialing','active','past_due','paused','cancelled','canceled','incomplete','incomplete_expired','unpaid'))
);

CREATE TABLE IF NOT EXISTS billing_usage_ledger (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  metric VARCHAR(80) NOT NULL,
  quantity BIGINT NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  source_context VARCHAR(60) NOT NULL,
  source_id VARCHAR(100),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,idempotency_key),
  CHECK(quantity>0)
);

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='billing_subscriptions'::regclass
      AND conname='billing_subscriptions_status_check'
      AND pg_get_constraintdef(oid) NOT LIKE '%incomplete_expired%'
  ) THEN
    ALTER TABLE billing_subscriptions DROP CONSTRAINT billing_subscriptions_status_check;
    ALTER TABLE billing_subscriptions ADD CONSTRAINT billing_subscriptions_status_check
      CHECK(status IN ('trialing','active','past_due','paused','cancelled','canceled','incomplete','incomplete_expired','unpaid'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS billing_credit_ledger (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  amount BIGINT NOT NULL,
  reason VARCHAR(160) NOT NULL,
  reference_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(amount<>0)
);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  provider_invoice_id VARCHAR(255) UNIQUE,
  status VARCHAR(30) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  subtotal_minor BIGINT NOT NULL,
  tax_minor BIGINT NOT NULL DEFAULT 0,
  total_minor BIGINT NOT NULL,
  hosted_invoice_url TEXT,
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(subtotal_minor>=0 AND tax_minor>=0 AND total_minor>=0)
);

CREATE TABLE IF NOT EXISTS billing_coupons (
  id UUID PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  percent_off_basis_points INTEGER,
  amount_off_minor BIGINT,
  currency VARCHAR(3),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK((percent_off_basis_points IS NOT NULL)::int+(amount_off_minor IS NOT NULL)::int=1),
  CHECK(percent_off_basis_points IS NULL OR percent_off_basis_points BETWEEN 1 AND 10000),
  CHECK(amount_off_minor IS NULL OR amount_off_minor>0)
);

CREATE TABLE IF NOT EXISTS billing_tax_registrations (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  country_code VARCHAR(2) NOT NULL,
  region_code VARCHAR(10),
  tax_id_reference VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,country_code,region_code)
);

CREATE TABLE IF NOT EXISTS billing_webhook_events (
  id UUID PRIMARY KEY,
  provider_event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  processing_status VARCHAR(30) NOT NULL DEFAULT 'pending',
  safe_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  safe_error_code VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK(processing_status IN ('pending','processed','ignored','failed')),
  CHECK(jsonb_typeof(safe_payload)='object' AND safe_payload-ARRAY['objectId','objectType']::text[]='{}'::jsonb)
);

CREATE TABLE IF NOT EXISTS platform_jobs (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  queue VARCHAR(60) NOT NULL,
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 100,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key VARCHAR(120) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by VARCHAR(200),
  lease_expires_at TIMESTAMPTZ,
  last_error_code VARCHAR(100),
  last_error_message TEXT,
  correlation_id UUID NOT NULL,
  causation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,idempotency_key),
  CHECK(status IN ('queued','running','waiting','succeeded','failed','cancelled','dead_lettered')),
  CHECK(attempts>=0 AND max_attempts>0 AND attempts<=max_attempts)
);

CREATE TABLE IF NOT EXISTS platform_schedules (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  name VARCHAR(160) NOT NULL,
  job_type VARCHAR(100) NOT NULL,
  cron_expression VARCHAR(100) NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_notifications (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  notification_type VARCHAR(80) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_outbox (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  event_type VARCHAR(120) NOT NULL,
  aggregate_type VARCHAR(60) NOT NULL,
  aggregate_id VARCHAR(100) NOT NULL,
  aggregate_version INTEGER NOT NULL,
  correlation_id UUID NOT NULL,
  causation_id UUID,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  publish_attempts INTEGER NOT NULL DEFAULT 0,
  CHECK(publish_attempts>=0)
);

CREATE TABLE IF NOT EXISTS platform_inbox (
  consumer VARCHAR(100) NOT NULL,
  event_id UUID NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  result_hash VARCHAR(64),
  PRIMARY KEY(consumer,event_id)
);

CREATE INDEX IF NOT EXISTS enterprise_memberships_user_status_idx ON enterprise_memberships(user_id,status);
CREATE INDEX IF NOT EXISTS enterprise_sessions_user_active_idx ON enterprise_device_sessions(user_id,expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS enterprise_api_keys_org_active_idx ON enterprise_api_keys(organization_id,created_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS enterprise_audit_org_created_idx ON enterprise_audit_logs(organization_id,created_at DESC);
CREATE INDEX IF NOT EXISTS crm_accounts_org_updated_idx ON crm_accounts(organization_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS crm_opportunities_pipeline_stage_idx ON crm_opportunities(organization_id,pipeline_id,stage_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS crm_activities_timeline_idx ON crm_activities(organization_id,account_id,occurred_at DESC);
CREATE INDEX IF NOT EXISTS crm_tasks_assignee_due_idx ON crm_tasks(organization_id,assignee_membership_id,status,due_at);
CREATE INDEX IF NOT EXISTS crm_calendar_workspace_start_idx ON crm_calendar_events(workspace_id,starts_at);
CREATE INDEX IF NOT EXISTS crm_events_aggregate_idx ON crm_events(aggregate_type,aggregate_id,aggregate_version);
CREATE INDEX IF NOT EXISTS billing_usage_org_recorded_idx ON billing_usage_ledger(organization_id,recorded_at DESC);
CREATE INDEX IF NOT EXISTS billing_webhook_processing_idx ON billing_webhook_events(processing_status,created_at);
CREATE INDEX IF NOT EXISTS platform_jobs_claim_idx ON platform_jobs(queue,status,priority,available_at) WHERE status IN ('queued','waiting');
CREATE INDEX IF NOT EXISTS platform_jobs_lease_idx ON platform_jobs(lease_expires_at) WHERE status='running';
CREATE INDEX IF NOT EXISTS platform_schedules_due_idx ON platform_schedules(next_run_at) WHERE enabled;
CREATE INDEX IF NOT EXISTS platform_notifications_user_unread_idx ON platform_notifications(user_id,created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS platform_outbox_unpublished_idx ON platform_outbox(occurred_at) WHERE published_at IS NULL;

INSERT INTO enterprise_permissions(code,description) VALUES
  ('organization.manage','Manage organization settings and members'),
  ('security.manage','Manage sessions, MFA and API keys'),
  ('crm.read','Read CRM projections and timeline'),
  ('crm.write','Create and update CRM-owned records'),
  ('crm.stage.change','Explicitly change CRM opportunity stages'),
  ('billing.read','Read plans, usage and invoices'),
  ('billing.manage','Manage subscriptions and customer portal'),
  ('workflow.read','Read jobs, schedules and notifications'),
  ('workflow.manage','Create, retry and cancel workflows'),
  ('api.manage','Create and revoke public API keys')
ON CONFLICT(code) DO UPDATE SET description=EXCLUDED.description;

INSERT INTO billing_plans(id,code,name,monthly_price_minor,currency,included_credits,limits)
VALUES
  ('00000000-0000-4000-8000-000000000071','starter','Starter',0,'USD',100,'{"members":3,"workspaces":1}'::jsonb),
  ('00000000-0000-4000-8000-000000000072','growth','Growth',9900,'USD',2500,'{"members":25,"workspaces":5}'::jsonb),
  ('00000000-0000-4000-8000-000000000073','enterprise','Enterprise',0,'USD',0,'{"members":null,"workspaces":null,"contactSales":true}'::jsonb)
ON CONFLICT(code) DO NOTHING;
