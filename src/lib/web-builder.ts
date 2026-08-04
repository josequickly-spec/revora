import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";
import {
  businessProfileInputSchema,
  type BusinessProfileInput,
} from "@/lib/business-profile";

const commercialCardSchema = z.object({
  name: z.string(),
  description: z.string(),
  price: z.number().min(0),
  category: z.string(),
  badge: z.string(),
  imageUrl: z.string(),
});

export const webBuilderRequestSchema = businessProfileInputSchema.extend({
  otomSummary: z.string().trim().max(8_000).optional().default(""),
});

export const webBuilderSpecSchema = z.object({
  brand: z.object({
    name: z.string(),
    tagline: z.string(),
    navigation: z.array(z.string()).min(3).max(6),
    primaryColor: z.string(),
    accentColor: z.string(),
    backgroundColor: z.string(),
    surfaceColor: z.string(),
    textColor: z.string(),
    fontFamily: z.string(),
    logoUrl: z.string(),
    heroImageUrl: z.string(),
  }),
  announcement: z.string(),
  hero: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string(),
    route: z.array(z.string()).min(3).max(5),
  }),
  trustItems: z.array(z.string()).min(3).max(5),
  categories: z.array(z.object({
    name: z.string(),
    description: z.string(),
  })).min(3).max(6),
  products: z.array(commercialCardSchema).min(3).max(6),
  leadMagnet: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    cta: z.string(),
  }),
  story: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
  }),
  bundle: z.object({
    eyebrow: z.string(),
    headline: z.string(),
    body: z.string(),
    price: z.number().min(0),
    cta: z.string(),
  }),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(3).max(6),
  footer: z.object({
    headline: z.string(),
    body: z.string(),
    cta: z.string(),
  }),
  projection: z.object({
    currencyCode: z.string().regex(/^[A-Z]{3}$/),
    monthlyTraffic: z.number().min(0),
    currentConversionRate: z.number().min(0).max(100),
    targetConversionRate: z.number().min(0).max(100),
    currentAverageValue: z.number().min(0),
    targetAverageValue: z.number().min(0),
  }),
  evidenceNotes: z.array(z.string()).min(2).max(8),
  demoDisclaimer: z.string(),
});

export type WebBuilderRequest = z.infer<typeof webBuilderRequestSchema>;
export type WebBuilderSpec = z.infer<typeof webBuilderSpecSchema>;

function preservedIdentity(spec: WebBuilderSpec, input: BusinessProfileInput): WebBuilderSpec {
  const identity = input.visualIdentity;
  const ratesLookLikeRatios =
    spec.projection.currentConversionRate > 0 &&
    spec.projection.targetConversionRate > 0 &&
    spec.projection.currentConversionRate <= 0.2 &&
    spec.projection.targetConversionRate <= 0.2;
  return {
    ...spec,
    brand: {
      ...spec.brand,
      name: input.businessName || spec.brand.name,
      logoUrl: identity?.logoUrl || "",
      heroImageUrl: identity?.heroImageUrl || "",
      navigation: identity?.navigation && identity.navigation.length >= 3
        ? identity.navigation.slice(0, 6)
        : spec.brand.navigation,
      primaryColor: identity?.colors?.[0] || spec.brand.primaryColor,
      accentColor: identity?.colors?.[1] || identity?.colors?.[0] || spec.brand.accentColor,
      fontFamily: identity?.fonts?.[0] || spec.brand.fontFamily,
    },
    products: spec.products.map((product) => ({
      ...product,
      imageUrl: /^https?:\/\//i.test(product.imageUrl) ? product.imageUrl : "",
    })),
    projection: ratesLookLikeRatios
      ? {
          ...spec.projection,
          currentConversionRate: spec.projection.currentConversionRate * 100,
          targetConversionRate: spec.projection.targetConversionRate * 100,
        }
      : spec.projection,
  };
}

export async function generateWebBuilderSpec(input: WebBuilderRequest) {
  const outputLanguage = input.locale === "en" ? "natural US English" : "natural Latin American Spanish";
  const generation = await generateStructured({
    task: "strategy",
    schemaName: "ai_web_builder_spec",
    schema: webBuilderSpecSchema,
    timeoutMs: 120_000,
    system: `You are a senior ecommerce experience architect. Return a client-ready website blueprint entirely in ${outputLanguage} that preserves available brand evidence and improves the commercial journey without fabricating proof.`,
    user: `Create a complete interactive website preview blueprint.

BUSINESS CONTEXT:
${JSON.stringify(input, null, 2)}

RULES:
- Write every visible field in ${outputLanguage}.
- This is a client preview, not a live store. demoDisclaimer must say so clearly.
- Preserve the supplied logo, colors, fonts, navigation and hero image. Never invent asset URLs.
- Product names, bundles and prices may be proposed, but evidenceNotes must mark them as concepts requiring client confirmation.
- Never invent customers, testimonials, certifications, inventory, guarantees, urgency or revenue history.
- Use neutral trust items when evidence is unavailable.
- Build a full page: announcement, navigation, hero, trust, categories, products, lead magnet, story, bundle, FAQ and footer.
- Products should demonstrate the offer architecture and upsell. Use an empty imageUrl unless an exact public product URL is present in the context.
- Projection values are editable planning assumptions, not promises. Use conservative rates.
- projection conversion rates must use percentage points: write 1 for 1%, never 0.01.
- currencyCode must be the ISO 4217 currency supported by the available market evidence; use USD only when the market is unknown.
- Write conversion-focused copy with a premium, specific voice appropriate to the business.
- Keep headlines short enough to render cleanly on mobile.`,
  });

  return {
    spec: preservedIdentity(generation.output, input),
    provider: generation.provider,
    model: generation.model,
    warnings: generation.warnings,
  };
}
