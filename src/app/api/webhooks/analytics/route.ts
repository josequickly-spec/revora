import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const event = await req.json();
    if (!event.campaignId || !["page_view", "conversion"].includes(event.eventType)) {
      return NextResponse.json({ success: false, error: "Valid campaignId and eventType are required" }, { status: 400 });
    }
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id FROM campaign_metrics WHERE campaign_id=$1 AND DATE(timestamp)=CURRENT_DATE ORDER BY timestamp DESC LIMIT 1 FOR UPDATE",
      [event.campaignId]
    );
    let id = existing.rows[0]?.id;
    if (!id) {
      const created = await client.query(
        "INSERT INTO campaign_metrics (campaign_id,timestamp) VALUES ($1,NOW()) RETURNING id",
        [event.campaignId]
      );
      id = created.rows[0].id;
    }
    if (event.eventType === "page_view") {
      await client.query("UPDATE campaign_metrics SET landing_page_views=COALESCE(landing_page_views,0)+1 WHERE id=$1", [id]);
    } else {
      await client.query(
        "UPDATE campaign_metrics SET conversions=COALESCE(conversions,0)+1,revenue=COALESCE(revenue,0)+$1 WHERE id=$2",
        [Math.max(0, Number(event.revenue) || 0), id]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Analytics failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
