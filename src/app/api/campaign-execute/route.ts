import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

async function getMetrics(campaignId: string) {
  const result = await pool.query(
    `SELECT campaign_id AS "campaignId", landing_page_views AS "landingPageViews",
     email_opens AS "emailOpens", email_clicks AS "emailClicks",
     ad_impressions AS "adImpressions", ad_clicks AS "adClicks",
     conversions, revenue, roi, timestamp
     FROM campaign_metrics WHERE campaign_id=$1 ORDER BY timestamp DESC LIMIT 1`,
    [campaignId]
  );
  return result.rows[0] || {
    campaignId, landingPageViews: 0, emailOpens: 0, emailClicks: 0,
    adImpressions: 0, adClicks: 0, conversions: 0, revenue: 0, roi: 0,
    timestamp: new Date().toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { campaignId, action } = await req.json();
    if (!campaignId || !["launch", "pause", "resume"].includes(action)) {
      return NextResponse.json({ success: false, error: "Valid campaignId and action are required" }, { status: 400 });
    }

    const existing = await pool.query("SELECT id,status FROM campaigns WHERE id=$1", [campaignId]);
    if (!existing.rows[0]) {
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }

    if (action === "launch") {
      const sent = await pool.query(
        "SELECT COUNT(*)::int AS total FROM outreach_messages WHERE campaign_id=$1 AND status='sent'",
        [campaignId]
      );
      if (sent.rows[0].total === 0) {
        return NextResponse.json(
          { success: false, error: "La campaña no puede activarse hasta que exista al menos un outreach enviado y verificado." },
          { status: 409 }
        );
      }
    }

    const status = action === "pause" ? "paused" : "live";
    const updated = await pool.query(
      "UPDATE campaigns SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *",
      [status, campaignId]
    );
    return NextResponse.json({ success: true, result: updated.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Execution failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get("campaignId");
  if (!campaignId) {
    return NextResponse.json({ success: false, error: "campaignId required" }, { status: 400 });
  }
  return NextResponse.json({ success: true, metrics: await getMetrics(campaignId) });
}
