import { NextResponse } from "next/server";
import { findEmail, getDomainEmails, verifyEmail } from "@/lib/hunter";
import { getIndustry } from "@/lib/industries";
import { businessSelect, contactSelect, funnelSelect, pool } from "@/lib/postgres";
import { auditSite, detectWebsitePlatform } from "@/lib/site-audit";
import { FunnelLanguageMode, generateLocalizedFunnel } from "@/lib/funnel-generator";

interface DiscoveryRequest {
  domain?: string;
  businessName: string;
  industryType?: string;
  businessCategory?: string;
  city?: string;
  zipcode?: string;
  contactName?: string;
  firstName?: string;
  lastName?: string;
  languageMode?: FunnelLanguageMode;
}

interface LocationMatch {
  display_name: string;
  name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

async function findLocation(body: DiscoveryRequest) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", [body.businessName, body.city, body.zipcode].filter(Boolean).join(" "));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("extratags", "1");
  url.searchParams.set("limit", "8");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "RevoraBusinessDiscovery/1.0 (public business research)" },
  });
  if (!response.ok) throw new Error(`OpenStreetMap respondió ${response.status}`);
  return await response.json() as LocationMatch[];
}

async function fetchWebsite(domain: string) {
  for (const protocol of ["https", "http"]) {
    const response = await fetch(`${protocol}://${domain}`, {
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 RevoraBusinessDiscovery/1.0" },
    }).catch(() => null);
    if (response?.ok) return response;
  }
  return null;
}

export async function POST(req: Request) {
  const client = await pool.connect();
  try {
    const body: DiscoveryRequest = await req.json();
    if (!body.businessName || (!body.domain && !body.city && !body.zipcode)) {
      return NextResponse.json(
        { success: false, error: "Indica el negocio y un dominio, ciudad o código postal" },
        { status: 400 }
      );
    }

    let locationMatch: LocationMatch | null = null;
    let discoveredUrl = body.domain?.trim() || "";
    if (!discoveredUrl) {
      const matches = await findLocation(body);
      const normalizedName = body.businessName.trim().toLowerCase();
      locationMatch = matches.find(match => {
        const website = match.extratags?.website || match.extratags?.["contact:website"];
        return Boolean(website) && (match.name || match.display_name).toLowerCase().includes(normalizedName);
      }) || matches.find(match => Boolean(match.extratags?.website || match.extratags?.["contact:website"])) || null;
      discoveredUrl = locationMatch?.extratags?.website || locationMatch?.extratags?.["contact:website"] || "";
      if (!discoveredUrl) {
        return NextResponse.json({
          success: false,
          error: "Encontré negocios en esa ubicación, pero ninguno tiene una web pública verificable. Añade el dominio manualmente.",
          candidates: matches.slice(0, 5).map(match => ({
            name: match.name || match.display_name.split(",")[0],
            address: match.display_name,
          })),
        }, { status: 422 });
      }
    }

    const domain = discoveredUrl.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();
    const siteResponse = await fetchWebsite(domain);
    if (!siteResponse) {
      return NextResponse.json({ success: false, error: "La web encontrada no respondió correctamente" }, { status: 422 });
    }

    const html = await siteResponse.text();
    const platform = detectWebsitePlatform(html);
    const industryType = body.industryType || "general";
    const ind = getIndustry(industryType);
    const niche = body.businessCategory?.trim() || ind.defaultNiche;
    const audit = await auditSite(siteResponse.url || domain).catch(() => null);
    const generatedFunnel = await generateLocalizedFunnel(
      body.businessName,
      industryType,
      niche,
      ind.defaultPainPoint,
      {
        website: siteResponse.url || domain,
        country: locationMatch?.address?.country,
        platform,
        audit,
      },
      body.languageMode || "bilingual"
    );
    const domainData = await getDomainEmails(domain);
    let bestContact = domainData?.emails?.slice().sort((a, b) => b.confidence - a.confidence)[0] || null;
    if (!bestContact && (body.firstName || body.lastName)) {
      const found = await findEmail(domain, body.firstName || "", body.lastName || "");
      if (found) bestContact = { value: found.email, type: "person", confidence: found.confidence, sources: found.sources };
    }
    const emailVerified = bestContact?.value ? await verifyEmail(bestContact.value) : false;
    const address = locationMatch?.address || {};

    await client.query("BEGIN");
    const businessResult = await client.query(
      `INSERT INTO businesses
       (name,domain,country,city,postal_code,address,business_type,niche,monthly_revenue,platform,brand_color,brand_accent,status,hero_offer,hero_price,pain_point)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10,$11,'discovered',$12,$13,$14)
       ON CONFLICT (domain) DO UPDATE SET name=EXCLUDED.name,business_type=EXCLUDED.business_type,
       niche=EXCLUDED.niche,platform=EXCLUDED.platform,city=EXCLUDED.city,
       postal_code=EXCLUDED.postal_code,address=EXCLUDED.address,status='discovered'
       RETURNING ${businessSelect}`,
      [
        body.businessName, domain, address.country || domainData?.country || "Unknown",
        body.city || address.city || address.town || address.village || null,
        body.zipcode || address.postcode || null, locationMatch?.display_name || null,
        industryType, niche, platform, ind.color, ind.accent,
        ind.defaultOffer, ind.defaultPrice, ind.defaultPainPoint,
      ]
    );
    const business = businessResult.rows[0];

    let contact = null;
    if (bestContact?.value) {
      const contactResult = await client.query(
        `INSERT INTO contacts (business_id,name,role,email,linkedin_url,confidence_score,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (business_id,email) DO UPDATE SET confidence_score=EXCLUDED.confidence_score,status=EXCLUDED.status
         RETURNING ${contactSelect}`,
        [
          business.id, body.contactName || [body.firstName, body.lastName].filter(Boolean).join(" ") || "Decision maker",
          bestContact.type || "Business contact", bestContact.value, domainData?.linkedin_url || null,
          Math.round(bestContact.confidence || 0), emailVerified ? "verified" : "discovered",
        ]
      );
      contact = contactResult.rows[0];
    }

    const slug = `${body.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-6)}`;
    const funnelResult = await client.query(
      `INSERT INTO funnels
       (business_id,funnel_name,template_type,headline,subheadline,cta_text,offer_badge,bonus_offer,custom_primary_color,slug,content_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING ${funnelSelect}`,
      [
        business.id, `Embudo para ${body.businessName}`, ind.funnelType,
        generatedFunnel.headline, generatedFunnel.subheadline,
        generatedFunnel.ctaText, generatedFunnel.offerBadge, generatedFunnel.bonusOffer,
        generatedFunnel.colorScheme.primary, slug, JSON.stringify(generatedFunnel),
      ]
    );
    await client.query("COMMIT");

    return NextResponse.json({
      success: true, business, contact, funnel: funnelResult.rows[0],
      emailFound: Boolean(bestContact?.value), emailVerified, platformDetected: platform,
      domainDiscovered: !body.domain, locationMatched: locationMatch?.display_name || null,
      availableLanguages: generatedFunnel.availableLanguages,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Discovery failed" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function GET() {
  const result = await pool.query(`SELECT ${businessSelect} FROM businesses WHERE status='discovered' ORDER BY created_at DESC`);
  return NextResponse.json({ success: true, count: result.rows.length, businesses: result.rows });
}
