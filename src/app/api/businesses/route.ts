import { NextResponse } from "next/server";
import { businessSelect, ensureTechnologyDataColumn, pool } from "@/lib/postgres";

export async function GET() {
  try {
    await ensureTechnologyDataColumn();
    const result = await pool.query(`SELECT ${businessSelect} FROM businesses ORDER BY created_at DESC`);
    return NextResponse.json({ success: true, businesses: result.rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await ensureTechnologyDataColumn();
    const body = await req.json();
    if (!body.name || !body.domain) {
      return NextResponse.json({ success: false, error: "name and domain are required" }, { status: 400 });
    }
    const domain = body.domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();
    const result = await pool.query(
      `INSERT INTO businesses
       (name,domain,country,business_type,niche,monthly_revenue,average_order_value,conversion_rate,monthly_ad_spend,platform,brand_color,brand_accent,status,hero_offer,hero_price,pain_point)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (domain) DO UPDATE SET name=EXCLUDED.name,business_type=EXCLUDED.business_type,
       niche=EXCLUDED.niche,monthly_revenue=EXCLUDED.monthly_revenue,
       average_order_value=EXCLUDED.average_order_value,conversion_rate=EXCLUDED.conversion_rate,
       monthly_ad_spend=EXCLUDED.monthly_ad_spend,hero_offer=EXCLUDED.hero_offer,
       hero_price=EXCLUDED.hero_price RETURNING ${businessSelect}`,
      [body.name, domain, body.country || "Unknown", body.businessType || "general",
       body.niche || "general", Number(body.monthlyRevenue) || 0,
       Number(body.averageOrderValue) || 0, Number(body.conversionRate) || 0,
       Number(body.monthlyAdSpend) || 0, "Website",
       body.brandColor || null, body.brandAccent || null, "created", body.heroOffer || null,
       body.heroPrice || null, body.painPoint || null]
    );
    return NextResponse.json({ success: true, business: result.rows[0] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}
