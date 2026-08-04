import { z } from "zod";
import { generateStructured } from "@/lib/ai-provider-router";

export interface EmailSequence {
  subject: string;
  body: string;
  cta: string;
  purpose: string;
  delay: number;
  index: number;
}

export interface VideoPitch {
  title: string;
  script: string;
  duration: string;
  cta: string;
  segments: Array<{ time: string; label: string; copy: string }>;
  videoUrl?: string | null;
}

export interface OutreachBusinessContext {
  website?: string;
  contactRole?: string;
  industry?: string;
  location?: string;
  audience?: string;
  problems?: string[];
  opportunity?: string;
  previewUrl?: string;
  objective?: string;
  senderName?: string;
  senderCompany?: string;
}

export interface GeneratedOutreach {
  emailSequence: EmailSequence[];
  videoPitch: VideoPitch;
  personalizationUsed: string[];
  claimsToVerify: string[];
  followUpTiming: {
    firstEmail: string;
    videoEmail: string;
    followUp1: string;
    followUp2: string;
  };
}

const outreachSchema = z.object({
  emailSequence: z.array(z.object({
    subject: z.string(),
    body: z.string(),
    cta: z.string(),
    purpose: z.string(),
    delay: z.number().int().min(0),
    index: z.number().int().min(1).max(5),
  })).length(5),
  videoPitch: z.object({
    title: z.string(),
    script: z.string(),
    duration: z.string(),
    cta: z.string(),
    segments: z.array(z.object({ time: z.string(), label: z.string(), copy: z.string() })).length(4),
    videoUrl: z.string().nullable(),
  }),
  personalizationUsed: z.array(z.string()).max(12),
  claimsToVerify: z.array(z.string()).max(12),
  followUpTiming: z.object({ firstEmail: z.string(), videoEmail: z.string(), followUp1: z.string(), followUp2: z.string() }),
});

export async function generateOutreachSequence(
  contactName: string,
  businessName: string,
  offerHeadline: string,
  painPoint: string,
  bonusOffer: string,
  context: OutreachBusinessContext = {},
): Promise<GeneratedOutreach> {
  const generation = await generateStructured({
    task: "strategy",
    schemaName: "professional_b2b_outreach",
    schema: outreachSchema,
    timeoutMs: 120_000,
    system: "Actúa como estratega senior de ventas B2B, copywriter de cold email y consultor de optimización de conversión. Escribe en español neutro y usa solamente los hechos suministrados.",
    user: `Crea una secuencia profesional de cinco emails y un guion Loom de 90 segundos.

DATOS DEL NEGOCIO
- Nombre: ${businessName}
- Web: ${context.website || "no confirmada"}
- Decisor: ${contactName || "decisor no identificado"}
- Cargo: ${context.contactRole || "no confirmado"}
- Industria: ${context.industry || "no confirmada"}
- Ubicación: ${context.location || "no confirmada"}
- Oferta: ${offerHeadline || "no confirmada"}
- Audiencia: ${context.audience || "no confirmada"}
- Problemas detectados: ${JSON.stringify(context.problems?.length ? context.problems : [painPoint].filter(Boolean))}
- Oportunidad principal: ${context.opportunity || bonusOffer || "mejorar el recorrido comercial"}
- Preview creado: ${context.previewUrl || "todavía no disponible"}
- Objetivo: ${context.objective || "conseguir que el decisor revise la propuesta y acepte una conversación de 15 minutos"}
- Remitente: ${context.senderName || "Equipo de estrategia"}
- Empresa remitente: ${context.senderCompany || "EcoScale Partner"}

REGLAS DEL EMAIL
- Cada email debe tener entre 80 y 140 palabras y un asunto diferente.
- Email 1: apertura; no incluir enlace; preguntar si desea recibir la propuesta.
- Email 2: compartir el preview y pedir que lo revise.
- Email 3: explicar impacto en captación, conversión y seguimiento sin prometer resultados.
- Email 4: diferenciar una estructura comercial adaptada de un rediseño genérico.
- Email 5: cierre respetuoso y sin presión.
- Demuestra que el negocio fue revisado y menciona uno o dos problemas concretos sin atacar la marca.
- Presenta el preview como propuesta conceptual, nunca como auditoría definitiva.
- No inventes cifras, clientes, testimonios, urgencia, ingresos ni resultados.
- No uses jerga técnica, emojis, lenguaje agresivo ni más de una pregunta por email.
- El CTA debe ser de baja fricción y la llamada debe plantearse como conversación de 15 minutos.

REGLAS DEL LOOM
- Devuelve exactamente cuatro segmentos: 00:00–00:15 Gancho, 00:15–00:45 Demostración, 00:45–01:15 Oferta, 01:15–01:30 CTA.
- El guion debe ser consultivo, específico y coherente con los emails.
- Si falta el enlace del preview, indica que debe añadirse antes de enviar y agrega esa advertencia a claimsToVerify.

SALIDA
- emailSequence debe contener exactamente cinco objetos, indexados 1–5, con purpose, subject, body, cta y delay.
- personalizationUsed enumera únicamente los datos realmente usados.
- claimsToVerify enumera cualquier dato que deba confirmarse antes de aprobar el envío.`,
  });
  return generation.output;
}

export async function generateVideoPitch(contactName: string, businessName: string, offer: string): Promise<string> {
  const generated = await generateOutreachSequence(contactName, businessName, offer, "", "");
  return generated.videoPitch.script;
}
