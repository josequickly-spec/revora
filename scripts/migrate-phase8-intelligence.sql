-- Phase 8: additive analytical, forecasting and operational-readiness schema.
-- Warehouse tables read from, but never own or mutate, operational aggregates.

CREATE TABLE IF NOT EXISTS warehouse_refresh_runs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  source_watermark TIMESTAMPTZ NOT NULL,
  rows_written INTEGER NOT NULL DEFAULT 0,
  safe_error_code VARCHAR(100),
  safe_error_message TEXT,
  CHECK(status IN ('running','completed','failed')),
  CHECK(rows_written>=0)
);

CREATE TABLE IF NOT EXISTS warehouse_dim_date (
  date_key INTEGER PRIMARY KEY,
  calendar_date DATE NOT NULL UNIQUE,
  day_of_week SMALLINT NOT NULL,
  week_of_year SMALLINT NOT NULL,
  month_number SMALLINT NOT NULL,
  quarter_number SMALLINT NOT NULL,
  year_number SMALLINT NOT NULL,
  is_weekend BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS warehouse_dim_business (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  business_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  normalized_domain VARCHAR(255) NOT NULL,
  region VARCHAR(150),
  industry VARCHAR(150),
  status VARCHAR(50) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  source_updated_at TIMESTAMPTZ NOT NULL,
  UNIQUE(organization_id,business_id,valid_from)
);

CREATE TABLE IF NOT EXISTS warehouse_dim_user (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL,
  role_code VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(organization_id,user_id,valid_from)
);

CREATE TABLE IF NOT EXISTS warehouse_dim_plan (
  id UUID PRIMARY KEY,
  plan_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  monthly_price_minor BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(plan_id,valid_from)
);

CREATE TABLE IF NOT EXISTS warehouse_dim_pipeline (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  pipeline_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  pipeline_name VARCHAR(150) NOT NULL,
  stage_name VARCHAR(100) NOT NULL,
  stage_position INTEGER NOT NULL,
  probability_basis_points INTEGER NOT NULL,
  is_closed BOOLEAN NOT NULL,
  is_won BOOLEAN NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(organization_id,stage_id,valid_from)
);

CREATE TABLE IF NOT EXISTS warehouse_dim_campaign (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  campaign_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(30) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ,
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(organization_id,campaign_id,valid_from)
);

CREATE TABLE IF NOT EXISTS warehouse_dim_region (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  region_code VARCHAR(150) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  UNIQUE(organization_id,region_code)
);

CREATE TABLE IF NOT EXISTS warehouse_dim_industry (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  industry_code VARCHAR(150) NOT NULL,
  display_name VARCHAR(150) NOT NULL,
  UNIQUE(organization_id,industry_code)
);

CREATE TABLE IF NOT EXISTS warehouse_fact_business (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  business_id BIGINT NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  measures JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(organization_id,event_type,source_record_id)
);

CREATE TABLE IF NOT EXISTS warehouse_fact_opportunity (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  opportunity_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  amount_minor BIGINT,
  currency VARCHAR(3),
  probability_basis_points INTEGER NOT NULL,
  weighted_amount_minor BIGINT,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  UNIQUE(organization_id,event_type,source_record_id)
);
ALTER TABLE warehouse_fact_opportunity ADD COLUMN IF NOT EXISTS currency VARCHAR(3);

CREATE TABLE IF NOT EXISTS warehouse_fact_proposal (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  proposal_id UUID NOT NULL,
  business_id BIGINT NOT NULL,
  status VARCHAR(30) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  UNIQUE(organization_id,event_type,source_record_id)
);

CREATE TABLE IF NOT EXISTS warehouse_fact_outreach (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  campaign_id UUID NOT NULL,
  message_id UUID,
  event_type VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  UNIQUE(organization_id,event_type,source_record_id)
);

CREATE TABLE IF NOT EXISTS warehouse_fact_crm (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  aggregate_type VARCHAR(60) NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  aggregate_version INTEGER NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  UNIQUE(organization_id,event_type,source_record_id)
);

CREATE TABLE IF NOT EXISTS warehouse_fact_revenue (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  amount_minor BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  UNIQUE(organization_id,event_type,source_record_id)
);

CREATE TABLE IF NOT EXISTS warehouse_fact_user (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  user_id UUID,
  event_type VARCHAR(120) NOT NULL,
  outcome VARCHAR(20) NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  UNIQUE(organization_id,event_type,source_record_id)
);

CREATE TABLE IF NOT EXISTS warehouse_fact_workflow (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  date_key INTEGER NOT NULL REFERENCES warehouse_dim_date(date_key) ON DELETE RESTRICT,
  job_id UUID NOT NULL,
  queue VARCHAR(60) NOT NULL,
  job_type VARCHAR(100) NOT NULL,
  status VARCHAR(30) NOT NULL,
  attempts INTEGER NOT NULL,
  latency_ms BIGINT,
  occurred_at TIMESTAMPTZ NOT NULL,
  source_record_id VARCHAR(100) NOT NULL,
  UNIQUE(organization_id,source_record_id)
);

CREATE TABLE IF NOT EXISTS warehouse_metric_snapshots (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  dashboard VARCHAR(40) NOT NULL,
  metric VARCHAR(100) NOT NULL,
  period_granularity VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  value_numeric NUMERIC(20,4),
  value_text VARCHAR(300),
  currency VARCHAR(3),
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_watermark TIMESTAMPTZ NOT NULL,
  UNIQUE(organization_id,dashboard,metric,period_granularity,period_start),
  CHECK(dashboard IN ('executive','sales','marketing','operations','security')),
  CHECK(period_granularity IN ('daily','weekly','monthly','quarterly','yearly')),
  CHECK(period_end>=period_start),
  CHECK((value_numeric IS NOT NULL)::int+(value_text IS NOT NULL)::int=1)
);

CREATE TABLE IF NOT EXISTS warehouse_forecasts (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  forecast_type VARCHAR(30) NOT NULL,
  horizon VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  estimate NUMERIC(20,4) NOT NULL,
  lower_bound NUMERIC(20,4),
  upper_bound NUMERIC(20,4),
  unit VARCHAR(30) NOT NULL,
  method VARCHAR(80) NOT NULL,
  sample_size INTEGER NOT NULL,
  evidence JSONB NOT NULL,
  disclaimer TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_watermark TIMESTAMPTZ NOT NULL,
  CHECK(forecast_type IN ('revenue','pipeline','growth','capacity','usage')),
  CHECK(horizon IN ('monthly','quarterly','yearly')),
  CHECK(sample_size>=0),
  CHECK(period_end>=period_start)
);

CREATE TABLE IF NOT EXISTS executive_ai_runs (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  advisor VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL,
  provider VARCHAR(50),
  model VARCHAR(100),
  evidence_snapshot JSONB NOT NULL,
  evidence_hash VARCHAR(64) NOT NULL,
  prompt_version VARCHAR(80) NOT NULL,
  schema_version VARCHAR(80) NOT NULL,
  summary TEXT,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  safe_error_code VARCHAR(100),
  safe_error_message TEXT,
  usage_metadata JSONB,
  requested_by UUID NOT NULL REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  CHECK(advisor IN ('business','revenue','sales','marketing','operations','security','growth')),
  CHECK(status IN ('pending','generating','completed','failed'))
);
ALTER TABLE executive_ai_runs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE executive_ai_runs ADD COLUMN IF NOT EXISTS limitations JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS executive_ai_recommendations (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES executive_ai_runs(id) ON DELETE RESTRICT,
  priority VARCHAR(20) NOT NULL,
  title VARCHAR(240) NOT NULL,
  recommendation TEXT NOT NULL,
  rationale TEXT NOT NULL,
  evidence_refs JSONB NOT NULL,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'suggested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  CHECK(priority IN ('critical','high','medium','low')),
  CHECK(status IN ('suggested','acknowledged','dismissed'))
);

CREATE TABLE IF NOT EXISTS observability_alerts (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES enterprise_organizations(id) ON DELETE RESTRICT,
  alert_key VARCHAR(120) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  title VARCHAR(240) NOT NULL,
  safe_summary TEXT NOT NULL,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  UNIQUE(organization_id,alert_key,status),
  CHECK(severity IN ('critical','warning','info')),
  CHECK(status IN ('open','acknowledged','resolved'))
);

CREATE TABLE IF NOT EXISTS platform_backup_records (
  id UUID PRIMARY KEY,
  backup_type VARCHAR(40) NOT NULL,
  provider_reference VARCHAR(255) NOT NULL,
  status VARCHAR(30) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  restore_tested_at TIMESTAMPTZ,
  checksum VARCHAR(128),
  retention_until TIMESTAMPTZ,
  safe_error_code VARCHAR(100),
  CHECK(status IN ('running','completed','failed','expired'))
);

CREATE TABLE IF NOT EXISTS security_rotation_records (
  id UUID PRIMARY KEY,
  secret_reference VARCHAR(160) NOT NULL,
  rotation_status VARCHAR(30) NOT NULL,
  rotated_by UUID REFERENCES enterprise_users(id) ON DELETE RESTRICT,
  rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_rotation_at TIMESTAMPTZ,
  safe_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CHECK(rotation_status IN ('completed','failed','scheduled'))
);

CREATE INDEX IF NOT EXISTS warehouse_refresh_org_started_idx ON warehouse_refresh_runs(organization_id,started_at DESC);
CREATE INDEX IF NOT EXISTS warehouse_business_current_idx ON warehouse_dim_business(organization_id,business_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS warehouse_user_current_idx ON warehouse_dim_user(organization_id,user_id) WHERE is_current;
CREATE INDEX IF NOT EXISTS warehouse_pipeline_current_idx ON warehouse_dim_pipeline(organization_id,pipeline_id,stage_position) WHERE is_current;
CREATE INDEX IF NOT EXISTS warehouse_fact_business_date_idx ON warehouse_fact_business(organization_id,date_key);
CREATE INDEX IF NOT EXISTS warehouse_fact_opportunity_date_idx ON warehouse_fact_opportunity(organization_id,date_key,stage_id);
CREATE INDEX IF NOT EXISTS warehouse_fact_proposal_date_idx ON warehouse_fact_proposal(organization_id,date_key,status);
CREATE INDEX IF NOT EXISTS warehouse_fact_outreach_date_idx ON warehouse_fact_outreach(organization_id,date_key,status);
CREATE INDEX IF NOT EXISTS warehouse_fact_crm_date_idx ON warehouse_fact_crm(organization_id,date_key,event_type);
CREATE INDEX IF NOT EXISTS warehouse_fact_revenue_date_idx ON warehouse_fact_revenue(organization_id,date_key,currency);
CREATE INDEX IF NOT EXISTS warehouse_fact_user_date_idx ON warehouse_fact_user(organization_id,date_key,event_type);
CREATE INDEX IF NOT EXISTS warehouse_fact_workflow_date_idx ON warehouse_fact_workflow(organization_id,date_key,status);
CREATE INDEX IF NOT EXISTS warehouse_metrics_dashboard_period_idx ON warehouse_metric_snapshots(organization_id,dashboard,period_granularity,period_start DESC);
CREATE INDEX IF NOT EXISTS warehouse_forecasts_org_type_idx ON warehouse_forecasts(organization_id,forecast_type,generated_at DESC);
CREATE INDEX IF NOT EXISTS executive_ai_runs_org_created_idx ON executive_ai_runs(organization_id,advisor,created_at DESC);
CREATE INDEX IF NOT EXISTS executive_ai_recommendations_run_idx ON executive_ai_recommendations(run_id,priority);
CREATE INDEX IF NOT EXISTS observability_alerts_open_idx ON observability_alerts(severity,last_seen_at DESC) WHERE status='open';
