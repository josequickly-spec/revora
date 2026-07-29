import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { verifyHexHmac } from "@/lib/webhook-security";

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.META_WEBHOOK_SECRET;
  if (!secret || !verifyHexHmac(raw, request.headers.get("x-hub-signature-256") || "", secret, "sha256=")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  try {
    const payload = JSON.parse(raw) as {
      entry?: Array<{ changes?: Array<{ field?: string; value?: Record<string, unknown> }> }>;
    };
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const campaignId = String(value.campaign_id || value.adset_id || "");
        if (!campaignId) continue;
        if (change.field === "campaign_performance") {
          await pool.query(
            `INSERT INTO campaign_metrics
             (campaign_id,ad_impressions,ad_clicks,ad_conversions,ad_spend,timestamp)
             VALUES($1,$2,$3,$4,$5,NOW())`,
            [
              campaignId,
              Math.max(0, Number(value.impressions) || 0),
              Math.max(0, Number(value.clicks) || 0),
              Math.max(0, Number(value.conversions) || 0),
              Math.max(0, Number(value.spend) || 0),
            ],
          );
        } else if (change.field === "conversion_events") {
          await pool.query(
            `UPDATE campaign_metrics SET ad_conversions=COALESCE(ad_conversions,0)+1
             WHERE campaign_id=$1 AND DATE(timestamp)=CURRENT_DATE`,
            [campaignId],
          );
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  if (process.env.META_WEBHOOK_VERIFY_TOKEN && mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge || "", { status: 200 });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
