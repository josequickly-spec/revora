import { NextResponse } from "next/server";
import { generateOutreachSequence } from "@/lib/outreach-generator";
import { pool } from "@/lib/postgres";
import { z } from "zod";
import { enqueueJob, getJob, createWorker } from "@/lib/job-queue";

function toInsight(title: string, observation: string, evidence: string) {
  return { title, observation, evidence };
}

function asTextList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
}

const requestSchema = z.object({
  businessId: z.preprocess((v) => Number(v), z.number().int().nonnegative().optional()),
  contactId: z.preprocess((v) => Number(v), z.number().int().nonnegative().optional()),
  contactName: z.string().min(1).optional(),
  businessName: z.string().min(1).optional(),
  recipientEmail: z.string().email().optional(),
  campaignId: z.string().optional(),
  previewUrl: z.string().url().optional(),
  previewDescription: z.string().optional(),
  problems: z.array(z.string()).optional(),
  offerHeadline: z.string().optional(),
  bonusOffer: z.string().optional(),
  painPoint: z.string().optional(),
  website: z.string().optional(),
  contactRole: z.string().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  audience: z.string().optional(),
  objective: z.string().optional(),
  opportunity: z.string().optional(),
  senderName: z.string().optional(),
  senderCompany: z.string().optional(),
  selectedInsights: z.array(z.object({ title: z.string(), observation: z.string(), evidence: z.string() })).optional(),
  auditOpportunities: z.array(z.string()).optional(),
  auditEvidence: z.array(z.string()).optional(),
  priorityIssues: z.array(z.string()).optional(),
  hook: z.string().optional(),
  coreOffer: z.string().optional(),
  upsell: z.string().optional(),
  downsell: z.string().optional(),
  customerJourney: z.array(z.string()).optional(),
  valueProposition: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid request', details: parsed.error.flatten() }, { status:400 });
    }
    const body = parsed.data;

    // Enqueue payload with high priority and limited retries
    const jobPayload = { body, requestUrl: req.url };
    const jobId = await enqueueJob(jobPayload, { priority:1, attempts:2, backoff: { type: 'exponential', delay:500 } });
    return NextResponse.json({ success: true, jobId }, { status:202 });
  } catch (error) {
    console.error('Outreach generation error (enqueue):', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Outreach generation failed" },
      { status:500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ success: false, error: 'jobId required' }, { status:400 });
    const job = await getJob(jobId);
    if (!job) return NextResponse.json({ success: false, error: 'Not found' }, { status:404 });
    return NextResponse.json({ success: true, job }, { status:200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed' }, { status:500 });
  }
}

// Create worker when this module is loaded in server runtime with higher concurrency
try {
  createWorker(async (job) => {
    const payload = job.data as { body: Record<string, any>; requestUrl: string };
    const body = payload.body;
    const origin = new URL(payload.requestUrl).origin;

    const businessId = Number(body.businessId ||0);
    const contactId = Number(body.contactId ||0);

    const [businessResult, contactResult, funnelResult, auditResult] = await Promise.all([
      businessId
        ? pool.query(`SELECT * FROM businesses WHERE id=$1 LIMIT1`, [businessId])
        : Promise.resolve({ rows: [] }),
      contactId
        ? pool.query(`SELECT * FROM contacts WHERE id=$1 AND ($2::bigint=0 OR business_id=$2) LIMIT1`, [contactId, businessId])
        : businessId
          ? pool.query(`SELECT * FROM contacts WHERE business_id=$1 AND email<>'' ORDER BY id DESC LIMIT1`, [businessId])
          : Promise.resolve({ rows: [] }),
      businessId
        ? pool.query(`SELECT * FROM funnels WHERE business_id=$1 ORDER BY id DESC LIMIT1`, [businessId])
        : Promise.resolve({ rows: [] }),
      businessId
        ? pool.query(`SELECT report FROM funnelspy_audits WHERE business_id=$1 AND report IS NOT NULL ORDER BY created_at DESC LIMIT1`, [businessId])
        : Promise.resolve({ rows: [] }),
    ]);
    const business = businessResult.rows[0] || {};
    const contact = contactResult.rows[0] || {};
    const funnel = funnelResult.rows[0] || {};
    const auditReport = auditResult.rows[0]?.report || {};
    const localized = funnel.content_json?.translations?.en || funnel.content_json || {};
    const otom = localized.otom || {};
    const recommendations = Array.isArray(auditReport.recommendations) ? auditReport.recommendations : [];
    const weaknesses = asTextList(auditReport.weaknesses);
    const strengths = asTextList(auditReport.strengths);
    const limitations = asTextList(auditReport.limitations);
    const summaryFacts = [
      String(auditReport.executiveSummary || ""),
      String(auditReport.primaryObjective || ""),
      String(auditReport.targetAudience || ""),
      String(auditReport.valueProposition || ""),
      String(funnel.headline || ""),
      String(funnel.subheadline || ""),
      String(funnel.painPoint || ""),
      String(funnel.solution || ""),
      String(funnel.proof || ""),
      String(otom.hook?.description || ""),
      String(otom.coreOffer?.description || ""),
      String(otom.upsell?.description || ""),
      String(otom.customerJourney?.map((step: Record<string, unknown>) => `${step.step || ""}. ${step.action || ""} ${step.expectedResult || ""}`).join(" ") || ""),
    ].filter(Boolean);
    const evidenceLines = [...weaknesses, ...limitations, ...strengths, ...summaryFacts].filter(Boolean);
    const recommendationInsights = recommendations.flatMap((recommendation: Record<string, unknown>, index: number) => {
      const observation = String(recommendation.action || recommendation.expectedImpact || "").trim();
      const evidence = evidenceLines[index]?.trim();
      if (!observation || !evidence) return [];
      return [toInsight(String(recommendation.title || `Opportunity ${index +1}`), observation, evidence)];
    });
    const weaknessInsights = weaknesses.flatMap((weakness, index) => {
      const evidence = evidenceLines[index]?.trim();
      if (!weakness.trim() || !evidence) return [];
      return [toInsight(`Verified opportunity ${index +1}`, weakness, evidence)];
    });
    const selectedInsights = [...recommendationInsights, ...weaknessInsights]
      .filter((insight, index, items) => items.findIndex((item) => item.observation === insight.observation) === index)
      .slice(0,2);

    const contactName = body.contactName || contact.name;
    const businessName = body.businessName || business.name;
    const recipientEmailRaw = body.recipientEmail || contact.email;
    const recipientEmail = typeof recipientEmailRaw === 'string' ? recipientEmailRaw.trim().toLowerCase() : undefined;
    if (!contactName || !businessName || !recipientEmail) {
      throw new Error("Missing contact or business data for generation");
    }

    const previewUrl = body.previewUrl || (funnel.slug ? `${origin}/en/funnel/${funnel.slug}` : undefined);
    const previewDescription = body.previewDescription || localized.subheadline || funnel.subheadline || "Preview prepared from the selected evidence.";
    const problems = Array.isArray(body.problems) && body.problems.length
      ? body.problems
      : [...(auditReport.weaknesses || []), ...(auditReport.limitations || [])].slice(0,3);
    const offerHeadline = body.offerHeadline || otom.coreOffer?.name || localized.offer || business.hero_offer || "Personalized business proposal";
    const opportunity = body.opportunity || otom.coreOffer?.description || funnel.subheadline || auditReport.primaryObjective;
    const bonusOffer = body.bonusOffer || funnel.bonus_offer || "Implementation plan";

    const generated = await generateOutreachSequence(
      contactName,
      businessName,
      offerHeadline,
      body.painPoint || problems[0] || business.pain_point || "Improve the continuity of the sales journey",
      bonusOffer,
      {
        website: body.website || business.domain,
        contactRole: body.contactRole || contact.role,
        industry: body.industry || business.business_type,
        location: body.location || business.city || business.country,
        audience: body.audience || auditReport.targetAudience || business.niche,
        problems,
        opportunity,
        previewUrl,
        previewDescription,
        previewAvailable: Boolean(previewUrl),
        objective: body.objective,
        senderName: body.senderName,
        senderCompany: body.senderCompany,
        selectedInsights: Array.isArray(body.selectedInsights)
          ? body.selectedInsights.filter((item: Record<string, unknown>) => item?.title && item?.observation && item?.evidence).slice(0,2)
          : selectedInsights,
        auditOpportunities: body.auditOpportunities || [...recommendations.map((item: Record<string, unknown>) => String(item.title || item.action || "")), ...weaknesses, ...limitations].filter(Boolean),
        auditEvidence: body.auditEvidence || summaryFacts.slice(0,8),
        priorityIssues: body.priorityIssues || [...weaknesses, ...limitations].slice(0,5),
        hook: body.hook || otom.hook?.description || funnel.headline || offerHeadline,
        coreOffer: body.coreOffer || otom.coreOffer?.description || offerHeadline,
        upsell: body.upsell || otom.upsell?.description || bonusOffer || "",
        downsell: body.downsell || otom.downsell?.description || "Conservative implementation option",
        customerJourney: body.customerJourney || (Array.isArray(otom.customerJourney) ? otom.customerJourney.map((step: Record<string, unknown>) => `${step.step || ""}. ${step.action || ""}`.trim()) : []),
        valueProposition: body.valueProposition || auditReport.valueProposition || funnel.valueProposition || offerHeadline,
      },
    );

    if (!generated || !generated.firstEmail || typeof generated.firstEmail.selectedSubject !== 'string' || typeof generated.firstEmail.fullEmail !== 'string') {
      throw new Error('AI generation failed to produce a valid first email');
    }

    const firstEmail = generated.firstEmail;
    const result = await pool.query(
      `INSERT INTO outreach_messages
       (business_id,contact_id,campaign_id,recipient_email,email_subject,email_body,email_sequence,video_script,
        selected_insights,subject_options,generation_warnings,confidence,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'draft') RETURNING *`,
      [body.businessId || null, body.contactId || null, body.campaignId || null,
       recipientEmail, firstEmail.selectedSubject, firstEmail.fullEmail,
       JSON.stringify(generated.emailSequence), JSON.stringify(generated.videoPitch),
       JSON.stringify(firstEmail.insights), JSON.stringify(firstEmail.subjectOptions),
       JSON.stringify(firstEmail.warnings), firstEmail.confidence]
    );

    // return result as job return value
    return {
      outreach: result.rows[0],
      firstEmail,
      emailSequence: generated.emailSequence,
      videoPitch: generated.videoPitch,
      personalizationUsed: generated.personalizationUsed,
      claimsToVerify: generated.claimsToVerify,
    };
  }, { concurrency:3 });
} catch (err) {
  console.warn('Worker creation skipped in non-server environment or failed:', err);
}
