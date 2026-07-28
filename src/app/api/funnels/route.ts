import { NextRequest, NextResponse } from "next/server";
import { funnelSelect, pool } from "@/lib/postgres";

export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug");
    if (slug) {
      const result = await pool.query(
        `SELECT f.*, b.name, b.domain, b.country, b.business_type, b.niche,
         b.hero_offer, b.hero_price, b.brand_color
         FROM funnels f JOIN businesses b ON b.id=f.business_id WHERE f.slug=$1`,
        [slug]
      );
      const row = result.rows[0];
      if (!row) return NextResponse.json({ success: false, error: "Funnel not found" }, { status: 404 });
      await pool.query("UPDATE funnels SET view_count=COALESCE(view_count,0)+1 WHERE id=$1", [row.id]);
      return NextResponse.json({
        success: true,
        funnel: {
          id: row.id, businessId: row.business_id, funnelName: row.funnel_name,
          templateType: row.template_type, headline: row.headline, subheadline: row.subheadline,
          ctaText: row.cta_text, offerBadge: row.offer_badge, bonusOffer: row.bonus_offer,
          customPrimaryColor: row.custom_primary_color, slug: row.slug, viewCount: row.view_count + 1,
          contentJson: row.content_json,
        },
        business: {
          id: row.business_id, name: row.name, domain: row.domain, country: row.country,
          businessType: row.business_type, niche: row.niche, heroOffer: row.hero_offer,
          heroPrice: row.hero_price, brandColor: row.brand_color,
        },
      });
    }
    const result = await pool.query(`SELECT ${funnelSelect} FROM funnels ORDER BY created_at DESC`);
    return NextResponse.json({ success: true, funnels: result.rows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Database error" }, { status: 500 });
  }
}
