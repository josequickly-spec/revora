import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

export async function GET(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  const result = businessId
    ? await pool.query("SELECT * FROM outreach_messages WHERE business_id=$1 ORDER BY created_at DESC", [businessId])
    : await pool.query("SELECT * FROM outreach_messages ORDER BY created_at DESC LIMIT 100");
  return NextResponse.json({ success: true, outreach: result.rows });
}

export async function POST(req: Request) {
  void req;
  return NextResponse.json(
    { success: false, error: "Legacy direct sending is disabled. Create, review, approve and schedule a compliant Phase 6 campaign." },
    { status: 409 }
  );
}
