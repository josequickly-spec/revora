import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

export async function GET(req: Request) {
  const businessId = new URL(req.url).searchParams.get("businessId");
  const result = businessId
    ? await pool.query("SELECT * FROM proposals WHERE business_id=$1 ORDER BY created_at DESC", [businessId])
    : await pool.query("SELECT * FROM proposals ORDER BY created_at DESC LIMIT 100");
  return NextResponse.json({ success: true, proposals: result.rows });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.businessId) {
      return NextResponse.json({ success: false, error: "businessId is required" }, { status: 400 });
    }
    const currentRevenue = Math.max(0, Number(body.monthlyRevenue) || 0);
    const expectedLift = Math.max(0, Number(body.expectedLiftPercent) || 25);
    const share = Math.min(100, Math.max(0, Number(body.commissionPercentage) || 25));
    const extra = Math.round(currentRevenue * expectedLift / 100);
    const fee = Math.round(extra * share / 100);
    const result = await pool.query(
      `INSERT INTO proposals
       (business_id,current_revenue,projected_extra_revenue,revenue_share_percent,estimated_agency_fee,status)
       VALUES ($1,$2,$3,$4,$5,'draft') RETURNING *`,
      [body.businessId, currentRevenue, extra, share, fee]
    );
    return NextResponse.json({ success: true, proposal: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Proposal creation failed" },
      { status: 500 }
    );
  }
}
