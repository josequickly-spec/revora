import { NextResponse } from "next/server";
import { Resend } from "resend";
import { pool } from "@/lib/postgres";

export async function GET(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  const result = businessId
    ? await pool.query("SELECT * FROM outreach_messages WHERE business_id=$1 ORDER BY created_at DESC", [businessId])
    : await pool.query("SELECT * FROM outreach_messages ORDER BY created_at DESC LIMIT 100");
  return NextResponse.json({ success: true, outreach: result.rows });
}

export async function POST(req: Request) {
  try {
    const { outreachId } = await req.json();
    if (!outreachId) {
      return NextResponse.json({ success: false, error: "outreachId is required" }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: "RESEND_API_KEY is not configured" }, { status: 503 });
    }
    const result = await pool.query(
      `SELECT o.*, c.status AS contact_status
       FROM outreach_messages o LEFT JOIN contacts c ON c.id=o.contact_id WHERE o.id=$1`,
      [outreachId]
    );
    const message = result.rows[0];
    if (!message) return NextResponse.json({ success: false, error: "Draft not found" }, { status: 404 });
    if (message.contact_status !== "verified") {
      return NextResponse.json(
        { success: false, error: "El contacto no está verificado; no se enviará el correo." },
        { status: 409 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const sent = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: message.recipient_email,
      subject: message.email_subject,
      html: `<div style="white-space:pre-wrap;font-family:Arial,sans-serif">${message.email_body}</div>`,
    });
    if (sent.error) throw new Error(sent.error.message);
    await pool.query(
      "UPDATE outreach_messages SET status='sent',provider_id=$1,sent_at=NOW() WHERE id=$2",
      [sent.data?.id || null, outreachId]
    );
    return NextResponse.json({ success: true, providerId: sent.data?.id });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Email send failed" },
      { status: 500 }
    );
  }
}
