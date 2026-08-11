import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { verifyTimestampedHexHmac } from "@/lib/webhook-security";

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.ANALYTICS_INGEST_SECRET;
  const valid = secret && verifyTimestampedHexHmac(
    raw,
    request.headers.get("x-revora-signature") || "",
    request.headers.get("x-revora-timestamp") || "",
    secret,
  );
  if (!valid) return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  const client = await pool.connect();
  try {
    const event = JSON.parse(raw) as { campaignId?: string; eventType?: string };
    if (!event.campaignId || !["page_view", "conversion"].includes(event.eventType || "")) {
      return NextResponse.json({ success: false, error: "Invalid event" }, { status: 400 });
    }
    await client.query("BEGIN");
    const campaign = await client.query("SELECT 1 FROM campaigns WHERE id=$1", [event.campaignId]);
    if (!campaign.rowCount) {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
    }
    const existing = await client.query(
      "SELECT id FROM campaign_metrics WHERE campaign_id=$1 AND DATE(timestamp)=CURRENT_DATE ORDER BY timestamp DESC LIMIT 1 FOR UPDATE",
      [event.campaignId],
    );
    const id = existing.rows[0]?.id || (
      await client.query("INSERT INTO campaign_metrics(campaign_id,timestamp) VALUES($1,NOW()) RETURNING id", [event.campaignId])
    ).rows[0].id;
    const column = event.eventType === "page_view" ? "landing_page_views" : "conversions";
    await client.query(`UPDATE campaign_metrics SET ${column}=COALESCE(${column},0)+1 WHERE id=$1`, [id]);
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ success: false, error: "Analytics processing failed" }, { status: 400 });
  } finally {
    client.release();
  }
}
