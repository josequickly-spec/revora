import { NextRequest, NextResponse } from "next/server";
import { generateOTOM } from "@/lib/otom-generator";
import { businessProfileInputSchema } from "@/lib/business-profile";
import { analyzeFunnel } from "@/lib/funnelspy";
import { attachOtom, attachVisualIdentity, getAudit } from "@/lib/funnelspy-store";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET(request: NextRequest) {
  const auditId = request.nextUrl.searchParams.get("auditId") || "";
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "es";
  if (!/^[0-9a-f-]{36}$/i.test(auditId)) {
    return NextResponse.json({ error: "A valid auditId is required." }, { status: 400 });
  }
  const audit = await getAudit(auditId);
  if (!audit?.otom || audit.otom.locale !== locale) return NextResponse.json({ error: "No persisted OTOM exists for this audit and language." }, { status: 404 });
  return NextResponse.json({ success: true, ...audit.otom, reused: true });
}

export async function POST(request: NextRequest) {
  try {
    const parsed = businessProfileInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "The business context is invalid.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    if (!parsed.data.businessName && !parsed.data.sourceUrl) {
      return NextResponse.json(
        { error: "Add a business name or analyze a website first." },
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

    const result = await generateOTOM(generationInput);
    if (generationInput.auditId) {
      await attachOtom(generationInput.auditId, {
        profile: result.profile,
        otom: result.otom,
        provider: result.provider,
        model: result.model,
        visualIdentity: generationInput.visualIdentity || null,
        generatedAt: new Date().toISOString(),
        locale: generationInput.locale,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      otom: result.otom,
      profile: result.profile,
      provider: result.provider,
      model: result.model,
      sourceAnalyzed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("OTOM API error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate OTOM",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
