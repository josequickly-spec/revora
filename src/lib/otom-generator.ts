import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";
import {
  businessProfileSchema,
  type BusinessProfile,
  type BusinessProfileInput,
} from "@/lib/business-profile";

const otomStepSchema = z.object({
  name: z.string(),
  description: z.string(),
  psychologicalTrigger: z.string(),
  expectedConversion: z.number().min(0).max(1),
  pricePoint: z.number().min(0),
});

export type OTOMStep = z.infer<typeof otomStepSchema>;

export interface OTOMStrategy {
  hook: OTOMStep;
  coreOffer: OTOMStep;
  upsell: OTOMStep;
  downsell: OTOMStep;
  followUp: {
    email1: string;
    email2: string;
    email3: string;
    email4: string;
    email5: string;
  };
  pricingStrategy: {
    anchorPrice: number;
    suggestedPrice: number;
    premiumPrice: number;
    upselledValue: string;
  };
  revenueProjection: {
    trafficAssumed: number;
    conversionRate: number;
    avgCustomerValue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
  psychologicalTriggers: string[];
  customerJourney: Array<{
    step: number;
    action: string;
    trigger: string;
    expectedResult: string;
  }>;
  landingPage: LandingPageSpec;
}

export interface LandingPageSpec {
  brandName: string;
  navigation: string[];
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  trustItems: string[];
  heroVisualConcept: string;
  leadCaptureHeadline: string;
  leadCaptureBody: string;
  leadCaptureCta: string;
  thankYouHeadline: string;
  thankYouBody: string;
  preserveOriginalDesign: boolean;
  logoUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  fontFamily: string;
  headerStyle: string;
  sectionOrder: string[];
}

const landingPageSpecSchema = z.object({
  brandName: z.string(),
  navigation: z.array(z.string()).min(2).max(4),
  eyebrow: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  primaryCta: z.string(),
  secondaryCta: z.string(),
  trustItems: z.array(z.string()).min(2).max(4),
  heroVisualConcept: z.string(),
  leadCaptureHeadline: z.string(),
  leadCaptureBody: z.string(),
  leadCaptureCta: z.string(),
  thankYouHeadline: z.string(),
  thankYouBody: z.string(),
  preserveOriginalDesign: z.boolean(),
  logoUrl: z.string(),
  heroImageUrl: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  backgroundColor: z.string(),
  surfaceColor: z.string(),
  textColor: z.string(),
  fontFamily: z.string(),
  headerStyle: z.string(),
  sectionOrder: z.array(z.string()).min(4).max(10),
});

const otomAIOutputSchema = z.object({
  profile: businessProfileSchema,
  hook: otomStepSchema,
  coreOffer: otomStepSchema,
  upsell: otomStepSchema,
  downsell: otomStepSchema,
  followUp: z.object({
    email1: z.string(),
    email2: z.string(),
    email3: z.string(),
    email4: z.string(),
    email5: z.string(),
  }),
  pricingStrategy: z.object({
    anchorPrice: z.number().min(0),
    suggestedPrice: z.number().min(0),
    premiumPrice: z.number().min(0),
    upselledValue: z.string(),
  }),
  psychologicalTriggers: z.array(z.string()).min(3).max(8),
  customerJourney: z
    .array(
      z.object({
        step: z.number().int().positive(),
        action: z.string(),
        trigger: z.string(),
        expectedResult: z.string(),
      }),
    )
    .min(5)
    .max(10),
  landingPage: landingPageSpecSchema,
});

export async function generateOTOM(input: BusinessProfileInput): Promise<{
  profile: BusinessProfile;
  otom: OTOMStrategy;
  provider: string;
  model: string;
}> {
  const outputLanguage = "natural US English";
  const generation = await generateStructured({
    task: "otom",
    schemaName: "otom_strategy",
    schema: otomAIOutputSchema,
    timeoutMs: 150_000,
    system: `You are a senior monetization strategist. Return a traceable business profile and a specific, editable OTOM strategy written entirely in ${outputLanguage}.`,
    user: `First normalize the profile, then create the complete OTOM.

AVAILABLE CONTEXT:
${JSON.stringify(input, null, 2)}

RULES:
- Write all visible fields in ${outputLanguage}.
- Use status "verified" only when the value appears directly in the context or evidence.
- Use status "inferred" when you reasonably fill in a value.
- Use status "requires_confirmation" for prices, identity, or other data the client must confirm.
- Briefly explain the source or reasoning in evidence.
- currentPrice 0 means unknown: recommend prices, but mark the current price as requires_confirmation.
- Do not invent traffic, sales, customers, testimonials, guarantees, or scarcity.
- Create the hook, core offer, upsell, downsell, five emails, pricing strategy, triggers, and customer journey.
- Create landingPage as an evolved reconstruction of the original site, not a generic template.
- If visualIdentity contains logoUrl, heroImageUrl, colors, fonts, navigation, or layout, reuse them literally and preserve the original visual language, hierarchy, density, and navigation model.
- preserveOriginalDesign must be true when sourceUrl and visualIdentity provide useful evidence.
- Do not invent logo or image URLs. Use an empty string if none were captured.
- Integrate the new CTA, offer, and OTOM steps within the original visual model; changes should look like a natural evolution of the same brand.
- trustItems may only contain guarantees, facilities, or attributes supported by the context. If there is no evidence, use neutral process messages like "Clear confirmation" or "Simple next step".
- heroVisualConcept describes an appropriate image or composition; it does not claim to be a real photo of the business.
- The emails must sell honestly and never use nonexistent social proof.`,
  });
  const result = generation.output;
  const trafficAssumed = 1_000;
  const conversionRate = result.coreOffer.expectedConversion;
  const avgCustomerValue =
    result.coreOffer.pricePoint +
    result.upsell.pricePoint * result.upsell.expectedConversion +
    result.downsell.pricePoint * result.downsell.expectedConversion;
  const monthlyRevenue = trafficAssumed * conversionRate * avgCustomerValue;
  const identity = input.visualIdentity;
  const preservedLandingPage: LandingPageSpec = {
    ...result.landingPage,
    preserveOriginalDesign: Boolean(input.sourceUrl && identity),
    logoUrl: identity?.logoUrl || "",
    heroImageUrl: identity?.heroImageUrl || "",
    navigation: identity?.navigation && identity.navigation.length >= 2
      ? identity.navigation.slice(0, 4)
      : result.landingPage.navigation,
    primaryColor: identity?.colors?.[0] || result.landingPage.primaryColor,
    secondaryColor: identity?.colors?.[1] || identity?.colors?.[0] || result.landingPage.secondaryColor,
    fontFamily: identity?.fonts?.[0] || result.landingPage.fontFamily,
    headerStyle: identity?.layout || result.landingPage.headerStyle,
  };

  return {
    profile: result.profile,
    provider: generation.provider,
    model: generation.model,
    otom: {
      hook: result.hook,
      coreOffer: result.coreOffer,
      upsell: result.upsell,
      downsell: result.downsell,
      followUp: result.followUp,
      pricingStrategy: result.pricingStrategy,
      psychologicalTriggers: result.psychologicalTriggers,
      customerJourney: result.customerJourney,
      landingPage: preservedLandingPage,
      revenueProjection: {
        trafficAssumed,
        conversionRate,
        avgCustomerValue,
        monthlyRevenue,
        yearlyRevenue: monthlyRevenue * 12,
      },
    },
  };
}
