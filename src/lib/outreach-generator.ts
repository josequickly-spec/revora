export interface EmailSequence {
  subject: string;
  body: string;
  delay: number;
  index: number;
}

export interface VideoPitch {
  title: string;
  script: string;
  duration: string;
  cta: string;
  videoUrl?: string;
}

export interface GeneratedOutreach {
  emailSequence: EmailSequence[];
  videoPitch: VideoPitch;
  followUpTiming: {
    firstEmail: string;
    videoEmail: string;
    followUp1: string;
    followUp2: string;
  };
}

export async function generateOutreachSequence(
  contactName: string,
  businessName: string,
  offerHeadline: string,
  painPoint: string,
  bonusOffer: string
): Promise<GeneratedOutreach> {
  const prompt = `Eres un experto en copywriting de cold email y outreach de alto rendimiento.

Genera una secuencia de OUTREACH COMPLETA para:
Contacto: ${contactName}
Negocio Objetivo: ${businessName}
Oferta: ${offerHeadline}
Problema del Cliente: ${painPoint}
Bonus: ${bonusOffer}

Responde SOLO JSON valido:
{
  "emailSequence": [
    {
      "subject": "Subject line corto y atractivo (max 50 caracteres)",
      "body": "Email body personalizado 100-150 palabras. Debe ser corto, directo, hiperpersonalizado. Incluir: situacion actual → problema → solucion → beneficio → CTA",
      "delay": 0,
      "index": 1
    },
    {
      "subject": "Subject seguimiento",
      "body": "Segundo email 80-120 palabras. Agregar valor, no repetir. Mencionar video disponible.",
      "delay": 2,
      "index": 2
    },
    {
      "subject": "Video breve dentro",
      "body": "Tercer email 70-100 palabras. Compartir video pitch. Social proof. Ultimo intento.",
      "delay": 4,
      "index": 3
    }
  ],
  "videoPitch": {
    "title": "30-segundo pitch video titulo",
    "script": "Guion para video 60-90 segundos. Formato: Hook (3s) → Problem (15s) → Solution (30s) → CTA (12s). Debe ser conversacional, energetico.",
    "duration": "0:60 a 0:90",
    "cta": "Call to action claro"
  },
  "followUpTiming": {
    "firstEmail": "Day 1 at 9am",
    "videoEmail": "Day 4 at 10am",
    "followUp1": "Day 7 at 11am",
    "followUp2": "Day 14 at 3pm"
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
        max_tokens: 1500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error("OpenAI API error");
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    let content = data.choices[0].message.content;

    // Remove markdown code blocks
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const result = JSON.parse(content) as GeneratedOutreach;
    return result;
  } catch (error) {
    console.error("Outreach generation error:", error);
    throw error;
  }
}

export async function generateVideoPitch(
  contactName: string,
  businessName: string,
  offer: string
): Promise<string> {
  const pitch = `
  ¡Hola ${contactName}!
  
  Vi que ${businessName} está en el espacio de [industry]. 
  Tenemos un método probado que ayuda negocios como el tuyo a [benefit].
  
  En realidad, solo tomamos 3 clientes por mes y tenemos un slot disponible ahora.
  
  ¿Tienes 15 minutos esta semana para ver cómo funciona?
  
  ${offer}
  `;

  return pitch;
}
