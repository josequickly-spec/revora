import { NextResponse } from "next/server";
import { LeadSearchError, searchLeads } from "@/lib/lead-finder/search";
import { leadSearchSchema } from "@/lib/lead-finder/validation";
import { legacyBusiness, legacyRequest } from "@/lib/lead-finder/legacy";

export async function POST(req: Request) {
  try {
    const mapped = legacyRequest(await req.json());
    const parsed = leadSearchSchema.safeParse(mapped);
    if (!parsed.success) return NextResponse.json({ success: false, error: "Indica una ciudad, ZIP o dirección" }, { status: 400 });
    const result = await searchLeads(parsed.data);
    const businesses = result.candidates.map(legacyBusiness);
    return NextResponse.json({
      success: true, count: businesses.length, businesses, source: "OpenStreetMap Overpass",
      searchArea: result.requestMetadata.searchArea, warnings: result.warnings,
    });
  } catch (error) {
    const status = error instanceof LeadSearchError ? error.status : 502;
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "La búsqueda falló" }, { status });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, provider: "OpenStreetMap Overpass", compatibilityAdapter: true, persistedMocks: false });
}
