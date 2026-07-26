import { NextRequest, NextResponse } from "next/server";
import { generateFunnel } from "@/lib/funnel-generator";
import { generateOutreachSequence } from "@/lib/outreach-generator";

interface AutoGenerateRequest {
  businessName: string;
  website?: string;
  industry?: string;
}

interface CampaignPackage {
  businessName: string;
  status: "analyzing" | "ready";
  analysis: {
    seoScore: number;
    competitors: string[];
    keywords: string[];
    opportunities: string[];
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
    expectedROI: number;
    breakEvenDays: number;
  };
}

async function generateSEOAnalysis(businessName: string): Promise<any> {
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
          content: `Eres experto en SEO. Analiza el negocio: "${businessName}".

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
    const { businessName, website, industry = "Ecommerce" } = body;

    if (!businessName) {
      return NextResponse.json(
        { error: "Business name required" },
        { status: 400 }
      );
    }

    console.log(`Starting auto-generation for: ${businessName}`);

    // PHASE 1: SEO Analysis (NEW)
    console.log("📊 Generating SEO Analysis...");
    const seoAnalysis = await generateSEOAnalysis(businessName);

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
    const estimatedTraffic = seoAnalysis.estimatedTraffic || 100;
    const conversionRate = 0.05; // 5% average conversion rate
    const averageOrderValue = 200; // Average $200 per conversion
    const monthlyRevenue = Math.floor(
      estimatedTraffic * 30 * conversionRate * averageOrderValue
    );
    const adSpendEstimate = monthlyRevenue * 0.2; // 20% ad spend
    const profitMargin = monthlyRevenue - adSpendEstimate;

    const projections = {
      monthlyRevenue: Math.max(monthlyRevenue, 5000),
      expectedROI: Math.floor((profitMargin / adSpendEstimate) * 100),
      breakEvenDays: Math.max(Math.floor((adSpendEstimate * 1.5) / (monthlyRevenue / 30)), 7),
      estimatedTraffic,
      conversionRate: (conversionRate * 100).toFixed(1),
      averageOrderValue,
      monthlyAdSpend: Math.floor(adSpendEstimate),
    };

    const campaign: CampaignPackage = {
      businessName,
      status: "ready",
      analysis: {
        seoScore: seoAnalysis.seoScore || 65,
        competitors: seoAnalysis.competitors || [],
        keywords: seoAnalysis.topKeywords || [],
        opportunities: seoAnalysis.quickWins || [],
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
