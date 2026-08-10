import { NextResponse } from "next/server";
import { z } from "zod";
import { generateLocalizedFunnel, type FunnelLanguageMode } from "@/lib/funnel-generator";
import { getIndustry } from "@/lib/industries";
import { funnelSelect, pool } from "@/lib/postgres";
import { funnelAIReportSchema } from "@/lib/funnelspy-ai";
import { checkRateLimit } from "@/lib/funnelspy-rate-limit";
import type { FunnelSpyAnalysis } from "@/lib/funnelspy";
import { analyzeFunnel } from "@/lib/funnelspy";
import { attachVisualIdentity } from "@/lib/funnelspy-store";

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
  auditId: z.string().uuid().optional(),
  languageMode: z.enum(["es", "en", "bilingual"]).default("en"),
});

export const runtime = "nodejs";
export const maxDuration = 180;

function businessNameFromDomain(domain: string) {
  const name = domain.replace(/^www\./, "").split(".")[0].replace(/[-_]+/g, " ");
  return name.replace(/\b\w/g, (character) => character.toUpperCase());
}

function businessNameFromAnalysis(analysis: z.infer<typeof requestSchema>["analysis"]) {
  const title = analysis.pages.find((page) => page.kind === "home")?.title
      ?.split(/[|–—]/)[0]
    .trim();
  return title && title.length <= 120 ? title : businessNameFromDomain(analysis.domain);
}

function truncateAtWord(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const shortened = value.slice(0, maxLength + 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > maxLength * 0.7 ? boundary : maxLength).trim()}…`;
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
    if (!limit.allowed) return NextResponse.json({ error: "Temporary generation limit reached." }, { status: 429 });

    const input = requestSchema.parse(await request.json());
    let { analysis } = input;
    const { report } = input;
    const suppliedIdentity = (analysis as unknown as FunnelSpyAnalysis).visualIdentity;
    const hasVisualEvidence = Boolean(
      suppliedIdentity?.logoUrl || suppliedIdentity?.heroImageUrl || suppliedIdentity?.colors?.length || suppliedIdentity?.fonts?.length || suppliedIdentity?.navigation?.length,
    );
    if (!hasVisualEvidence) {
      const refreshed = await analyzeFunnel(analysis.origin).catch(() => null);
      if (refreshed) {
        analysis = { ...analysis, visualIdentity: refreshed.visualIdentity };
        if (input.auditId && refreshed.visualIdentity) {
          await attachVisualIdentity(input.auditId, refreshed.visualIdentity).catch(() => undefined);
        }
      }
    }
    const languageMode = "en" as FunnelLanguageMode;
    const businessName = businessNameFromAnalysis(analysis);
    const industryType = inferIndustry(report, analysis.technologies);
    const industry = getIndustry(industryType);
    const niche = report.targetAudience || industry.defaultNiche;
    const painPoint = report.weaknesses[0] || report.limitations[0] || industry.defaultPainPoint;
    const platform = analysis.technologies.join(", ").slice(0, 100) || "Website";

    const businessResult = await pool.query(
      `INSERT INTO businesses
       (name, domain, country, business_type, niche, platform, status, hero_offer, hero_price, pain_point, technology_data)
       VALUES ($1, $2, 'Unknown', $3, $4, $5, 'analyzed', $6, 'Ask for details', $7, $8)
       ON CONFLICT (domain) DO UPDATE SET
        name = EXCLUDED.name,
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
        truncateAtWord(niche, 145),
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
        visualIdentity: (analysis as unknown as FunnelSpyAnalysis).visualIdentity,
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
        en: `/en/funnel/${slug}`,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("FunnelSpy funnel creation failed", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Could not create the funnel.",
    }, { status: 500 });
  }
}
