import { NextResponse } from "next/server";
import { generateOutreachSequence } from "@/lib/outreach-generator";
import { pool } from "@/lib/postgres";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.contactName || !body.businessName || !body.recipientEmail) {
      return NextResponse.json(
        { success: false, error: "contactName, businessName and a real recipientEmail are required" },
        { status: 400 }
      );
    }

    const generated = await generateOutreachSequence(
      body.contactName,
      body.businessName,
      body.offerHeadline || "Auditoría personalizada",
      body.painPoint || "Conversión de tráfico",
      body.bonusOffer || "Plan de implementación"
    );
    const firstEmail = generated.emailSequence[0];
    const result = await pool.query(
      `INSERT INTO outreach_messages
       (business_id,contact_id,campaign_id,recipient_email,email_subject,email_body,email_sequence,video_script,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft') RETURNING *`,
      [body.businessId || null, body.contactId || null, body.campaignId || null,
       body.recipientEmail, firstEmail.subject, firstEmail.body,
       JSON.stringify(generated.emailSequence), JSON.stringify(generated.videoPitch)]
    );

    return NextResponse.json({
      success: true,
      outreach: result.rows[0],
      emailSequence: generated.emailSequence,
      videoPitch: generated.videoPitch,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Outreach generation failed" },
      { status: 500 }
    );
  }
}
