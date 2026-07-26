import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const {
      campaignId,
      eventType,
      pageViews,
      uniqueVisitors,
      conversions,
      revenue,
      bounceRate,
    } = event;

    if (!campaignId || !eventType) {
      return NextResponse.json(
        { error: "Missing campaignId or eventType" },
        { status: 400 }
      );
    }

    // Guardar o actualizar métricas
    switch (eventType) {
      case "page_view":
        console.log(`👁️ Landing page view: campaign=${campaignId}`);
        await pool.query(
          `UPDATE campaign_metrics
           SET landing_page_views = COALESCE(landing_page_views, 0) + 1
           WHERE campaign_id = $1 AND DATE(timestamp) = CURRENT_DATE`,
          [campaignId]
        );
        break;

      case "conversion":
        console.log(`🎯 Conversion: campaign=${campaignId}, revenue=$${revenue}`);
        await pool.query(
          `UPDATE campaign_metrics
           SET conversions = COALESCE(conversions, 0) + 1,
               revenue = COALESCE(revenue, 0) + $1
           WHERE campaign_id = $2 AND DATE(timestamp) = CURRENT_DATE`,
          [revenue || 0, campaignId]
        );
        break;

      case "daily_summary":
        console.log(
          `📊 Daily analytics: views=${pageViews}, conversions=${conversions}`
        );
        await pool.query(
          `INSERT INTO campaign_metrics
           (campaign_id, landing_page_views, conversions, revenue, timestamp)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (campaign_id, DATE(timestamp)) DO UPDATE SET
           landing_page_views = $2,
           conversions = $3,
           revenue = $4`,
          [campaignId, pageViews || 0, conversions || 0, revenue || 0]
        );
        break;

      default:
        console.log(`Unknown analytics event: ${eventType}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Analytics webhook error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
