import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.funnelId || !body.name || !body.email || body.consent !== true) {
      return NextResponse.json(
        { success: false, error: "funnelId, name, email and consent are required" },
        { status: 400 }
      );
    }
    const result = await pool.query(
      `INSERT INTO funnel_leads (funnel_id,name,email,phone,consent)
       VALUES ($1,$2,$3,$4,TRUE)
       ON CONFLICT (funnel_id,email) DO UPDATE SET name=EXCLUDED.name,phone=EXCLUDED.phone,consent=TRUE
       RETURNING id,created_at`,
      [body.funnelId, body.name.trim(), body.email.trim().toLowerCase(), body.phone?.trim() || null]
    );
    return NextResponse.json({ success: true, lead: result.rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Lead capture failed" },
      { status: 500 }
    );
  }
}
