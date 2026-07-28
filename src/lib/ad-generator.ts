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
}

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

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) throw new Error("OpenAI API error");

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const campaign_data = JSON.parse(content);
    return {
      id: `camp_${Date.now()}`,
      businessName,
      platform,
      ...campaign_data,
    };
  } catch (error) {
    console.error("Ad campaign generation error:", error);
    throw error;
  }
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error("OpenAI API error");

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    let content = data.choices[0].message.content;
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const recommendations = JSON.parse(content);

    return {
      ctr,
      conversionRate,
      cpc,
      roas,
      recommendations: Array.isArray(recommendations)
        ? recommendations
        : [recommendations],
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
