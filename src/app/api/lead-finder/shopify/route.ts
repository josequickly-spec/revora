import { NextResponse } from "next/server";
import { lookupBuiltWith, profileHasTechnology } from "@/lib/builtwith";
import { LeadSearchError, searchLeads } from "@/lib/lead-finder/search";
import { leadSearchSchema } from "@/lib/lead-finder/validation";
import { requestIp, validateTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { turnstileToken, ...rawInput } = body;
    const turnstile = await validateTurnstile(turnstileToken, requestIp(request));
    if (!turnstile.valid) {
      return NextResponse.json(
        { success: false, error: "Bot verification failed", code: "turnstile_failed" },
        { status: 403 },
      );
    }

    const parsed = leadSearchSchema.safeParse({
      ...rawInput,
      category: `shopify ${String(rawInput.category || "store")}`,
      limit: Math.min(Number(rawInput.limit) || 20, 20),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid Shopify city search", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const discovered = await searchLeads(parsed.data);
    const candidatesWithWebsites = discovered.candidates
      .filter(candidate => candidate.website)
      .slice(0, 15);
    const verified = [];
    let unavailable = 0;
    let checked = 0;

    for (const candidate of candidatesWithWebsites) {
      try {
        const profile = await lookupBuiltWith(candidate.website as string);
        if (!profile) {
          unavailable += 1;
          continue;
        }
        checked += 1;
        if (!profileHasTechnology(profile, "shopify")) continue;
        verified.push({
          ...candidate,
          technologyVerification: {
            status: "verified" as const,
            platform: "Shopify",
            provider: "BuiltWith",
            checkedAt: profile.checkedAt,
            signals: profile.technologies
              .filter(technology =>
                [technology.name, technology.category, ...technology.categories]
                  .filter(Boolean)
                  .some(value => String(value).toLowerCase().includes("shopify")),
              )
              .map(technology => technology.name)
              .slice(0, 6),
          },
        });
      } catch {
        unavailable += 1;
      }
    }

    const configured = Boolean(process.env.BUILTWITH_API_KEY);
    return NextResponse.json({
      success: true,
      candidates: verified,
      providerStatus: {
        ...discovered.providerStatus,
        builtWith: configured
          ? unavailable > 0
            ? "partial"
            : "success"
          : "unavailable",
      },
      warnings: [
        ...discovered.warnings,
        ...(!configured
          ? ["BuiltWith is not configured, so Shopify could not be verified."]
          : []),
        ...(unavailable > 0
          ? [`BuiltWith verification was unavailable for ${unavailable} website(s).`]
          : []),
        ...(candidatesWithWebsites.length === 15 && discovered.candidates.length > 15
          ? ["Technology verification was limited to the first 15 businesses with websites."]
          : []),
      ],
      requestMetadata: {
        ...discovered.requestMetadata,
        discovered: discovered.candidates.length,
        websitesFound: candidatesWithWebsites.length,
        technologyChecked: checked,
        shopifyVerified: verified.length,
      },
      verification: {
        locationProvider: "OpenStreetMap",
        technologyProvider: "BuiltWith",
        technology: "Shopify",
        onlyVerifiedResultsReturned: true,
      },
    });
  } catch (error) {
    const status = error instanceof LeadSearchError ? error.status : 502;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Shopify city search failed",
      },
      { status },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    locationProvider: "OpenStreetMap",
    technologyProvider: "BuiltWith",
    technology: "Shopify",
  });
}
