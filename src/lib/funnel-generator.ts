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
  const outputLanguage = context.language === "en" ? "English (United States)" : "español";
  const prompt = `Actúa como estratega senior de conversión, UX writer y especialista en investigación comercial.
Tu trabajo es crear un sistema de adquisición de leads de respuesta directa, profesional y específico, basado únicamente en los datos proporcionados.

IDIOMA DE SALIDA
- Escribe TODO el contenido visible en ${outputLanguage}.
- Localiza el mensaje para el mercado indicado; no traduzcas literalmente.
- Conserva exactamente nombres comerciales, marcas, precios, dominios y direcciones.

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
- Identidad visual observada: ${JSON.stringify(context.visualIdentity || null)}

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
21. Integra en el mismo JSON el OTOM completo: hook, oferta principal, upsell, downsell, precios, cinco seguimientos y recorrido.
22. landingPage no es una plantilla nueva: debe conservar logo, imagen hero, colores, tipografía, navegación, densidad y estructura observadas.
23. No inventes URLs de recursos. Cuando no exista una URL observada usa una cadena vacía.
24. La oferta, CTA, upsell, downsell y emails deben contar la misma historia comercial y usar los mismos nombres y precios.

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
- Escribe en ${outputLanguage} natural, profesional, concreto y centrado en el cliente.
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
  },
  "landingPage": {
    "brandName": "Nombre exacto de la marca",
    "navigation": ["Inicio", "Beneficios", "Oferta", "Preguntas"],
    "logoUrl": "URL observada o cadena vacia",
    "heroImageUrl": "URL observada o cadena vacia",
    "preserveOriginalDesign": true,
    "fontFamily": "Fuente observada o recomendacion compatible",
    "headerStyle": "Descripcion breve del header y layout original",
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
    "pricingStrategy": {"anchorPrice":0,"suggestedPrice":0,"premiumPrice":0,"rationale":"Supuestos y logica, sin presentar estimaciones como hechos"},
    "psychologicalTriggers": ["3 a 8 disparadores honestos"],
    "customerJourney": [{"step":1,"action":"...","trigger":"...","expectedResult":"..."}],
    "followUp": [
      {"day":0,"subject":"...","purpose":"Entrega","body":"..."},
      {"day":1,"subject":"...","purpose":"Valor","body":"..."},
      {"day":3,"subject":"...","purpose":"Objecion","body":"..."},
      {"day":5,"subject":"...","purpose":"Oferta","body":"..."},
      {"day":7,"subject":"...","purpose":"Cierre honesto","body":"..."}
    ]
  }
}`;

  const generation = await generateStructured({
    task: "strategy",
    schemaName: "funnel_content",
    schema: funnelAISchema,
    system: "Eres un estratega senior de conversión y UX writing. Usa solo la evidencia entregada y evita afirmaciones no verificadas.",
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
  mode: FunnelLanguageMode = "bilingual"
): Promise<LocalizedFunnelContent> {
  const languages: Array<"es" | "en"> = mode === "bilingual" ? ["es", "en"] : [mode];
  const generated = await Promise.all(
    languages.map(async (language) => [
      language,
      await generateFunnel(businessName, industryType, niche, painPoint, { ...context, language }),
    ] as const)
  );
  const translations = Object.fromEntries(generated) as Partial<Record<"es" | "en", GeneratedFunnel>>;
  const defaultLanguage: "es" | "en" = mode === "en" ? "en" : "es";
  const primary = translations[defaultLanguage] || translations[languages[0]];
  if (!primary) throw new Error("No se pudo generar el contenido localizado");
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
