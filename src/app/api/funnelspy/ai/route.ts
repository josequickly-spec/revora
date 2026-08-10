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
      system: `You are FunnelSpy, a senior conversion analyst. Respond entirely in ${payload.language === "es" ? "Spanish" : "English"}. Use only the public evidence provided. Distinguish facts from inferences, do not invent metrics, users, revenue, or technologies. Offer concrete, actionable recommendations.`,
      user: `Analyze the technical evidence as well as the visual hierarchy, readability, primary CTA, social proof, and visible friction from the available screenshots:\n${JSON.stringify(textEvidence).slice(0, 90_000)}`,
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
    const message = error instanceof Error ? error.message : "Could not generate the AI report.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
