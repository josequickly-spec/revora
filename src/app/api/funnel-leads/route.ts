import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { sendOutreachEmail } from "@/lib/email";
import { z } from "zod";

const leadSchema = z.object({
  funnelId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  consent: z.literal(true),
  language: z.enum(["en", "es"]).default("en"),
  website: z.string().max(0).optional(),
}).strict();

export async function POST(req: Request) {
  try {
    const body = leadSchema.parse(await req.json());
    const language = body.language;
    await pool.query("ALTER TABLE funnel_leads ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en'");
    const result = await pool.query(
      `INSERT INTO funnel_leads (funnel_id,name,email,phone,consent,language)
       VALUES ($1,$2,$3,$4,TRUE,$5)
       ON CONFLICT (funnel_id,email) DO UPDATE SET name=EXCLUDED.name,phone=EXCLUDED.phone,consent=TRUE,language=EXCLUDED.language
       RETURNING id,created_at`,
      [body.funnelId, body.name, body.email.toLowerCase(), body.phone || null, language]
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
            : `You requested this information from ${funnel.name}.`,
        ].filter(Boolean).join("\n\n");
        try {
          await sendOutreachEmail(
            body.email.toLowerCase(),
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
  } catch {
    return NextResponse.json(
      { success: false, error: "Lead capture failed." },
      { status: 400 }
    );
  }
}
