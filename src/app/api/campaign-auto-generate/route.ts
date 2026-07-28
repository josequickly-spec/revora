import { NextRequest, NextResponse } from "next/server";
import { generateFunnel } from "@/lib/funnel-generator";
import { generateOutreachSequence } from "@/lib/outreach-generator";
import { auditSite, type SiteAudit } from "@/lib/site-audit";

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
  };
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

async function generateSEOAnalysis(businessName: string, audit: SiteAudit | null): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Eres experto en SEO. Analiza el negocio: "${businessName}" usando exclusivamente estos datos observados del sitio:
${JSON.stringify(audit)}

Proporciona SOLO JSON válido sin markdown:
{
  "seoScore": número entre 0-100,
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "competitors": ["competitor1", "competitor2", "competitor3"],
  "mainIssues": ["issue1", "issue2"],
  "quickWins": ["win1", "win2"],
  "estimatedTraffic": número,
  "recommendations": ["rec1", "rec2", "rec3"]
}`,
        },
      ],
      max_tokens: 500,
    }),
  });

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  let content = data.choices[0].message.content;
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(content);
}

export async function POST(req: NextRequest) {
  try {
    const body: AutoGenerateRequest = await req.json();
    const { businessName, website, industry = "Negocio general" } = body;

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name required" },
        { status: 400 }
      );
    }

    console.log(`Starting auto-generation for: ${businessName}`);

    // PHASE 1: SEO Analysis (NEW)
    console.log("📊 Generating SEO Analysis...");
    const siteAudit = website ? await auditSite(website) : null;
    const seoAnalysis = await generateSEOAnalysis(businessName, siteAudit);

    // PHASE 2: Landing Page (REUTILIZA funnel-generator.ts)
    console.log("🎨 Generating Landing Page via Phase 2...");
    const landingPage = await generateFunnel(
      businessName,
      industry,
      "Premium Services",
      seoAnalysis.mainIssues?.[0] || "Business growth"
    );

    // PHASE 3: Email Sequence & Video (REUTILIZA outreach-generator.ts)
    console.log("✉️ Generating Email Sequence via Phase 3...");
    const outreach = await generateOutreachSequence(
      "Decisor",
      businessName,
      landingPage.offer,
      landingPage.painPoint,
      landingPage.bonusOffer
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
        audience: [industry, "Business Owners", "Decision makers", "25-65"],
      },
    };

    // PHASE 5: Revenue Projections (based on SEO and market data)
    const estimatedTraffic = Math.max(0, Number(seoAnalysis.estimatedTraffic) || 0);
    const conversionRate = Math.max(0, Number(body.conversionRate) || 0) / 100;
    const averageOrderValue = Math.max(0, Number(body.averageOrderValue) || 0);
    const currentRevenue = Math.max(0, Number(body.monthlyRevenue) || 0);
    const adSpendEstimate = Math.max(0, Number(body.monthlyAdSpend) || 0);
    const projectedConversions = estimatedTraffic * conversionRate;
    const projectedRevenue = projectedConversions * averageOrderValue;
    const incrementalRevenue = Math.max(0, projectedRevenue - currentRevenue);

    const projections = {
      monthlyRevenue: currentRevenue,
      projectedRevenue: Math.round(projectedRevenue),
      incrementalRevenue: Math.round(incrementalRevenue),
      expectedROI: adSpendEstimate > 0 ? Math.round((incrementalRevenue / adSpendEstimate) * 100) : null,
      breakEvenDays: incrementalRevenue > 0 && adSpendEstimate > 0
        ? Math.ceil(adSpendEstimate / (incrementalRevenue / 30)) : null,
      estimatedTraffic,
      conversionRate: conversionRate * 100,
      averageOrderValue,
      monthlyAdSpend: adSpendEstimate,
    };

    const campaign: CampaignPackage = {
      businessName,
      status: "ready",
      analysis: {
        seoScore: siteAudit?.score ?? seoAnalysis.seoScore ?? 0,
        competitors: seoAnalysis.competitors || [],
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
      },
      emailSequence: outreach.emailSequence.map((email) => ({
        number: email.index,
        subject: email.subject,
        body: email.body,
        delay: email.delay,
      })),
      videoScript: outreach.videoPitch,
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
