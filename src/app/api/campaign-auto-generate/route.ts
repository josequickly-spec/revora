import { NextRequest, NextResponse } from "next/server";
import { generateFunnel } from "@/lib/funnel-generator";
import { auditSite, type SiteAudit } from "@/lib/site-audit";
import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";
import { findLatestAudit } from "@/lib/funnelspy-store";
import { enqueueJob, getJob } from "@/lib/job-queue";

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

const requestSchema = z.object({
  businessName: z.string().min(1),
  website: z.string().optional(),
  industry: z.string().optional(),
  monthlyRevenue: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative().optional()),
  averageOrderValue: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative().optional()),
  conversionRate: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative().optional()),
  monthlyAdSpend: z.preprocess((v) => (v === "" ? undefined : Number(v)), z.number().nonnegative().optional()),
});

// Minimal funnel validation schema for the fields this route consumes
const minimalFunnelSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  ctaText: z.string().min(1),
  offer: z.string().optional(),
  offerBadge: z.string().optional(),
  bonusOffer: z.string().optional(),
  painPoint: z.string().optional(),
  agitationCopy: z.string().optional(),
  solutionCopy: z.string().optional(),
  proofCopy: z.string().optional(),
  colorScheme: z.object({ primary: z.string().min(4), secondary: z.string().min(4), accent: z.string().min(4) }).optional(),
  otom: z.any().optional(),
});

async function generateSEOAnalysis(businessName: string, audit: SiteAudit) {
  const generation = await generateStructured({
    task: "bulk",
    schemaName: "seo_analysis",
    schema: seoAnalysisSchema,
    system: "You are an SEO specialist. Use exclusively the evidence provided. Do not invent traffic, competitors, customers, revenue, or results.",
    user: `Analyze the business: "${businessName}" using exclusively this observed site data:
${JSON.stringify(audit)}

Provide ONLY valid JSON without markdown:
{
  "seoScore": number between 0-100,
  "topKeywords": ["keyword1", "keyword2", "keyword3"],
  "mainIssues": ["issue1", "issue2"],
  "quickWins": ["win1", "win2"],
  "recommendations": ["rec1", "rec2", "rec3"]
}`,
  });
  return generation.output;
}

function normalizeWebsiteInput(input?: string) {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // If it looks like a domain, prefix https://
  if (/^[^\s\/]+\.[^\s]{2,}$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json();
    const parseResult = requestSchema.safeParse(raw);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid request', details: parseResult.error.flatten() }, { status:400 });
    }
    const body = parseResult.data;
    const { businessName } = body;
    const website = normalizeWebsiteInput(body.website);

    if (!businessName || !website) {
      return NextResponse.json(
        { error: "Business name and a public website are required. Name-only analysis is disabled." },
        { status:400 }
      );
    }

    // Enqueue background work and return202 with job id
    const jobId = await enqueueJob({ body, website });
    return NextResponse.json({ success: true, jobId }, { status:202 });
  } catch (error) {
    console.error("Auto-generation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Generation failed",
      },
      { status:500 }
    );
  }
}

export async function GET(req: NextRequest) {
 const id = req.nextUrl.searchParams.get("jobId");
 if (!id) return NextResponse.json({ error: "jobId required" }, { status:400 });
 const job = await getJob(id);
 if (!job) return NextResponse.json({ error: "Not found" }, { status:404 });
 return NextResponse.json({ success: true, job }, { status:200 });
}
