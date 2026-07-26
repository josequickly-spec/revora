import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const campaignId = searchParams.get("id");
    const metricsOnly = searchParams.get("metrics");

    if (campaignId && metricsOnly === "true") {
      const result = await pool.query(
        "SELECT * FROM campaign_metrics WHERE campaign_id = $1 ORDER BY timestamp DESC LIMIT 100",
        [campaignId]
      );
      return NextResponse.json(
        { success: true, metrics: result.rows, total: result.rows.length },
        { status: 200 }
      );
    }

    if (campaignId) {
      const result = await pool.query(
        "SELECT * FROM campaigns WHERE id = $1",
        [campaignId]
      );
      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: "Campaign not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: true, campaign: result.rows[0] },
        { status: 200 }
      );
    }

    const result = await pool.query(
      "SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 50"
    );
    return NextResponse.json(
      { success: true, campaigns: result.rows, total: result.rows.length },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      businessName,
      status,
      landingPageUrl,
      analysis,
      landingPage,
      emailSequence,
      videoScript,
      adsStrategy,
      projections,
    } = body;

    const campaignId = id || `campaign_${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO campaigns (id, business_name, status, landing_page_url, analysis, landing_page, email_sequence, video_script, ads_strategy, projections, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (id) DO UPDATE SET
       status = $3,
       landing_page_url = $4,
       analysis = $5,
       landing_page = $6,
       email_sequence = $7,
       video_script = $8,
       ads_strategy = $9,
       projections = $10
       RETURNING *`,
      [
        campaignId,
        businessName,
        status || "ready",
        landingPageUrl,
        JSON.stringify(analysis),
        JSON.stringify(landingPage),
        JSON.stringify(emailSequence),
        JSON.stringify(videoScript),
        JSON.stringify(adsStrategy),
        JSON.stringify(projections),
      ]
    );

    return NextResponse.json(
      {
        success: true,
        campaign: result.rows[0],
        message: "Campaign saved to database",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to save campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, metrics } = body;

    if (status) {
      await pool.query("UPDATE campaigns SET status = $1 WHERE id = $2", [
        status,
        id,
      ]);
    }

    if (metrics) {
      await pool.query(
        `INSERT INTO campaign_metrics (campaign_id, landing_page_views, email_opens, email_clicks, ad_impressions, ad_clicks, conversions, revenue, roi, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          id,
          metrics.landingPageViews || 0,
          metrics.emailOpens || 0,
          metrics.emailClicks || 0,
          metrics.adImpressions || 0,
          metrics.adClicks || 0,
          metrics.conversions || 0,
          metrics.revenue || 0,
          metrics.roi || 0,
        ]
      );
    }

    const result = await pool.query("SELECT * FROM campaigns WHERE id = $1", [
      id,
    ]);
    return NextResponse.json(
      { success: true, campaign: result.rows[0], message: "Campaign updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Campaign ID required" },
        { status: 400 }
      );
    }

    await pool.query("DELETE FROM campaign_metrics WHERE campaign_id = $1", [
      id,
    ]);
    await pool.query("DELETE FROM campaigns WHERE id = $1", [id]);

    return NextResponse.json(
      { success: true, message: "Campaign deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
