import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initializeDatabase() {
  const client = await pool.connect();

  try {
    // Crear tabla campaigns
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    `);

    // Crear tabla campaign_metrics
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaign_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
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
        UNIQUE(campaign_id, DATE(timestamp))
      );
    `);

    // Crear índices para mejor performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_campaign_metrics_timestamp ON campaign_metrics(timestamp DESC);
    `);

    console.log("✅ Database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization error:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Ejecutar si se importa directamente
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log("Database setup complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Setup failed:", error);
      process.exit(1);
    });
}
