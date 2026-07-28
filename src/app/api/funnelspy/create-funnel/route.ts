import { NextResponse } from "next/server";
import { z } from "zod";
import { generateLocalizedFunnel, type FunnelLanguageMode } from "@/lib/funnel-generator";
import { getIndustry } from "@/lib/industries";
import { funnelSelect, pool } from "@/lib/postgres";
import { funnelAIReportSchema } from "@/lib/funnelspy-ai";
import { checkRateLimit } from "@/lib/funnelspy-rate-limit";

const requestSchema = z.object({
  analysis: z.object({
    domain: z.string().min(3),
    origin: z.string().url(),
    score: z.number(),
    scoreLabel: z.string(),
    technologies: z.array(z.string()),
    pixels: z.array(z.string()),
    pages: z.array(z.object({
      url: z.string(),
      title: z.string(),
      description: z.string(),
      kind: z.string(),
      ctas: z.array(z.string()),
      forms: z.number(),
    })),
  }).passthrough(),
  report: funnelAIReportSchema,
  languageMode: z.enum(["es", "en", "bilingual"]).default("bilingual"),
});

export const runtime = "nodejs";
export const maxDuration = 180;

function businessNameFromDomain(domain: string) {
  const name = domain.replace(/^www\./, "").split(".")[0].replace(/[-_]+/g, " ");
  return name.replace(/\b\w/g, (character) => character.toUpperCase());
}

function inferIndustry(report: z.infer<typeof funnelAIReportSchema>, technologies: string[]) {
  if (report.funnelType === "ecommerce" || technologies.includes("Shopify")) return "ecommerce";
  if (report.funnelType === "subscription") return "saas";
  if (report.funnelType === "appointment") return "professional";
  if (report.funnelType === "local-business") return "general";
  return "general";
}

export async function POST(request: Request) {
  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const limit = checkRateLimit(`create-funnel:${client}`, 6);
    if (!limit.allowed) return NextResponse.json({ error: "Límite temporal de generación alcanzado." }, { status: 429 });

    const input = requestSchema.parse(await request.json());
    const { analysis, report } = input;
    const languageMode = input.languageMode as FunnelLanguageMode;
    const businessName = businessNameFromDomain(analysis.domain);
    const industryType = inferIndustry(report, analysis.technologies);
    const industry = getIndustry(industryType);
    const niche = report.targetAudience || industry.defaultNiche;
    const painPoint = report.weaknesses[0] || report.limitations[0] || industry.defaultPainPoint;
    const platform = analysis.technologies.join(", ").slice(0, 100) || "Website";

    const businessResult = await pool.query(
      `INSERT INTO businesses
       (name, domain, country, business_type, niche, platform, status, hero_offer, hero_price, pain_point, technology_data)
       VALUES ($1, $2, 'Unknown', $3, $4, $5, 'analyzed', $6, 'Consultar', $7, $8)
       ON CONFLICT (domain) DO UPDATE SET
         business_type = EXCLUDED.business_type,
         niche = EXCLUDED.niche,
         platform = EXCLUDED.platform,
         hero_offer = EXCLUDED.hero_offer,
         pain_point = EXCLUDED.pain_point,
         technology_data = EXCLUDED.technology_data
       RETURNING id::int AS id`,
      [
        businessName,
        analysis.domain,
        industryType,
        niche.slice(0, 150),
        platform,
        report.primaryObjective,
        painPoint,
        JSON.stringify({ technologies: analysis.technologies, pixels: analysis.pixels, funnelSpyScore: analysis.score }),
      ],
    );
    const businessId = businessResult.rows[0].id as number;
    const auditEvidence = {
      domain: analysis.domain,
      score: analysis.score,
      scoreLabel: analysis.scoreLabel,
      pages: analysis.pages.slice(0, 8),
      technologies: analysis.technologies,
      pixels: analysis.pixels,
      strategicReport: report,
    };

    const generated = await generateLocalizedFunnel(
      businessName,
      industryType,
      niche,
      painPoint,
      {
        website: analysis.origin,
        platform,
        offer: report.primaryObjective,
        audit: auditEvidence,
      },
      languageMode,
    );
    const slug = `${analysis.domain.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now().toString().slice(-6)}`;
    const result = await pool.query(
      `INSERT INTO funnels
       (business_id, funnel_name, template_type, headline, subheadline, cta_text, offer_badge, bonus_offer, custom_primary_color, slug, content_json)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING ${funnelSelect}`,
      [
        businessId,
        `FunnelSpy · ${businessName}`,
        industry.funnelType,
        generated.headline,
        generated.subheadline,
        generated.ctaText,
        generated.offerBadge,
        generated.bonusOffer,
        generated.colorScheme.primary,
        slug,
        JSON.stringify(generated),
      ],
    );
    return NextResponse.json({
      success: true,
      funnel: result.rows[0],
      previewUrls: {
        es: generated.availableLanguages.includes("es") ? `/es/funnel/${slug}` : null,
        en: generated.availableLanguages.includes("en") ? `/en/funnel/${slug}` : null,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("FunnelSpy funnel creation failed", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "No fue posible crear el funnel.",
    }, { status: 500 });
  }
}
