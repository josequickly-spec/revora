import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();
    const { type, data } = event;

    // Verificar webhook signature (IMPORTANTE: en producción validar)
    const signature = req.headers.get("x-resend-signature");
    // TODO: Validar firma contra RESEND_WEBHOOK_SECRET

    if (!type || !data) {
      return NextResponse.json(
        { error: "Missing type or data" },
        { status: 400 }
      );
    }

    // Extraer campaign_id del email metadata
    const campaignId = data.email?.headers?.["x-campaign-id"];

    if (!campaignId) {
      console.log(`⚠️ Resend webhook received but no campaign_id: ${type}`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Procesar eventos
    switch (type) {
      case "email.sent":
        console.log(`📧 Email sent: ${data.email}`);
        await pool.query(
          `UPDATE campaign_metrics
           SET emails_sent = COALESCE(emails_sent, 0) + 1
           WHERE campaign_id = $1 AND DATE(timestamp) = CURRENT_DATE`,
          [campaignId]
        );
        break;

      case "email.opened":
        console.log(`📂 Email opened: ${data.email}`);
        await pool.query(
          `UPDATE campaign_metrics
           SET email_opens = COALESCE(email_opens, 0) + 1
           WHERE campaign_id = $1 AND DATE(timestamp) = CURRENT_DATE`,
          [campaignId]
        );
        break;

      case "email.clicked":
        console.log(`🔗 Email clicked: ${data.email}`);
        await pool.query(
          `UPDATE campaign_metrics
           SET email_clicks = COALESCE(email_clicks, 0) + 1
           WHERE campaign_id = $1 AND DATE(timestamp) = CURRENT_DATE`,
          [campaignId]
        );
        break;

      case "email.bounced":
        console.log(`❌ Email bounced: ${data.email}`);
        await pool.query(
          `UPDATE campaign_metrics
           SET email_bounces = COALESCE(email_bounces, 0) + 1
           WHERE campaign_id = $1 AND DATE(timestamp) = CURRENT_DATE`,
          [campaignId]
        );
        break;

      case "email.complained":
        console.log(`⚠️ Email complained: ${data.email}`);
        break;

      default:
        console.log(`Unknown Resend event: ${type}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}
