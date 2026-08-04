import { NextResponse } from "next/server";
import { generateStructured } from "@/lib/ai-provider-router";
import { funnelAIReportSchema } from "@/lib/funnelspy-ai";
import { attachReport } from "@/lib/funnelspy-store";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const evidence = payload.analysis || payload;
    const { screenshot, screenshotMobile, ...textEvidence } = evidence;
    const generation = await generateStructured({
      task: "vision",
      schemaName: "funnel_report",
      schema: funnelAIReportSchema,
      timeoutMs: 90_000,
      system: `Eres FunnelSpy, analista senior de conversión. Responde completamente en ${payload.language === "en" ? "inglés" : "español"}. Usa únicamente la evidencia pública proporcionada. Distingue hechos de inferencias, no inventes métricas, usuarios, ingresos ni tecnologías. Ofrece recomendaciones concretas y accionables.`,
      user: `Analiza la evidencia técnica y también la jerarquía visual, legibilidad, CTA principal, prueba social y fricción visible de las capturas disponibles:\n${JSON.stringify(textEvidence).slice(0, 90_000)}`,
      images: [screenshot, screenshotMobile]
        .filter((value): value is string => typeof value === "string" && value.startsWith("data:image/"))
        .map((dataUrl) => ({ dataUrl })),
    });
    if (payload.auditId) await attachReport(payload.auditId, generation.output);
    return NextResponse.json({
      report: generation.output,
      provider: generation.provider,
      model: generation.model,
      warnings: generation.warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible generar el informe de IA.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
