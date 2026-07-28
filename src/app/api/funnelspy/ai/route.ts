import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { funnelAIReportSchema } from "@/lib/funnelspy-ai";
import { attachReport } from "@/lib/funnelspy-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "La inteligencia de OpenAI no está configurada." }, { status: 503 });
    }
    const payload = await request.json();
    const evidence = payload.analysis || payload;
    const { screenshot, screenshotMobile, ...textEvidence } = evidence;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: `Eres FunnelSpy, analista senior de conversión. Responde completamente en ${payload.language === "en" ? "inglés" : "español"}. Usa únicamente la evidencia pública proporcionada. Distingue hechos de inferencias, no inventes métricas, usuarios, ingresos ni tecnologías. Ofrece recomendaciones concretas y accionables.`,
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Analiza la evidencia técnica y también la jerarquía visual, legibilidad, CTA principal, prueba social y fricción visible de las capturas disponibles:\n${JSON.stringify(textEvidence).slice(0, 90_000)}`,
            },
            ...(typeof screenshot === "string" && screenshot.startsWith("data:image/")
              ? [{ type: "input_image" as const, image_url: screenshot, detail: "low" as const }]
              : []),
            ...(typeof screenshotMobile === "string" && screenshotMobile.startsWith("data:image/")
              ? [{ type: "input_image" as const, image_url: screenshotMobile, detail: "low" as const }]
              : []),
          ],
        },
      ],
      text: { format: zodTextFormat(funnelAIReportSchema, "funnel_report") },
    });
    if (!response.output_parsed) throw new Error("La IA no devolvió un informe estructurado.");
    if (payload.auditId) await attachReport(payload.auditId, response.output_parsed);
    return NextResponse.json({ report: response.output_parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible generar el informe de IA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
