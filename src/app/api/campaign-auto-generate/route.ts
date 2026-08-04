import { NextRequest, NextResponse } from "next/server";
import { generateFunnel } from "@/lib/funnel-generator";
import { auditSite, type SiteAudit } from "@/lib/site-audit";
import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";
import { findLatestAudit } from "@/lib/funnelspy-store";

interface AutoGenerateRequest {
  businessName: string;
  website?: string;
  industry?: string;
  monthlyRevenue?: number;
  averageOrderValue?: number;
  conversionRate?: number;
  monthlyAdSpend?: number;
}

interface CampaignPackage {
  businessName: string;
  status: "analyzing" | "ready";
  analysis: {
    seoScore: number;
    competitors: string[];
    keywords: string[];
    opportunities: string[];
    audit?: SiteAudit | null;
  };
  landingPage: {
    headline: string;
    subheadline: string;
    painPoint: string;
    solution: string;
    proof: string;
    cta: string;
    colors: { primary: string; secondary: string; accent: string };
    layout?: Record<string, unknown>;
  };
  otom?: Record<string, unknown>;
  emailSequence: Array<{
    number: number;
    subject: string;
    body: string;
    delay: number;
  }>;
  videoScript: {
    title: string;
    script: string;
    duration: string;
  };
  adsStrategy: {
    google: {
      keywords: string[];
      copy: string[];
    };
    facebook: {
      copy: string[];
      audience: string[];
    };
  };
  projections: {
    monthlyRevenue: number;
    expectedROI: number | null;
    breakEvenDays: number | null;
  };
}

const seoAnalysisSchema = z.object({
  seoScore: z.number().min(0).max(100),
  topKeywords: z.array(z.string()).max(12),
  mainIssues: z.array(z.string()).max(8),
  quickWins: z.array(z.string()).max(8),
  recommendations: z.array(z.string()).max(10),
});

async function generateSEOAnalysis(businessName: string, audit: SiteAudit) {
  const generation = await generateStructured({
    task: "bulk",
    schemaName: "seo_analysis",
    schema: seoAnalysisSchema,
    system: "Eres especialista en SEO. Usa exclusivamente la evidencia suministrada. No inventes tráfico, competidores, clientes, ingresos ni resultados.",
    user: `Analiza el negocio: "${businessName}" usando exclusivamente estos datos observados del sitio:
${JSON.stringify(audit)}

Proporciona SOLO JSON válido sin markdown:
{
  "seoScore": número entre 0-100,
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "mainIssues": ["issue1", "issue2"],
  "quickWins": ["win1", "win2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`,
  });
  return generation.output;
}

export async function POST(req: NextRequest) {
  try {
    const body: AutoGenerateRequest = await req.json();
    const { businessName, website, industry = "Negocio general" } = body;

    if (!businessName || !website) {
      return NextResponse.json(
        { error: "Business name and a public website are required. Name-only analysis is disabled." },
        { status: 400 }
      );
    }

    console.log(`Starting auto-generation for: ${businessName}`);

    // PHASE 1: SEO Analysis (NEW)
    console.log("📊 Generating SEO Analysis...");
    const siteAudit = await auditSite(website);
    const latestFunnelSpy = await findLatestAudit(new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`).hostname).catch(() => null);
    const seoAnalysis = await generateSEOAnalysis(businessName, siteAudit);

    // PHASE 2: Landing Page (REUTILIZA funnel-generator.ts)
    console.log("🎨 Generating Landing Page via Phase 2...");
    const landingPage = await generateFunnel(
      businessName,
      industry,
      "Premium Services",
      seoAnalysis.mainIssues?.[0] || "Business growth",
      {
        website,
        offer: undefined,
        audit: siteAudit,
        visualIdentity: latestFunnelSpy?.analysis.visualIdentity,
      },
    );

    // PHASE 4: Ads Strategy (using SEO keywords)
    const adsStrategy = {
      google: {
        keywords: seoAnalysis.topKeywords || [],
        copy: [
          `${businessName}: ${landingPage.headline}`,
          `${landingPage.offer} - Acceso ${landingPage.offerBadge}`,
          `Transform Your Business - ${landingPage.headline}`,
        ],
      },
      facebook: {
        copy: [
          landingPage.headline,
          landingPage.subheadline,
          landingPage.agitationCopy,
        ],
        audience: [],
      },
    };

    // PHASE 5: Revenue Projections (based on SEO and market data)
    const currentRevenue = Math.max(0, Number(body.monthlyRevenue) || 0);

    const projections = {
      monthlyRevenue: currentRevenue,
      projectedRevenue: null,
      incrementalRevenue: null,
      expectedROI: null,
      breakEvenDays: null,
      estimatedTraffic: null,
      conversionRate: body.conversionRate ?? null,
      averageOrderValue: body.averageOrderValue ?? null,
      monthlyAdSpend: body.monthlyAdSpend ?? null,
      disclaimer: "No revenue projection is calculated until verified traffic, conversion and sales baselines are connected.",
    };

    const campaign: CampaignPackage = {
      businessName,
      status: "ready",
      analysis: {
        seoScore: siteAudit?.score ?? seoAnalysis.seoScore ?? 0,
        competitors: [],
        keywords: seoAnalysis.topKeywords || [],
        opportunities: seoAnalysis.quickWins || [],
        audit: siteAudit,
      },
      landingPage: {
        headline: landingPage.headline,
        subheadline: landingPage.subheadline,
        painPoint: landingPage.painPoint,
        solution: landingPage.solutionCopy,
        proof: landingPage.proofCopy,
        cta: landingPage.ctaText,
        colors: landingPage.colorScheme,
        layout: landingPage.landingPage,
      },
      otom: landingPage.otom,
      emailSequence: [],
      videoScript: {
        title: "Outreach pending verified contact",
        script: "",
        duration: "",
      },
      adsStrategy,
      projections,
    };

    console.log("✅ Campaign generated successfully (using existing Phases)");

    return NextResponse.json(
      {
        success: true,
        campaign,
        message: "Complete package generated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auto-generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
