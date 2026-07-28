import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

interface NominatimResult {
  place_id: number;
  display_name: string;
  name?: string;
  type?: string;
  category?: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const location = body.query || body.address || [body.category, body.city, body.zipcode].filter(Boolean).join(" ");
    if (!location) {
      return NextResponse.json({ success: false, error: "Provide query, address, city or zipcode" }, { status: 400 });
    }
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", location);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("limit", "20");
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "RevoraLeadResearch/1.0 (business discovery)" },
    });
    if (!response.ok) throw new Error(`OpenStreetMap returned ${response.status}`);
    const places = await response.json() as NominatimResult[];
    const existing = body.withoutFunnel
      ? new Set((await pool.query("SELECT b.domain FROM businesses b JOIN funnels f ON f.business_id=b.id")).rows.map(r => r.domain))
      : new Set<string>();
    const businesses = places.map(place => {
      const address = place.address || {};
      const website = place.extratags?.website || place.extratags?.["contact:website"];
      const domain = website?.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
      return {
        id: `osm_${place.place_id}`,
        name: place.name || place.display_name.split(",")[0],
        category: place.type || place.category || "business",
        address: place.display_name,
        city: address.city || address.town || address.village || "",
        zipcode: address.postcode || "",
        phone: place.extratags?.phone || place.extratags?.["contact:phone"],
        website, email: place.extratags?.email || place.extratags?.["contact:email"],
        lat: Number(place.lat), lng: Number(place.lon), source: "OpenStreetMap",
        hasFunnel: domain ? existing.has(domain) : false,
      };
    }).filter(business => !body.withoutFunnel || !business.hasFunnel);
    return NextResponse.json({ success: true, count: businesses.length, businesses, source: "OpenStreetMap Nominatim" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Business search failed" },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, provider: "OpenStreetMap Nominatim", persistedMocks: false });
}
