import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const { campaignId, metrics } = event;

    if (!campaignId || !metrics) {
      return NextResponse.json(
        { error: "Missing campaignId or metrics" },
        { status: 400 }
      );
    }

    // Guardar métricas de Google Ads
    await pool.query(
      `INSERT INTO campaign_metrics
       (campaign_id, ad_impressions, ad_clicks, ad_conversions, ad_spend, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (campaign_id, DATE(timestamp)) DO UPDATE SET
       ad_impressions = $2,
       ad_clicks = $3,
       ad_conversions = $4,
       ad_spend = $5`,
      [
        campaignId,
        metrics.impressions || 0,
        metrics.clicks || 0,
        metrics.conversions || 0,
        metrics.spend || 0,
      ]
    );

    console.log(
      `📊 Google Ads metrics updated: ${metrics.impressions} impressions, ${metrics.clicks} clicks`
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Google Ads webhook error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
