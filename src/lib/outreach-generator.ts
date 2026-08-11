import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";

export interface EmailSequence {
  subject: string;
  body: string;
  cta: string;
  purpose: string;
  delay: number;
  index: number;
}

export interface VideoPitch {
  title: string;
  script: string;
  duration: string;
  cta: string;
  segments: Array<{ time: string; label: string; copy: string }>;
  videoUrl?: string | null;
}

export interface OutreachBusinessContext {
  website?: string;
  contactRole?: string;
  industry?: string;
  location?: string;
  audience?: string;
  problems?: string[];
  opportunity?: string;
  previewUrl?: string;
  previewDescription?: string;
  previewAvailable?: boolean;
  objective?: string;
  senderName?: string;
  senderCompany?: string;
  selectedInsights?: Array<{
    title: string;
    observation: string;
    evidence: string;
  }>;
  auditOpportunities?: string[];
  auditEvidence?: string[];
  priorityIssues?: string[];
  hook?: string;
  coreOffer?: string;
  upsell?: string;
  downsell?: string;
  customerJourney?: string[];
  valueProposition?: string;
}

export interface GeneratedOutreach {
  firstEmail: {
    subjectOptions: string[];
    selectedSubject: string;
    opening: string;
    insights: Array<{ title: string; observation: string; evidence: string }>;
    body: string;
    cta: string;
    fullEmail: string;
    confidence: number;
    warnings: string[];
  };
  emailSequence: EmailSequence[];
  videoPitch: VideoPitch;
  personalizationUsed: string[];
  claimsToVerify: string[];
  followUpTiming: {
    firstEmail: string;
    videoEmail: string;
    followUp1: string;
    followUp2: string;
  };
}

const outreachSchema = z.object({
  firstEmail: z.object({
    subjectOptions: z.array(z.string().max(80)).length(3),
    selectedSubject: z.string().max(80),
    opening: z.string(),
    insights: z.array(z.object({
      title: z.string(),
      observation: z.string(),
      evidence: z.string(),
    })).max(2),
    body: z.string(),
    cta: z.string(),
    fullEmail: z.string(),
    confidence: z.number().min(0).max(100),
    warnings: z.array(z.string()),
  }),
  emailSequence: z.array(z.object({
    subject: z.string(),
    body: z.string(),
    cta: z.string(),
    purpose: z.string(),
    delay: z.number().int().min(0),
    index: z.number().int().min(1).max(5),
  })).length(5),
  videoPitch: z.object({
    title: z.string(),
    script: z.string(),
    duration: z.string(),
    cta: z.string(),
    segments: z.array(z.object({ time: z.string(), label: z.string(), copy: z.string() })).length(4),
    videoUrl: z.string().nullable(),
  }),
  personalizationUsed: z.array(z.string()).max(12),
  claimsToVerify: z.array(z.string()).max(12),
  followUpTiming: z.object({
    firstEmail: z.string(),
    videoEmail: z.string(),
    followUp1: z.string(),
    followUp2: z.string(),
  }),
});

export async function generateOutreachSequence(
  contactName: string,
  businessName: string,
  offerHeadline: string,
  painPoint: string,
  bonusOffer: string,
  context: OutreachBusinessContext = {},
): Promise<GeneratedOutreach> {
  const selectedInsights = (context.selectedInsights || []).slice(0, 2);
  const auditOpportunities = context.auditOpportunities || context.problems || [painPoint].filter(Boolean);
  const auditEvidence = context.auditEvidence || [];
  const priorityIssues = context.priorityIssues || [];
  const previewAvailable = context.previewAvailable ?? Boolean(context.previewUrl);
  const previewDescription = context.previewDescription || "Preview prepared from the selected evidence";
  const hook = context.hook || offerHeadline;
  const coreOffer = context.coreOffer || offerHeadline;
  const upsell = context.upsell || bonusOffer;
  const downsell = context.downsell || "Conservative implementation option";
  const customerJourney = context.customerJourney || [];
  const valueProposition = context.valueProposition || offerHeadline;

  const generation = await generateStructured({
    task: "strategy",
    schemaName: "professional_b2b_outreach",
    schema: outreachSchema,
    timeoutMs: 120_000,
    system: "Act as a senior B2B outreach strategist specializing in CRO, funnels, ecommerce, services, and digital growth. Write everything in clear English. Use only supplied evidence. Never invent a problem, metric, result, or promise. Treat the selected insights as the single source of truth for the first email, Loom, and preview story.",
    user: `Create a professional five-email sequence and a 90-second Loom script.

MASTER OBJECTIVE
- Generate a first-touch outreach sequence that feels like a short consultative note, not a mass email.
- The first email must be brief, credible, and based on exactly two verified insights.
- Do not sell directly, do not promise results, and do not ask for a meeting in the first email.

BUSINESS DATA
- Name: ${businessName}
- Website: ${context.website || "not confirmed"}
- Decision-maker: ${contactName || "decision-maker not identified"}
- Role: ${context.contactRole || "not confirmed"}
- Industry: ${context.industry || "not confirmed"}
- Location: ${context.location || "not confirmed"}
- Offer: ${offerHeadline || "not confirmed"}
- Audience: ${context.audience || "not confirmed"}
- Detected problems: ${JSON.stringify(auditOpportunities)}
- Main opportunity: ${context.opportunity || bonusOffer || "improve the sales journey"}
- Hook: ${hook}
- Core offer: ${coreOffer}
- Upsell: ${upsell}
- Downsell: ${downsell}
- Customer journey: ${JSON.stringify(customerJourney)}
- Value proposition: ${valueProposition}
- Preview created: ${previewAvailable ? "yes" : "no"}
- Preview URL: ${context.previewUrl || "not yet available"}
- Preview description: ${previewDescription}
- Objective: ${context.objective || "get the decision-maker to review the proposal and accept a short conversation"}
- Sender: ${context.senderName || "Strategy team"}
- Sender company: ${context.senderCompany || "EcoScale Partner"}

AUDIT INSIGHTS
- Opportunities: ${JSON.stringify(auditOpportunities)}
- Evidence: ${JSON.stringify(auditEvidence)}
- Priority issues: ${JSON.stringify(priorityIssues)}
- Selected insight 1: ${selectedInsights[0] ? JSON.stringify(selectedInsights[0]) : "not provided"}
- Selected insight 2: ${selectedInsights[1] ? JSON.stringify(selectedInsights[1]) : "not provided"}

EMAIL RULES
- Return firstEmail as the canonical evidence brief for the first touch.
- firstEmail.subjectOptions must contain exactly three human subject lines of no more than seven words each.
- firstEmail.insights may contain exactly two insights only when two are supported by evidence. Each must retain its evidence verbatim or as a faithful concise paraphrase.
- If fewer than two insights are sufficiently supported, use only the supported insights and add "Insufficient verified audit insights" to firstEmail.warnings.
- firstEmail.confidence must reflect the quantity and quality of real evidence available.
- Email 1 must be 100-160 words, with a maximum of 190 words, and should be the most consultative email in the sequence.
- Email 1 must mention exactly two verified opportunities from the audit or selected insights.
- Email 1 must not include a link unless previewAvailable is true and the chosen CTA is direct.
- Email 1 should ask for a simple response if the preview should be sent, or provide the preview link if the CTA is direct.
- Emails 2-5 can expand the idea but must remain concise and consistent with the same evidence.
- The sequence must stay in English and sound human, not templated.
- Show the business was reviewed and mention only verified problems or opportunities without attacking the brand.
- Present the preview as a concept proposal, never as a definitive audit.
- Do not invent figures, customers, testimonials, urgency, revenue, or results.
- Do not use technical jargon, emojis, aggressive language, or more than one question per email.
- The CTA must be low-friction and the call should be framed as a short next step, not a hard sell.
- Use one CTA only. When a preview URL is available, either ask permission to send the preview plus a 90-second video or link directly to the preview, never both.
- emailSequence[0] must use firstEmail.selectedSubject and firstEmail.fullEmail without changing the two insights.

LOOM RULES
- Return exactly four segments: 00:00-00:15 Hook, 00:15-00:45 Walkthrough, 00:45-01:15 Offer, 01:15-01:30 CTA.
- The script must be consultative, specific, and consistent with the emails.
- The Loom should reuse the same two selected insights and the same preview story.
- If the preview link is missing, note that it must be added before sending and add that warning to claimsToVerify.

OUTPUT
- firstEmail must include subjectOptions, selectedSubject, opening, insights, body, cta, fullEmail, confidence, and warnings.
- emailSequence must contain exactly five objects, indexed 1-5, with purpose, subject, body, cta, and delay.
- personalizationUsed lists only the data actually used.
- claimsToVerify lists any data that must be confirmed before approving the send.`,
  });
  return generation.output;
}

export async function generateVideoPitch(contactName: string, businessName: string, offer: string): Promise<string> {
  const generated = await generateOutreachSequence(contactName, businessName, offer, "", "");
  return generated.videoPitch.script;
}
