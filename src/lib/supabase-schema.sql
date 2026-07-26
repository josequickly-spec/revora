-- Supabase Schema for Revora Complete System

-- Campaigns Table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  industry_category TEXT,
  website_url TEXT,
  status TEXT CHECK (status IN ('analyzing', 'ready', 'launched', 'live', 'paused')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID
);

-- Business Analysis Table
CREATE TABLE business_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  seo_score NUMERIC,
  domain_authority NUMERIC,
  monthly_traffic NUMERIC,
  competitors JSON,
  keywords JSON,
  analysis_data JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Landing Pages Table
CREATE TABLE landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  headline TEXT,
  subheadline TEXT,
  pain_point TEXT,
  solution TEXT,
  proof_copy TEXT,
  cta_text TEXT,
  color_primary TEXT,
  color_secondary TEXT,
  color_accent TEXT,
  deployed_url TEXT,
  html_content TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Sequences Table
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email_number INTEGER,
  subject TEXT,
  body TEXT,
  delay_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Video Scripts Table
CREATE TABLE video_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT,
  script TEXT,
  duration TEXT,
  cta TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Ads Strategies Table
CREATE TABLE ads_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  google_ads_keywords JSON,
  google_ads_copy JSON,
  facebook_ads_copy JSON,
  facebook_ads_audience JSON,
  budget_recommendation NUMERIC,
  expected_metrics JSON,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Campaign Metrics Table
CREATE TABLE campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE DEFAULT TODAY(),
  landing_page_views INTEGER DEFAULT 0,
  landing_page_clicks INTEGER DEFAULT 0,
  email_sent INTEGER DEFAULT 0,
  email_opens INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts Table (For Outreach)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  position TEXT,
  confidence_score NUMERIC,
  contacted_at TIMESTAMP,
  response_status TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Revenue Share Agreements Table
CREATE TABLE revenue_share_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  commission_percentage NUMERIC,
  start_date DATE,
  end_date DATE,
  total_commission_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_business_analysis_campaign_id ON business_analysis(campaign_id);
CREATE INDEX idx_landing_pages_campaign_id ON landing_pages(campaign_id);
CREATE INDEX idx_email_sequences_campaign_id ON email_sequences(campaign_id);
CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
CREATE INDEX idx_campaign_metrics_date ON campaign_metrics(date);
CREATE INDEX idx_contacts_campaign_id ON contacts(campaign_id);
