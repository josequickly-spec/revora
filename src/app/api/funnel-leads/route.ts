import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { sendOutreachEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.funnelId || !body.name || !body.email || body.consent !== true) {
      return NextResponse.json(
        { success: false, error: "funnelId, name, email and consent are required" },
        { status: 400 }
      );
    }
    const language = body.language === "en" ? "en" : "es";
    await pool.query("ALTER TABLE funnel_leads ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'es'");
    const result = await pool.query(
      `INSERT INTO funnel_leads (funnel_id,name,email,phone,consent,language)
       VALUES ($1,$2,$3,$4,TRUE,$5)
       ON CONFLICT (funnel_id,email) DO UPDATE SET name=EXCLUDED.name,phone=EXCLUDED.phone,consent=TRUE,language=EXCLUDED.language
       RETURNING id,created_at`,
      [body.funnelId, body.name.trim(), body.email.trim().toLowerCase(), body.phone?.trim() || null, language]
    );
    let emailDelivered = false;
    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      const funnelResult = await pool.query(
        `SELECT f.content_json,b.name
         FROM funnels f JOIN businesses b ON b.id=f.business_id WHERE f.id=$1`,
        [body.funnelId]
      );
      const funnel = funnelResult.rows[0];
      const content = funnel?.content_json?.translations?.[language] || funnel?.content_json;
      const welcome = content?.welcomeEmail;
      if (welcome?.subject && welcome?.body) {
        const emailBody = [
          welcome.body,
          welcome.postscript,
          "",
          language === "en"
            ? `You requested this information from ${funnel.name}.`
            : `Solicitaste esta información a ${funnel.name}.`,
        ].filter(Boolean).join("\n\n");
        try {
          await sendOutreachEmail(
            body.email.trim().toLowerCase(),
            welcome.subject,
            emailBody,
            process.env.RESEND_FROM_EMAIL
          );
          emailDelivered = true;
        } catch (emailError) {
          console.error("Welcome email delivery failed:", emailError);
        }
      }
    }
    return NextResponse.json({ success: true, lead: result.rows[0], language, emailDelivered }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lead capture failed" },
      { status: 500 }
    );
  }
}
