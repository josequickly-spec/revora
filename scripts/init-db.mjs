import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS businesses (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(255) NOT NULL UNIQUE,
      country VARCHAR(100) NOT NULL DEFAULT 'Unknown',
      business_type VARCHAR(80) NOT NULL DEFAULT 'general',
      niche VARCHAR(150) NOT NULL DEFAULT 'general',
      monthly_revenue INTEGER NOT NULL DEFAULT 0,
      platform VARCHAR(100) NOT NULL DEFAULT 'Website',
      logo_url TEXT,
      brand_color VARCHAR(20),
      brand_accent VARCHAR(20),
      status VARCHAR(50) NOT NULL DEFAULT 'discovered',
      hero_offer TEXT,
      hero_price VARCHAR(80),
      pain_point TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS average_order_value DECIMAL(12,2) DEFAULT 0;
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(7,3) DEFAULT 0;
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_ad_spend DECIMAL(12,2) DEFAULT 0;
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city VARCHAR(150);
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS postal_code VARCHAR(40);
    ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address TEXT;

    CREATE TABLE IF NOT EXISTS contacts (
      id BIGSERIAL PRIMARY KEY,
      business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(150) NOT NULL,
      email VARCHAR(320) NOT NULL,
      linkedin_url TEXT,
      confidence_score INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'discovered',
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(business_id, email)
    );

    CREATE TABLE IF NOT EXISTS funnels (
      id BIGSERIAL PRIMARY KEY,
      business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
      funnel_name VARCHAR(255) NOT NULL,
      template_type VARCHAR(100) NOT NULL,
      headline TEXT NOT NULL,
      subheadline TEXT NOT NULL,
      cta_text TEXT NOT NULL,
      offer_badge TEXT,
      bonus_offer TEXT,
      custom_primary_color VARCHAR(20),
      slug VARCHAR(255) NOT NULL UNIQUE,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS funnel_leads (
      id BIGSERIAL PRIMARY KEY,
      funnel_id BIGINT REFERENCES funnels(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(320) NOT NULL,
      phone VARCHAR(80),
      consent BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(funnel_id, email)
    );
    ALTER TABLE funnels ADD COLUMN IF NOT EXISTS content_json JSONB;

    CREATE TABLE IF NOT EXISTS outreach_messages (
      id BIGSERIAL PRIMARY KEY,
      business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
      contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL,
      campaign_id TEXT,
      recipient_email VARCHAR(320) NOT NULL,
      email_subject TEXT NOT NULL,
      email_body TEXT NOT NULL,
      email_sequence JSONB,
      video_script JSONB,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      provider_id TEXT,
      sent_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS proposals (
      id BIGSERIAL PRIMARY KEY,
      business_id BIGINT REFERENCES businesses(id) ON DELETE CASCADE,
      current_revenue INTEGER NOT NULL DEFAULT 0,
      projected_extra_revenue INTEGER NOT NULL DEFAULT 0,
      revenue_share_percent INTEGER NOT NULL DEFAULT 25,
      estimated_agency_fee INTEGER NOT NULL DEFAULT 0,
      status VARCHAR(50) NOT NULL DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      business_name VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'ready',
      landing_page_url VARCHAR(500),
      analysis JSONB,
      landing_page JSONB,
      email_sequence JSONB,
      video_script JSONB,
      ads_strategy JSONB,
      projections JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS campaign_metrics (
      id BIGSERIAL PRIMARY KEY,
      campaign_id TEXT REFERENCES campaigns(id) ON DELETE CASCADE,
      landing_page_views INTEGER DEFAULT 0,
      unique_visitors INTEGER DEFAULT 0,
      email_opens INTEGER DEFAULT 0,
      email_clicks INTEGER DEFAULT 0,
      emails_sent INTEGER DEFAULT 0,
      email_bounces INTEGER DEFAULT 0,
      ad_impressions INTEGER DEFAULT 0,
      ad_clicks INTEGER DEFAULT 0,
      ad_conversions INTEGER DEFAULT 0,
      ad_spend DECIMAL(10, 2) DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      revenue DECIMAL(12, 2) DEFAULT 0,
      roi DECIMAL(5, 2) DEFAULT 0,
      bounce_rate DECIMAL(5, 2) DEFAULT 0,
      timestamp TIMESTAMP DEFAULT NOW(),
      UNIQUE(campaign_id, timestamp)
    );

    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
    CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timestamp ON campaign_metrics(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_contacts_business_id ON contacts(business_id);
    CREATE INDEX IF NOT EXISTS idx_funnels_business_id ON funnels(business_id);
    CREATE INDEX IF NOT EXISTS idx_funnel_leads_funnel_id ON funnel_leads(funnel_id);
    CREATE INDEX IF NOT EXISTS idx_outreach_business_id ON outreach_messages(business_id);
    CREATE INDEX IF NOT EXISTS idx_proposals_business_id ON proposals(business_id);
  `);
  console.log("Database initialized successfully");
} finally {
  client.release();
  await pool.end();
}
