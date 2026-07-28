import { NextResponse } from "next/server";
import { FunnelLanguageMode, generateLocalizedFunnel } from "@/lib/funnel-generator";
import { getIndustry } from "@/lib/industries";
import { funnelSelect, pool } from "@/lib/postgres";
import { auditSite } from "@/lib/site-audit";

interface FunnelGenerateRequest {
  businessId: number;
  businessName: string;
  industryType: string;
  niche: string;
  painPoint: string;
  languageMode?: FunnelLanguageMode;
}

export async function POST(req: Request) {
  try {
    const body: FunnelGenerateRequest = await req.json();
    const { businessId, businessName, industryType, niche, painPoint } = body;

    if (!businessName || !industryType) {
      return NextResponse.json(
        { success: false, error: "businessName and industryType are required" },
        { status: 400 }
      );
    }

    console.log(`Generating funnel for: ${businessName}`);
    const businessResult = businessId ? await pool.query(
      `SELECT domain,country,platform,hero_offer,hero_price,pain_point,niche,business_type
       FROM businesses WHERE id=$1`, [businessId]
    ) : null;
    const business = businessResult?.rows[0];
    const ind = getIndustry(business?.business_type || industryType);
    const audit = business?.domain
      ? await auditSite(business.domain).catch(() => null)
      : null;

    const generatedFunnel = await generateLocalizedFunnel(
      businessName,
      industryType,
      niche,
      business?.pain_point || painPoint,
      {
        website: business?.domain,
        country: business?.country,
        platform: business?.platform,
        offer: business?.hero_offer && business.hero_offer !== ind.defaultOffer ? business.hero_offer : undefined,
        price: business?.hero_price && business.hero_price !== ind.defaultPrice ? business.hero_price : undefined,
        audit,
      },
      body.languageMode || "bilingual"
    );

    const slug =
      businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString().slice(-4);

    const result = await pool.query(
      `INSERT INTO funnels
       (business_id,funnel_name,template_type,headline,subheadline,cta_text,offer_badge,bonus_offer,custom_primary_color,slug,content_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING ${funnelSelect}`,
      [businessId || null, `Embudo para ${businessName}`, ind.funnelType,
       generatedFunnel.headline, generatedFunnel.subheadline, generatedFunnel.ctaText,
       generatedFunnel.offerBadge, generatedFunnel.bonusOffer,
       generatedFunnel.colorScheme.primary, slug, JSON.stringify(generatedFunnel)]
    );
    const newFunnel = result.rows[0];

    return NextResponse.json({
      success: true,
      funnel: newFunnel,
      generatedContent: generatedFunnel,
      message: `Embudo generado automaticamente para "${businessName}"`,
      availableLanguages: generatedFunnel.availableLanguages,
    });
  } catch (error) {
    console.error("Funnel generation error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
