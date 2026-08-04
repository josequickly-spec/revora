import { NextRequest, NextResponse } from "next/server";
import {
  generateWebBuilderSpec,
  webBuilderRequestSchema,
} from "@/lib/web-builder";
import { analyzeFunnel } from "@/lib/funnelspy";
import { attachVisualIdentity, attachWebBuilder, getAudit } from "@/lib/funnelspy-store";

export const runtime = "nodejs";
export const maxDuration = 180;

function normalizeSourceUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return value;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function GET(request: NextRequest) {
  const auditId = request.nextUrl.searchParams.get("auditId") || "";
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "es";
  if (!/^[0-9a-f-]{36}$/i.test(auditId)) {
    return NextResponse.json({ error: "A valid auditId is required." }, { status: 400 });
  }
  const audit = await getAudit(auditId);
  if (!audit?.webBuilder || audit.webBuilder.locale !== locale) return NextResponse.json({ error: "No persisted website preview exists for this audit and language." }, { status: 404 });
  return NextResponse.json({ success: true, ...audit.webBuilder, reused: true });
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json() as Record<string, unknown>;
    const parsed = webBuilderRequestSchema.safeParse({
      ...raw,
      sourceUrl: normalizeSourceUrl(raw.sourceUrl),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "The website context is invalid.", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    if (!parsed.data.businessName && !parsed.data.sourceUrl) {
      return NextResponse.json(
        { error: "Add a business name or transfer a FunnelSpy audit first." },
        { status: 400 },
      );
    }

    let generationInput = parsed.data;
    let sourceAnalyzed = false;
    const identity = generationInput.visualIdentity;
    const hasVisualEvidence = Boolean(
      identity?.logoUrl || identity?.heroImageUrl || identity?.colors?.length || identity?.fonts?.length || identity?.navigation?.length,
    );

    if (generationInput.sourceUrl && !hasVisualEvidence) {
      const analysis = await analyzeFunnel(generationInput.sourceUrl).catch(() => null);
      if (analysis) {
        sourceAnalyzed = true;
        generationInput = {
          ...generationInput,
          visualIdentity: analysis.visualIdentity,
          evidence: [
            ...generationInput.evidence,
            `FunnelSpy score: ${analysis.score}/100`,
            ...analysis.pages.slice(0, 5).flatMap((page) => [
              page.title ? `Page title: ${page.title}` : "",
              page.description ? `Page description: ${page.description}` : "",
              page.ctas.length ? `Observed CTAs: ${page.ctas.slice(0, 5).join(", ")}` : "",
            ]).filter(Boolean),
          ].slice(0, 30),
        };
        if (generationInput.auditId && analysis.visualIdentity) {
          await attachVisualIdentity(generationInput.auditId, analysis.visualIdentity).catch(() => undefined);
        }
      }
    }

    const result = await generateWebBuilderSpec(generationInput);
    if (generationInput.auditId) {
      await attachWebBuilder(generationInput.auditId, {
        spec: result.spec,
        provider: result.provider,
        model: result.model,
        warnings: result.warnings,
        visualIdentity: generationInput.visualIdentity || null,
        generatedAt: new Date().toISOString(),
        locale: generationInput.locale,
      }).catch(() => undefined);
    }
    return NextResponse.json({ success: true, ...result, sourceAnalyzed, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("AI Web Builder error:", error);
    return NextResponse.json(
      { error: "The AI provider could not generate the website preview." },
      { status: 502 },
    );
  }
}
