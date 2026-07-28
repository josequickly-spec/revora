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
Tu trabajo es crear un sistema de adquisición de leads de respuesta directa, profesional y específico, basado únicamente en los datos proporcionados.

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
11. Infiere un buyer persona concreto: situación, intención, frustración, objeción y nivel de conciencia.
12. Diseña un lead magnet de bajo coste de entrega y alto valor percibido, coherente con el negocio. No afirmes que ya existe: preséntalo como el recurso que esta campaña entregará.
13. Usa PAS: describe el problema con precisión, agita consecuencias plausibles de posponerlo y presenta el lead magnet como el primer paso rápido, no como una cura milagrosa.
14. Aplica psicología inversa con moderación: permite que el visitante se autodescalifique sin insultarlo ni manipularlo.
15. La urgencia solo puede basarse en tiempo, coste de oportunidad o disponibilidad que pueda confirmarse. Nunca inventes cupos, fechas límite ni escasez.
16. Escribe frases cortas, tono conversacional y párrafos de máximo tres líneas. Evita los adjetivos "revolucionario", "increíble" y "único".
17. Las viñetas de fascinación deben revelar el beneficio y reservar el mecanismo, sin promesas engañosas.
18. Los CTA deben usar verbos de propiedad en primera persona y nunca decir "Enviar" o "Registrarse".
19. El email de bienvenida debe entregar o explicar claramente cómo acceder al recurso, romper el escepticismo y anticipar el servicio de pago sin presión.
20. No declares porcentajes de apertura o CTR. Optimiza el asunto para curiosidad y relevancia, sin clickbait.

CONTROL EDITORIAL ANTES DE RESPONDER
- Descarta cualquier frase intercambiable con otro negocio. Cada bloque debe reflejar el nicho, la intención y el problema observado.
- Comprueba que ninguna frase presuponga promociones, testimonios, reseñas, tasas, aprobación de crédito, inventario, entrega inmediata o disponibilidad si la auditoría no lo demuestra.
- No escribas "disponible hoy", "promociones actuales", "clientes satisfechos" ni equivalentes sin evidencia explícita.
- El asunto del email debe prometer una información concreta o abrir una pregunta relevante; nunca uses "Bienvenido", "Gracias por registrarte" ni saludos genéricos como idea principal.
- El lead magnet debe poder crearse honestamente con la información del negocio. No prometas un archivo adjunto o enlace que todavía no existe; explica que llegará al correo indicado cuando la campaña esté configurada.
- Haz una última revisión silenciosa y reescribe cualquier sección vaga, exagerada o no sustentada antes de producir el JSON.

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
  "leadMagnet": {
    "name": "Nombre específico y deseable del recurso",
    "format": "Auditoría, guía, checklist, calculadora, diagnóstico u otro formato apropiado",
    "deliveryPromise": "Qué recibirá exactamente el lead y cómo lo recibirá"
  },
  "headline": "Titular específico de máximo 70 caracteres",
  "subheadline": "Propuesta de valor de máximo 160 caracteres",
  "ctaText": "La mejor acción en primera persona, máximo 38 caracteres",
  "ctaOptions": [
    "CTA de propiedad en primera persona 1",
    "CTA de propiedad en primera persona 2",
    "CTA de propiedad en primera persona 3"
  ],
  "offer": "Oferta principal coherente y verificable",
  "offerBadge": "Etiqueta informativa sin falsa urgencia",
  "bonusOffer": "Valor adicional; si no existe, indicar Evaluación personalizada",
  "painPoint": "Problema específico en una oración",
  "agitationCopy": "Consecuencia realista del problema en 2 oraciones",
  "solutionCopy": "Cómo el negocio ayuda en 2-3 oraciones",
  "proofCopy": "Texto de confianza basado solo en hechos observados; si no hay pruebas, explicar el siguiente paso sin riesgo",
  "benefits": ["3 a 5 beneficios concretos y distintos"],
  "fascinationBullets": [
    "Beneficio atractivo que reserva el mecanismo 1",
    "Beneficio atractivo que reserva el mecanismo 2",
    "Beneficio atractivo que reserva el mecanismo 3",
    "Beneficio atractivo que reserva el mecanismo 4"
  ],
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
  "welcomeEmail": {
    "subject": "Asunto breve, específico y creíble",
    "previewText": "Texto de vista previa que complementa el asunto",
    "body": "Email móvil con bienvenida, acceso al recurso, ruptura del escepticismo y un siguiente paso concreto. Usa saltos de línea.",
    "postscript": "P.D. que anticipa de forma natural el producto o servicio de pago"
  },
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
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1800,
        temperature: 0.35,
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
        !Array.isArray(result.fascinationBullets) || result.fascinationBullets.length !== 4 ||
        !Array.isArray(result.ctaOptions) || result.ctaOptions.length !== 3 ||
        !result.leadMagnet?.name || !result.welcomeEmail?.subject || !result.welcomeEmail?.body ||
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
