import { pool } from "@/lib/postgres";

export async function saveCampaign(campaign: Record<string, unknown>) {
  const result = await pool.query(
    `INSERT INTO campaigns
     (id,business_name,status,analysis,landing_page,email_sequence,video_script,ads_strategy,projections)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status,analysis=EXCLUDED.analysis,
     landing_page=EXCLUDED.landing_page,email_sequence=EXCLUDED.email_sequence,
     video_script=EXCLUDED.video_script,ads_strategy=EXCLUDED.ads_strategy,
     projections=EXCLUDED.projections RETURNING *`,
    [campaign.id, campaign.businessName, campaign.status || "ready", campaign.analysis,
     campaign.landingPage, campaign.emailSequence, campaign.videoScript,
     campaign.adsStrategy, campaign.projections]
  );
  return result.rows[0];
}

export async function getCampaigns(limit = 50) {
  return (await pool.query("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT $1", [limit])).rows;
}

export async function getCampaign(id: string) {
  return (await pool.query("SELECT * FROM campaigns WHERE id=$1", [id])).rows[0] || null;
}

export async function updateCampaign(id: string, updates: { status?: string }) {
  return (await pool.query("UPDATE campaigns SET status=COALESCE($1,status),updated_at=NOW() WHERE id=$2 RETURNING *", [updates.status, id])).rows[0];
}

export async function deleteCampaign(id: string) {
  await pool.query("DELETE FROM campaigns WHERE id=$1", [id]);
}

export async function saveCampaignMetrics(campaignId: string, metrics: Record<string, number>) {
  return (await pool.query(
    `INSERT INTO campaign_metrics
     (campaign_id,landing_page_views,email_opens,email_clicks,ad_impressions,ad_clicks,conversions,revenue,roi)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [campaignId,metrics.landingPageViews||0,metrics.emailOpens||0,metrics.emailClicks||0,
     metrics.adImpressions||0,metrics.adClicks||0,metrics.conversions||0,
     metrics.revenue||0,metrics.roi||0]
  )).rows[0];
}

export async function getCampaignMetrics(campaignId: string) {
  return (await pool.query("SELECT * FROM campaign_metrics WHERE campaign_id=$1 ORDER BY timestamp DESC LIMIT 100", [campaignId])).rows;
}
