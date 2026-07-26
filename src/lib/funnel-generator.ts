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
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export async function generateFunnel(
  businessName: string,
  industryType: string,
  niche: string,
  painPoint: string
): Promise<GeneratedFunnel> {
  const prompt = `Eres experto en copywriting de embudos de ventas de alto rendimiento.

Genera un embudo COMPLETO para:
Negocio: ${businessName}
Industria: ${industryType}
Nicho: ${niche}
Problema: ${painPoint}

Responde SOLO JSON valido, sin markdown:
{
  "headline": "Titular maximo 60 caracteres",
  "subheadline": "Subtitulo maximo 120 caracteres",
  "ctaText": "Texto boton maximo 25 caracteres",
  "offer": "Ej: Consulta Gratis, 30% Descuento",
  "offerBadge": "Ej: Oferta 48h, Ultimas 5 slots",
  "bonusOffer": "Ej: Guia gratis, Acceso comunidad",
  "painPoint": "Reformula el dolor del cliente",
  "agitationCopy": "Parrafo 2-3 oraciones agitando problema",
  "solutionCopy": "Parrafo 2-3 oraciones presentando solucion",
  "proofCopy": "Parrafo 2-3 oraciones con prueba social",
  "colorScheme": {
    "primary": "#XXXXXX color principal",
    "secondary": "#XXXXXX color complementario",
    "accent": "#XXXXXX color CTA"
  }
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
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      throw new Error(`OpenAI API error`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    const content = data.choices[0].message.content;

    const result = JSON.parse(content) as GeneratedFunnel;
    result.heroImage = `hero-${businessName.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    return result;
  } catch (error) {
    console.error("Funnel generation error:", error);
    throw error;
  }
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
