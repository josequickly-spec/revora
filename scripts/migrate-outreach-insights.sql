-- Migration: Add insights column to outreach_campaigns
-- This stores the 2 selected insights that were approved before generating the email

ALTER TABLE outreach_campaigns 
ADD COLUMN insights_json TEXT;

-- Optional: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_outreach_insights ON outreach_campaigns(business_id);
