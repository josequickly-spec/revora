import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { verifySvixSignature } from "@/lib/webhook-security";

const metricColumns: Record<string, string> = {
  "email.sent": "emails_sent",
  "email.opened": "email_opens",
  "email.clicked": "email_clicks",
  "email.bounced": "email_bounces",
};

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const valid = secret && verifySvixSignature(
    raw,
    request.headers.get("svix-id") || "",
    request.headers.get("svix-timestamp") || "",
    request.headers.get("svix-signature") || "",
    secret,
  );
  if (!valid) return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  try {
    const event = JSON.parse(raw) as {
      type?: string;
      data?: { email?: { headers?: Record<string, string> } };
    };
    if (!event.type || !event.data) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    const campaignId = event.data.email?.headers?.["x-campaign-id"];
    const column = metricColumns[event.type];
    if (campaignId && column) {
      await pool.query(
        `UPDATE campaign_metrics SET ${column}=COALESCE(${column},0)+1
         WHERE campaign_id=$1 AND DATE(timestamp)=CURRENT_DATE`,
        [campaignId],
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 400 });
  }
}
