import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { verifyTimestampedHexHmac } from "@/lib/webhook-security";

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.GOOGLE_ADS_WEBHOOK_SECRET;
  const valid = secret && verifyTimestampedHexHmac(
    raw,
    request.headers.get("x-revora-signature") || "",
    request.headers.get("x-revora-timestamp") || "",
    secret,
  );
  if (!valid) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  try {
    const event = JSON.parse(raw) as {
      campaignId?: string;
      metrics?: { impressions?: number; clicks?: number; conversions?: number; spend?: number };
    };
    if (!event.campaignId || !event.metrics) {
      return NextResponse.json({ error: "Missing campaignId or metrics" }, { status: 400 });
    }
    const campaign = await pool.query("SELECT 1 FROM campaigns WHERE id=$1", [event.campaignId]);
    if (!campaign.rowCount) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    await pool.query(
      `INSERT INTO campaign_metrics
       (campaign_id,ad_impressions,ad_clicks,ad_conversions,ad_spend,timestamp)
       VALUES($1,$2,$3,$4,$5,NOW())`,
      [
        event.campaignId,
        Math.max(0, Number(event.metrics.impressions) || 0),
        Math.max(0, Number(event.metrics.clicks) || 0),
        Math.max(0, Number(event.metrics.conversions) || 0),
        Math.max(0, Number(event.metrics.spend) || 0),
      ],
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
