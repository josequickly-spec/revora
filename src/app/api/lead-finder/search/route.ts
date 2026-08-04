import { NextResponse } from "next/server";
import { LeadSearchError, searchLeads } from "@/lib/lead-finder/search";
import { leadSearchSchema } from "@/lib/lead-finder/validation";
import { requestIp, validateTurnstile } from "@/lib/turnstile";

export async function POST(req: Request) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { turnstileToken, ...input } = body;
    const turnstile = await validateTurnstile(turnstileToken, requestIp(req));
    if (!turnstile.valid) return NextResponse.json({ success: false, error: "Bot verification failed", code: "turnstile_failed" }, { status: 403 });
    const parsed = leadSearchSchema.safeParse(input);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid lead search request", issues: parsed.error.issues }, { status: 400 });
    }
    const result = await searchLeads(parsed.data);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const status = error instanceof LeadSearchError ? error.status : 502;
    const providerStatus = {
      nominatim: status === 429 ? "rate_limited" : "failed",
      overpass: "not_checked",
    };
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Lead search failed", providerStatus }, { status });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, provider: "OpenStreetMap", canonical: true });
}
