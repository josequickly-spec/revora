import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import * as crypto from "crypto";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verificar firma de webhook de Meta
function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.META_WEBHOOK_SECRET) {
    console.warn("⚠️ Meta webhook signature verification skipped");
    return true; // En desarrollo, permitir sin verificación
  }

  const hash = crypto
    .createHmac("sha256", process.env.META_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");

  return `sha256=${hash}` === signature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // Verificar firma
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    const event = JSON.parse(body);
    const { entry } = event;

    if (!entry || entry.length === 0) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    for (const item of entry) {
      const { changes } = item;

      if (!changes) continue;

      for (const change of changes) {
        const { field, value } = change;

        // Extraer campaign_id de los datos
        const campaignId = value.campaign_id || value.adset_id;

        if (!campaignId) continue;

        // Procesar diferentes tipos de eventos
        switch (field) {
          case "campaign_performance":
            console.log(
              `📊 Meta campaign metrics: impressions=${value.impressions}, clicks=${value.clicks}`
            );
            await pool.query(
              `INSERT INTO campaign_metrics
               (campaign_id, ad_impressions, ad_clicks, ad_conversions, ad_spend, timestamp)
               VALUES ($1, $2, $3, $4, $5, NOW())`,
              [
                campaignId,
                value.impressions || 0,
                value.clicks || 0,
                value.conversions || 0,
                value.spend || 0,
              ]
            );
            break;

          case "ad_performance":
            console.log(
              `📢 Meta ad metrics: ${value.ad_id} - clicks=${value.clicks}`
            );
            break;

          case "conversion_events":
            console.log(
              `🎯 Meta conversion: ${value.event_type} for campaign ${campaignId}`
            );
            await pool.query(
              `UPDATE campaign_metrics
               SET ad_conversions = COALESCE(ad_conversions, 0) + 1
               WHERE campaign_id = $1 AND DATE(timestamp) = CURRENT_DATE`,
              [campaignId]
            );
            break;

          default:
            console.log(`Unknown Meta event field: ${field}`);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Meta webhook error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

// GET para verificación de webhook (requerido por Meta)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ Meta webhook verified");
    return NextResponse.json(challenge, { status: 200 });
  } else {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
}
