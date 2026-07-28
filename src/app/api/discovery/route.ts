import { NextResponse } from "next/server";
import { findEmail, getDomainEmails, verifyEmail } from "@/lib/hunter";
import { getIndustry } from "@/lib/industries";
import { businessSelect, contactSelect, funnelSelect, pool } from "@/lib/postgres";
import { detectWebsitePlatform } from "@/lib/site-audit";

interface DiscoveryRequest {
  domain: string;
  businessName: string;
  industryType: string;
  contactName?: string;
  firstName?: string;
  lastName?: string;
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const body: DiscoveryRequest = await req.json();
    if (!body.domain || !body.businessName) {
      return NextResponse.json({ success: false, error: "domain and businessName are required" }, { status: 400 });
    }

    const domain = body.domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();
    const siteResponse = await fetch(`https://${domain}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 RevoraBusinessDiscovery/1.0" },
    });
    if (!siteResponse.ok) {
      return NextResponse.json({ success: false, error: `El dominio no respondió correctamente (${siteResponse.status})` }, { status: 422 });
    }

    const html = await siteResponse.text();
    const platform = detectWebsitePlatform(html);
    const industryType = body.industryType || "general";
    const ind = getIndustry(industryType);
    const domainData = await getDomainEmails(domain);
    let bestContact = domainData?.emails
      ?.slice()
      .sort((a, b) => b.confidence - a.confidence)[0] || null;

    if (!bestContact && (body.firstName || body.lastName)) {
      const found = await findEmail(domain, body.firstName || "", body.lastName || "");
      if (found) bestContact = { value: found.email, type: "person", confidence: found.confidence, sources: found.sources };
    }
    const emailVerified = bestContact?.value ? await verifyEmail(bestContact.value) : false;

    await client.query("BEGIN");
    const businessResult = await client.query(
      `INSERT INTO businesses
       (name,domain,country,business_type,niche,monthly_revenue,platform,brand_color,brand_accent,status,hero_offer,hero_price,pain_point)
       VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,'discovered',$9,$10,$11)
       ON CONFLICT (domain) DO UPDATE SET name=EXCLUDED.name,business_type=EXCLUDED.business_type,
       niche=EXCLUDED.niche,platform=EXCLUDED.platform,status='discovered'
       RETURNING ${businessSelect}`,
      [body.businessName, domain, domainData?.country || "Unknown", industryType,
       ind.defaultNiche, platform, ind.color, ind.accent,
       ind.defaultOffer, ind.defaultPrice, ind.defaultPainPoint]
    );
    const business = businessResult.rows[0];

    let contact = null;
    if (bestContact?.value) {
      const contactResult = await client.query(
        `INSERT INTO contacts (business_id,name,role,email,linkedin_url,confidence_score,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (business_id,email) DO UPDATE SET confidence_score=EXCLUDED.confidence_score,status=EXCLUDED.status
         RETURNING ${contactSelect}`,
        [business.id, body.contactName || [body.firstName, body.lastName].filter(Boolean).join(" ") || "Decision maker",
         bestContact.type || "Business contact", bestContact.value, domainData?.linkedin_url || null,
         Math.round(bestContact.confidence || 0), emailVerified ? "verified" : "discovered"]
      );
      contact = contactResult.rows[0];
    }

    const slug = `${body.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-6)}`;
    const funnelResult = await client.query(
      `INSERT INTO funnels
       (business_id,funnel_name,template_type,headline,subheadline,cta_text,offer_badge,bonus_offer,custom_primary_color,slug)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING ${funnelSelect}`,
      [business.id, `Embudo para ${body.businessName}`, ind.funnelType,
       ind.funnelHeadline(body.businessName, ind.defaultOffer), ind.funnelSubheadline(body.businessName),
       ind.funnelCta, ind.funnelBadge, ind.funnelBonus, ind.color, slug]
    );
    await client.query("COMMIT");

    return NextResponse.json({
      success: true, business, contact, funnel: funnelResult.rows[0],
      emailFound: Boolean(bestContact?.value), emailVerified, platformDetected: platform,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Discovery failed" }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  const result = await pool.query(`SELECT ${businessSelect} FROM businesses WHERE status='discovered' ORDER BY created_at DESC`);
  return NextResponse.json({ success: true, count: result.rows.length, businesses: result.rows });
}
