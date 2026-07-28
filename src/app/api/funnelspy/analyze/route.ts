import { NextResponse } from "next/server";
import { analyzeFunnel, funnelSpyRequestSchema } from "@/lib/funnelspy";
import { saveAudit } from "@/lib/funnelspy-store";
import { checkRateLimit } from "@/lib/funnelspy-rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const limit = checkRateLimit(`audit:${client}`);
    if (!limit.allowed) return NextResponse.json({ error: "Límite temporal alcanzado. Intenta más tarde." }, { status: 429 });
    const input = funnelSpyRequestSchema.parse(await request.json());
    const analysis = await analyzeFunnel(input.url);
    const audit = await saveAudit(analysis);
    return NextResponse.json({ analysis, audit: { id: audit.id, shareToken: audit.shareToken, createdAt: audit.createdAt } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible analizar el dominio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
