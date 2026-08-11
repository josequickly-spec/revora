import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";

export interface GeneratedFunnel {
  headline: string;
  subheadline: string;
  heroImage: string;
  ctaText: string;
  offer: string;
  offerBadge: string;
  bonusOffer: string;
  painPoint: string;
  agitationCopy: string;
  solutionCopy: string;
  proofCopy: string;
  eyebrow: string;
  benefits: string[];
  objections: Array<{ question: string; answer: string }>;
  trustPoints: string[];
  audience: string;
  primaryGoal: string;
  valueProposition: string;
  leadMagnet: {
    name: string;
    format: string;
    deliveryPromise: string;
  };
  fascinationBullets: string[];
  ctaOptions: string[];
  welcomeEmail: {
    subject: string;
    previewText: string;
    body: string;
    postscript: string;
  };
  processSteps: Array<{ title: string; description: string }>;
  visualDirection: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  landingPage: {
    brandName: string;
    navigation: string[];
    logoUrl: string;
    heroImageUrl: string;
    preserveOriginalDesign: boolean;
    fontFamily: string;
    headerStyle: string;
    sectionOrder: string[];
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
  };
  otom: {
    hook: { name: string; description: string; psychologicalTrigger: string; pricePoint: number };
    coreOffer: { name: string; description: string; psychologicalTrigger: string; pricePoint: number };
    upsell: { name: string; description: string; psychologicalTrigger: string; pricePoint: number };
    downsell: { name: string; description: string; psychologicalTrigger: string; pricePoint: number };
    pricingStrategy: { anchorPrice: number; suggestedPrice: number; premiumPrice: number; rationale: string };
    psychologicalTriggers: string[];
    customerJourney: Array<{ step: number; action: string; trigger: string; expectedResult: string }>;
    followUp: Array<{ day: number; subject: string; purpose: string; body: string }>;
  };
}

export interface FunnelBusinessContext {
  website?: string;
  country?: string;
  platform?: string;
  offer?: string;
  price?: string;
  audit?: unknown;
  language?: "es" | "en";
  visualIdentity?: {
    logoUrl?: string;
    heroImageUrl?: string;
    colors?: string[];
    fonts?: string[];
    navigation?: string[];
    layout?: string;
  };
}

const offerStepSchema = z.object({
  name: z.string(),
  description: z.string(),
  psychologicalTrigger: z.string(),
  pricePoint: z.number().min(0),
});

const funnelAISchema = z.object({
  headline: z.string(), subheadline: z.string(), ctaText: z.string(), offer: z.string(),
  offerBadge: z.string(), bonusOffer: z.string(), painPoint: z.string(), agitationCopy: z.string(),
  solutionCopy: z.string(), proofCopy: z.string(), eyebrow: z.string(),
  benefits: z.array(z.string()).min(3).max(5),
  objections: z.array(z.object({ question: z.string(), answer: z.string() })).min(2).max(5),
  trustPoints: z.array(z.string()).min(3).max(5), audience: z.string(), primaryGoal: z.string(), valueProposition: z.string(),
  leadMagnet: z.object({ name: z.string(), format: z.string(), deliveryPromise: z.string() }),
  fascinationBullets: z.array(z.string()).length(4), ctaOptions: z.array(z.string()).length(3),
  welcomeEmail: z.object({ subject: z.string(), previewText: z.string(), body: z.string(), postscript: z.string() }),
  processSteps: z.array(z.object({ title: z.string(), description: z.string() })).min(3).max(5),
  visualDirection: z.string(),
  colorScheme: z.object({ primary: z.string(), secondary: z.string(), accent: z.string() }),
  landingPage: z.object({
    brandName: z.string(),
    navigation: z.array(z.string()).min(2).max(6),
    logoUrl: z.string(),
    heroImageUrl: z.string(),
    preserveOriginalDesign: z.boolean(),
    fontFamily: z.string(),
    headerStyle: z.string(),
    sectionOrder: z.array(z.string()).min(5).max(12),
    backgroundColor: z.string(),
    surfaceColor: z.string(),
    textColor: z.string(),
  }),
  otom: z.object({
    hook: offerStepSchema,
    coreOffer: offerStepSchema,
    upsell: offerStepSchema,
    downsell: offerStepSchema,
    pricingStrategy: z.object({
      anchorPrice: z.number().min(0),
      suggestedPrice: z.number().min(0),
      premiumPrice: z.number().min(0),
      rationale: z.string(),
    }),
    psychologicalTriggers: z.array(z.string()).min(3).max(8),
    customerJourney: z.array(z.object({
      step: z.number().int().positive(),
      action: z.string(),
      trigger: z.string(),
      expectedResult: z.string(),
    })).min(5).max(9),
    followUp: z.array(z.object({
      day: z.number().int().min(0),
      subject: z.string(),
      purpose: z.string(),
      body: z.string(),
    })).length(5),
  }),
});

export type FunnelLanguageMode = "es" | "en" | "bilingual";

export interface LocalizedFunnelContent extends GeneratedFunnel {
  defaultLanguage: "es" | "en";
  availableLanguages: Array<"es" | "en">;
  translations: Partial<Record<"es" | "en", GeneratedFunnel>>;
}

export async function generateFunnel(
  businessName: string,
  industryType: string,
  niche: string,
  painPoint: string,
  context: FunnelBusinessContext = {}
): Promise<GeneratedFunnel> {
  const outputLanguage = "English (United States)";
  const prompt = `Act as a senior conversion strategist, UX writer, and business research specialist.
Your job is to create a professional, specific, direct-response lead-acquisition system based solely on the data provided.

OUTPUT LANGUAGE
- Write ALL visible content in ${outputLanguage}.
- Localize the message for the target market; do not translate literally.
- Keep business names, brands, prices, domains, and addresses exactly as given.

BUSINESS DATA
- Name: ${businessName}
- Industry: ${industryType}
- Niche: ${niche}
- Country/market: ${context.country || "not confirmed"}
- Website: ${context.website || "not provided"}
- Detected technology: ${context.platform || "not confirmed"}
- Configured offer (may be a placeholder value): ${context.offer || "not confirmed"}
- Reported price: ${context.price || "not confirmed"}
- Initial problem: ${painPoint}
- Observed site audit: ${JSON.stringify(context.audit || null)}
- Observed visual identity: ${JSON.stringify(context.visualIdentity || null)}

MANDATORY INTERNAL PROCESS
1. Define the audience and their primary intent from industry, niche, and observed data.
2. Choose ONE appropriate conversion action: inquiry, appointment, reservation, quote, trial, visit, or purchase.
3. Build the value proposition with clarity, specificity, and low perceived risk.
4. Order the message: context -> problem -> solution -> benefits -> trust -> objections -> CTA.
5. Check consistency between headline, offer, CTA, and business type.
6. Prioritize the title, description, H1, and other audit signals over generic configured labels.
7. Correctly identify who the customer is: for example, at a dealership the primary action is usually checking inventory, financing, or a test drive; do not offer a vehicle appraisal unless the site indicates purchase or trade-in.
8. Design mobile-first: one idea per section, scannable reading, and a repeatable CTA without clutter.
9. The page must be able to compete with a professional agency landing page, not look like a generic template.
10. Each benefit must answer "what does the customer get" and each step must reduce uncertainty.
11. Infer a concrete buyer persona: situation, intent, frustration, objection, and awareness level.
12. Design a lead magnet with low delivery cost and high perceived value, consistent with the business. Do not claim it already exists: present it as the resource this campaign will deliver.
13. Use PAS: describe the problem precisely, agitate plausible consequences of postponing it, and present the lead magnet as the fast first step, not a miracle cure.
14. Apply reverse psychology in moderation: let the visitor self-disqualify without insulting or manipulating them.
15. Urgency may only be based on time, opportunity cost, or availability that can be confirmed. Never invent slots, deadlines, or scarcity.
16. Write short sentences, a conversational tone, and paragraphs of at most three lines. Avoid the adjectives "revolutionary," "amazing," and "unique."
17. Fascination bullets must reveal the benefit and withhold the mechanism, without misleading promises.
18. CTAs must use first-person ownership verbs and never say "Submit" or "Sign up."
19. The welcome email must deliver or clearly explain how to access the resource, break skepticism, and preview the paid service without pressure.
20. Do not state open rates or CTR percentages. Optimize the subject line for curiosity and relevance, without clickbait.
21. Include the complete OTOM in the same JSON: hook, core offer, upsell, downsell, pricing, five follow-ups, and journey.
22. landingPage is not a new template: it must preserve the observed logo, hero image, colors, typography, navigation, density, and structure.
23. Do not invent resource URLs. When no observed URL exists, use an empty string.
24. The offer, CTA, upsell, downsell, and emails must tell the same business story and use the same names and prices.

EDITORIAL CHECK BEFORE RESPONDING
- Discard any phrase interchangeable with another business. Each block must reflect the observed niche, intent, and problem.
- Verify that no phrase assumes promotions, testimonials, reviews, rates, credit approval, inventory, immediate delivery, or availability unless the audit shows it.
- Do not write "available today," "current promotions," "satisfied customers," or equivalents without explicit evidence.
- The email subject must promise concrete information or open a relevant question; never use "Welcome," "Thanks for signing up," or generic greetings as the main idea.
- The lead magnet must be honestly creatable from the business information. Do not promise an attachment or link that doesn't exist yet; explain that it will arrive at the provided email once the campaign is configured.
- Do one final silent review and rewrite any vague, exaggerated, or unsupported section before producing the JSON.

TRUTHFULNESS RULES
- Do not invent testimonials, customers, years of experience, certifications, discounts, stock, slots, guarantees, results, statistics, or urgency.
- Do not promise revenue or guaranteed results.
- If information is missing, use verifiable language such as "request information" or "check availability."
- Do not use empty clichés like "market leader," "revolutionary," or "the best quality."
- Write in natural, professional, concrete, customer-focused ${outputLanguage}.
- The headline must communicate value, not mention that the page is a funnel.

Respond ONLY with a valid JSON object, no markdown, with exactly this structure:
{
  "eyebrow": "Brief 3-7 word context",
  "audience": "Concrete description of the ideal customer and their intent",
  "primaryGoal": "A single measurable conversion for this landing page",
  "valueProposition": "Why choose this business, without unverified claims",
  "leadMagnet": {
    "name": "Specific, desirable resource name",
    "format": "Audit, guide, checklist, calculator, diagnostic, or other appropriate format",
    "deliveryPromise": "What exactly the lead will receive and how"
  },
  "headline": "Specific headline, max 70 characters",
  "subheadline": "Value proposition, max 160 characters",
  "ctaText": "The best first-person action, max 38 characters",
  "ctaOptions": [
    "First-person ownership CTA 1",
    "First-person ownership CTA 2",
    "First-person ownership CTA 3"
  ],
  "offer": "Coherent, verifiable primary offer",
  "offerBadge": "Informative label with no false urgency",
  "bonusOffer": "Additional value; if none exists, use Personalized evaluation",
  "painPoint": "Specific problem in one sentence",
  "agitationCopy": "Realistic consequence of the problem in 2 sentences",
  "solutionCopy": "How the business helps in 2-3 sentences",
  "proofCopy": "Trust copy based only on observed facts; if no proof exists, explain the next low-risk step",
  "benefits": ["3 to 5 concrete, distinct benefits"],
  "fascinationBullets": [
    "Compelling benefit that withholds the mechanism 1",
    "Compelling benefit that withholds the mechanism 2",
    "Compelling benefit that withholds the mechanism 3",
    "Compelling benefit that withholds the mechanism 4"
  ],
  "trustPoints": ["3 verifiable trust signals or transparent steps"],
  "processSteps": [
    {"title": "Short step 1", "description": "What the visitor does and what happens"},
    {"title": "Short step 2", "description": "What the business does and what the visitor receives"},
    {"title": "Short step 3", "description": "How the conversion completes with no friction"}
  ],
  "visualDirection": "Specific visual direction: tone, hero composition, image type, and color usage; do not generate a URL",
  "objections": [
    {"question": "Real objection 1", "answer": "Careful answer"},
    {"question": "Real objection 2", "answer": "Careful answer"},
    {"question": "Real objection 3", "answer": "Careful answer"}
  ],
  "welcomeEmail": {
    "subject": "Brief, specific, credible subject line",
    "previewText": "Preview text that complements the subject",
    "body": "Mobile email with welcome, resource access, skepticism-breaking, and one concrete next step. Use line breaks.",
    "postscript": "P.S. that naturally previews the paid product or service"
  },
  "colorScheme": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB"
  },
  "landingPage": {
    "brandName": "Exact brand name",
    "navigation": ["Home", "Benefits", "Offer", "FAQ"],
    "logoUrl": "Observed URL or empty string",
    "heroImageUrl": "Observed URL or empty string",
    "preserveOriginalDesign": true,
    "fontFamily": "Observed font or compatible recommendation",
    "headerStyle": "Brief description of the original header and layout",
    "sectionOrder": ["hero", "trust", "problem", "solution", "offer", "upsell", "faq", "lead-capture"],
    "backgroundColor": "#RRGGBB",
    "surfaceColor": "#RRGGBB",
    "textColor": "#RRGGBB"
  },
  "otom": {
    "hook": {"name":"...","description":"...","psychologicalTrigger":"...","pricePoint":0},
    "coreOffer": {"name":"...","description":"...","psychologicalTrigger":"...","pricePoint":0},
    "upsell": {"name":"...","description":"...","psychologicalTrigger":"...","pricePoint":0},
    "downsell": {"name":"...","description":"...","psychologicalTrigger":"...","pricePoint":0},
    "pricingStrategy": {"anchorPrice":0,"suggestedPrice":0,"premiumPrice":0,"rationale":"Assumptions and logic, without presenting estimates as facts"},
    "psychologicalTriggers": ["3 to 8 honest triggers"],
    "customerJourney": [{"step":1,"action":"...","trigger":"...","expectedResult":"..."}],
    "followUp": [
      {"day":0,"subject":"...","purpose":"Delivery","body":"..."},
      {"day":1,"subject":"...","purpose":"Value","body":"..."},
      {"day":3,"subject":"...","purpose":"Objection","body":"..."},
      {"day":5,"subject":"...","purpose":"Offer","body":"..."},
      {"day":7,"subject":"...","purpose":"Honest close","body":"..."}
    ]
  }
}`;

  const generation = await generateStructured({
    task: "strategy",
    schemaName: "funnel_content",
    schema: funnelAISchema,
    system: "You are a senior conversion strategist and UX writer. Use only the evidence provided and avoid unverified claims.",
    user: prompt,
    timeoutMs: 150_000,
  });
  const identity = context.visualIdentity;
  return {
    ...generation.output,
    colorScheme: {
      primary: identity?.colors?.[0] || generation.output.colorScheme.primary,
      secondary: identity?.colors?.[1] || identity?.colors?.[0] || generation.output.colorScheme.secondary,
      accent: identity?.colors?.[2] || generation.output.colorScheme.accent,
    },
    landingPage: {
      ...generation.output.landingPage,
      brandName: businessName,
      logoUrl: identity?.logoUrl || "",
      heroImageUrl: identity?.heroImageUrl || "",
      preserveOriginalDesign: Boolean(context.website && identity),
      navigation: identity?.navigation && identity.navigation.length >= 2
        ? identity.navigation.slice(0, 6)
        : generation.output.landingPage.navigation,
      fontFamily: identity?.fonts?.[0] || generation.output.landingPage.fontFamily,
      headerStyle: identity?.layout || generation.output.landingPage.headerStyle,
    },
    heroImage: `hero-${businessName.toLowerCase().replace(/\s+/g, "-")}.jpg`,
  };
}

export async function generateLocalizedFunnel(
  businessName: string,
  industryType: string,
  niche: string,
  painPoint: string,
  context: FunnelBusinessContext = {},
  mode: FunnelLanguageMode = "en"
): Promise<LocalizedFunnelContent> {
  const languages: Array<"es" | "en"> = mode === "bilingual" ? ["en", "es"] : [mode];
  const generated = await Promise.all(
    languages.map(async (language) => [
      language,
      await generateFunnel(businessName, industryType, niche, painPoint, { ...context, language }),
    ] as const)
  );
  const translations = Object.fromEntries(generated) as Partial<Record<"es" | "en", GeneratedFunnel>>;
  const defaultLanguage: "es" | "en" = mode === "es" ? "es" : "en";
  const primary = translations[defaultLanguage] || translations[languages[0]];
  if (!primary) throw new Error("Could not generate the localized content");
  return {
    ...primary,
    defaultLanguage,
    availableLanguages: languages,
    translations,
  };
}

export async function generateFunnelVariations(
  businessName: string,
  industryType: string,
  niche: string,
  painPoint: string,
  count: number = 3
): Promise<GeneratedFunnel[]> {
  const variations: GeneratedFunnel[] = [];
  for (let i = 0; i < count; i++) {
    const funnel = await generateFunnel(
      businessName,
      industryType,
      niche,
      painPoint
    );
    variations.push(funnel);
    if (i < count - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  return variations;
}
