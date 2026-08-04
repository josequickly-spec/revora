import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { aiConsultantRequestSchema } from "@/lib/ai-consultant/contracts";
import { ConsultantContextError } from "@/lib/ai-consultant/context";
import { generateConsultantReport } from "@/lib/ai-consultant/generate";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const input = aiConsultantRequestSchema.parse(await request.json());
    const result = await generateConsultantReport(input);
    return NextResponse.json(result, { status: result.reused ? 200 : 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid AI Consultant request.", details: error.issues.map(issue => ({ path: issue.path.join("."), message: issue.message })) }, { status: 400 });
    }
    if (error instanceof ConsultantContextError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    const safe = error as { code?: string; reportId?: string; message?: string };
    const status = safe.code === "missing_api_key" ? 503 : safe.code === "provider_rate_limited" ? 429 : safe.code === "provider_timeout" ? 504 : 502;
    return NextResponse.json({
      error: safe.message || "AI Consultant generation failed.",
      code: safe.code || "generation_failed",
      reportId: safe.reportId || null,
    }, { status });
  }
}
