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
  const prompt = `Eres experto en performance marketing y ad copywriting.

Genera campañas publicitarias de alto ROI para:
Negocio: ${businessName}
Oferta: ${offer}
Problema: ${painPoint}
Presupuesto: $${budget}
Plataforma: ${platform}

Responde SOLO JSON:
{
  "name": "Nombre campaña descriptivo",
  "dailyBudget": ${budget / 30},
  "creatives": [
    {
      "headline": "Titular principal max 30 caracteres",
      "subheading": "Subtítulo max 50 caracteres",
      "description": "Descripción 80-120 caracteres",
      "cta": "Botón CTA: Learn More, Get Started, etc",
      "imagePrompt": "Prompt detallado para generar imagen con IA",
      "targetAudience": "Audiencia especifica: Edad, interes, comportamiento",
      "estimatedCPC": numero_costo_por_click_estimado
    }
  ],
  "targetAudience": "Descripcion audiencia objetivo",
  "geolocation": "ES, USA, LATAM, etc",
  "duration": 30,
  "roi_target": 300
}`;

  const generation = await generateStructured({
    task: "bulk",
    schemaName: "ad_campaign",
    schema: adCampaignAISchema,
    system: "Eres especialista en publicidad responsable. No inventes resultados históricos, disponibilidad, prueba social ni garantías.",
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

  const prompt = `Eres experto en optimizacion de campañas publicitarias.

Metricas actuales:
- CTR: ${ctr.toFixed(2)}%
- Conversion Rate: ${conversionRate.toFixed(2)}%
- CPC: $${cpc.toFixed(2)}
- ROAS: ${roas.toFixed(2)}x

Dame 3 recomendaciones ESPECIFICAS para mejorar. Responde como JSON array de strings.`;

  try {
    const generation = await generateStructured({
      task: "bulk",
      schemaName: "ad_optimizations",
      schema: optimizationSchema,
      system: "Eres un analista de campañas. Basa cada recomendación únicamente en las métricas entregadas.",
      user: `${prompt}\nResponde como un objeto con la propiedad recommendations.`,
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
