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
  processSteps: Array<{ title: string; description: string }>;
  visualDirection: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface FunnelBusinessContext {
  website?: string;
  country?: string;
  platform?: string;
  offer?: string;
  price?: string;
  audit?: unknown;
}

export async function generateFunnel(
  businessName: string,
  industryType: string,
  niche: string,
  painPoint: string,
  context: FunnelBusinessContext = {}
): Promise<GeneratedFunnel> {
  const prompt = `Actúa como estratega senior de conversión, UX writer y especialista en investigación comercial.
Tu trabajo es diseñar una landing de captación profesional y específica, basada únicamente en los datos proporcionados.

DATOS DEL NEGOCIO
- Nombre: ${businessName}
- Industria: ${industryType}
- Nicho: ${niche}
- País/mercado: ${context.country || "no confirmado"}
- Web: ${context.website || "no proporcionada"}
- Tecnología detectada: ${context.platform || "no confirmada"}
- Oferta configurada (puede ser un valor provisional): ${context.offer || "no confirmada"}
- Precio informado: ${context.price || "no confirmado"}
- Problema inicial: ${painPoint}
- Auditoría observada del sitio: ${JSON.stringify(context.audit || null)}

PROCESO INTERNO OBLIGATORIO
1. Define el público y su intención principal a partir de industria, nicho y datos observados.
2. Elige UNA acción de conversión adecuada: consulta, cita, reserva, cotización, prueba, visita o compra.
3. Construye la propuesta de valor con claridad, especificidad y bajo riesgo.
4. Ordena el mensaje: contexto -> problema -> solución -> beneficios -> confianza -> objeciones -> CTA.
5. Revisa consistencia entre titular, oferta, CTA y tipo de negocio.
6. Da prioridad al title, description, H1 y demás señales de la auditoría sobre etiquetas genéricas configuradas.
7. Identifica correctamente quién es el cliente: por ejemplo, en un concesionario la acción principal suele ser consultar inventario, financiación o prueba de manejo; no ofrecer valoración del vehículo salvo que el sitio indique compra o trade-in.
8. Diseña para móvil primero: una idea por sección, lectura escaneable y CTA repetible sin saturación.
9. La página debe poder competir con una landing profesional de agencia, no parecer una plantilla genérica.
10. Cada beneficio debe responder "qué obtiene el cliente" y cada paso debe reducir incertidumbre.

REGLAS DE VERACIDAD
- No inventes testimonios, clientes, años de experiencia, certificaciones, descuentos, stock, plazas, garantías, resultados, estadísticas ni urgencia.
- No prometas ingresos ni resultados garantizados.
- Si falta información, usa lenguaje verificable como "solicita información" o "consulta disponibilidad".
- No uses clichés vacíos como "líder del mercado", "revolucionario" o "la mejor calidad".
- Escribe en español natural, profesional, concreto y centrado en el cliente.
- El titular debe comunicar valor, no mencionar que la página es un embudo.

Responde SOLO con un objeto JSON válido, sin markdown y con exactamente esta estructura:
{
  "eyebrow": "Contexto breve de 3-7 palabras",
  "audience": "Descripción concreta del cliente ideal y su intención",
  "primaryGoal": "Una sola conversión medible para esta landing",
  "valueProposition": "Por qué elegir este negocio, sin afirmaciones no verificadas",
  "headline": "Titular específico de máximo 70 caracteres",
  "subheadline": "Propuesta de valor de máximo 160 caracteres",
  "ctaText": "Acción concreta de máximo 28 caracteres",
  "offer": "Oferta principal coherente y verificable",
  "offerBadge": "Etiqueta informativa sin falsa urgencia",
  "bonusOffer": "Valor adicional; si no existe, indicar Evaluación personalizada",
  "painPoint": "Problema específico en una oración",
  "agitationCopy": "Consecuencia realista del problema en 2 oraciones",
  "solutionCopy": "Cómo el negocio ayuda en 2-3 oraciones",
  "proofCopy": "Texto de confianza basado solo en hechos observados; si no hay pruebas, explicar el siguiente paso sin riesgo",
  "benefits": ["3 a 5 beneficios concretos y distintos"],
  "trustPoints": ["3 señales de confianza verificables o pasos transparentes"],
  "processSteps": [
    {"title": "Paso 1 corto", "description": "Qué hace el visitante y qué ocurre"},
    {"title": "Paso 2 corto", "description": "Qué hace el negocio y qué recibe el visitante"},
    {"title": "Paso 3 corto", "description": "Cómo se completa la conversión sin fricción"}
  ],
  "visualDirection": "Dirección visual específica: tono, composición hero, tipo de imagen y uso del color; no generes una URL",
  "objections": [
    {"question": "Objeción real 1", "answer": "Respuesta prudente"},
    {"question": "Objeción real 2", "answer": "Respuesta prudente"},
    {"question": "Objeción real 3", "answer": "Respuesta prudente"}
  ],
  "colorScheme": {
    "primary": "#RRGGBB",
    "secondary": "#RRGGBB",
    "accent": "#RRGGBB"
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
        max_tokens: 1800,
        temperature: 0.45,
        response_format: { type: "json_object" },
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
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenAI no devolvió contenido para el embudo");
    const result = JSON.parse(content.replace(/```json\s*|```/g, "").trim()) as GeneratedFunnel;
    if (!result.headline || !result.subheadline || !result.ctaText || !result.colorScheme?.primary ||
        !Array.isArray(result.benefits) || result.benefits.length < 3 ||
        !Array.isArray(result.objections) || result.objections.length < 2 ||
        !Array.isArray(result.processSteps) || result.processSteps.length < 3 ||
        !result.audience || !result.primaryGoal || !result.valueProposition) {
      throw new Error("OpenAI devolvió un embudo incompleto");
    }
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
