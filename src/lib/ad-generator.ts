export interface AdCreative {
  headline: string;
  subheading: string;
  description: string;
  cta: string;
  imagePrompt: string;
  targetAudience: string;
  estimatedCPC: number;
  platform: "facebook" | "google" | "instagram";
}

export interface AdCampaign {
  id: string;
  name: string;
  businessName: string;
  budget: number;
  dailyBudget: number;
  creatives: AdCreative[];
  targetAudience: string;
  geolocation: string;
  duration: number;
  roi_target: number;
  platform: "facebook" | "google" | "instagram";
}

const adCampaignAISchema = z.object({
  name: z.string(),
  dailyBudget: z.number().nonnegative(),
  creatives: z.array(z.object({
    headline: z.string(), subheading: z.string(), description: z.string(), cta: z.string(),
    imagePrompt: z.string(), targetAudience: z.string(), estimatedCPC: z.number().nonnegative(),
  })).min(1).max(6),
  targetAudience: z.string(), geolocation: z.string(), duration: z.number().positive(), roi_target: z.number().nonnegative(),
});

const optimizationSchema = z.object({ recommendations: z.array(z.string()).min(3).max(5) });

export async function generateAdCampaign(
  businessName: string,
  offer: string,
  painPoint: string,
  budget: number,
  platform: "facebook" | "google" | "instagram"
): Promise<AdCampaign> {
  const prompt = `You are an expert in performance marketing and ad copywriting.

Generate high-ROI ad campaigns for:
Business: ${businessName}
Offer: ${offer}
Problem: ${painPoint}
Budget: $${budget}
Platform: ${platform}

Respond with JSON ONLY:
{
  "name": "Descriptive campaign name",
  "dailyBudget": ${budget / 30},
  "creatives": [
    {
      "headline": "Main headline, max 30 characters",
      "subheading": "Subheading, max 50 characters",
      "description": "Description, 80-120 characters",
      "cta": "CTA button: Learn More, Get Started, etc",
      "imagePrompt": "Detailed prompt for AI image generation",
      "targetAudience": "Specific audience: age, interest, behavior",
      "estimatedCPC": estimated_cost_per_click_number
    }
  ],
  "targetAudience": "Target audience description",
  "geolocation": "US, LATAM, etc",
  "duration": 30,
  "roi_target": 300
}`;

  const generation = await generateStructured({
    task: "bulk",
    schemaName: "ad_campaign",
    schema: adCampaignAISchema,
    system: "You are a responsible advertising specialist. Do not invent historical results, availability, social proof, or guarantees.",
    user: prompt,
  });
  return {
    id: `camp_${Date.now()}`,
    businessName,
    budget,
    platform,
    ...generation.output,
    creatives: generation.output.creatives.map((creative) => ({ ...creative, platform })),
  };
}

export async function generateAIBotOptimizations(
  campaignId: string,
  metrics: {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    revenue?: number;
  }
): Promise<{
  ctr: number;
  conversionRate: number;
  cpc: number;
  roas: number;
  recommendations: string[];
}> {
  const ctr = (metrics.clicks / metrics.impressions) * 100;
  const conversionRate = (metrics.conversions / metrics.clicks) * 100;
  const cpc = metrics.spend / metrics.clicks;
  const roas = metrics.spend > 0 ? (metrics.revenue || 0) / metrics.spend : 0;

  const prompt = `You are an expert in ad campaign optimization.

Current metrics:
- CTR: ${ctr.toFixed(2)}%
- Conversion Rate: ${conversionRate.toFixed(2)}%
- CPC: $${cpc.toFixed(2)}
- ROAS: ${roas.toFixed(2)}x

Give me 3 SPECIFIC recommendations to improve. Respond as a JSON array of strings.`;

  try {
    const generation = await generateStructured({
      task: "bulk",
      schemaName: "ad_optimizations",
      schema: optimizationSchema,
      system: "You are a campaign analyst. Base each recommendation exclusively on the metrics provided.",
      user: `${prompt}\nRespond as an object with a recommendations property.`,
    });

    return {
      ctr,
      conversionRate,
      cpc,
      roas,
      recommendations: generation.output.recommendations,
    };
  } catch (error) {
    console.error("AI optimization error:", error);
    return {
      ctr,
      conversionRate,
      cpc,
      roas,
      recommendations: [
        "Aumenta frecuencia del anuncio",
        "Prueba audiencias mas segmentadas",
        "Mejora copy del CTA",
      ],
    };
  }
}
import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";
