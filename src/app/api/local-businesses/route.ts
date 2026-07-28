import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

interface GeocodeResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const categoryFilters: Record<string, string[]> = {
  restaurant: ['["amenity"="restaurant"]'],
  restaurante: ['["amenity"="restaurant"]'],
  cafe: ['["amenity"="cafe"]'],
  coffee: ['["amenity"="cafe"]'],
  gym: ['["leisure"="fitness_centre"]'],
  gimnasio: ['["leisure"="fitness_centre"]'],
  "auto repair": ['["shop"="car_repair"]'],
  taller: ['["shop"="car_repair"]'],
  dealer: ['["shop"="car"]'],
  concesionario: ['["shop"="car"]'],
  beauty: ['["shop"~"beauty|hairdresser"]'],
  belleza: ['["shop"~"beauty|hairdresser"]'],
  dentist: ['["amenity"="dentist"]'],
  dental: ['["amenity"="dentist"]'],
  pharmacy: ['["amenity"="pharmacy"]'],
  hotel: ['["tourism"~"hotel|motel|guest_house"]'],
  realestate: ['["office"="estate_agent"]'],
  inmobiliaria: ['["office"="estate_agent"]'],
};

function filtersFor(category: string) {
  const normalized = category.trim().toLowerCase();
  const known = Object.entries(categoryFilters).find(([key]) => normalized.includes(key))?.[1];
  return known || [
    '["amenity"]["name"]', '["shop"]["name"]', '["office"]["name"]',
    '["craft"]["name"]', '["tourism"]["name"]', '["healthcare"]["name"]',
  ];
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const location = body.address || [body.city, body.zipcode].filter(Boolean).join(" ") || body.query;
    if (!location) {
      return NextResponse.json({ success: false, error: "Indica una ciudad, ZIP o dirección" }, { status: 400 });
    }

    const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
    geocodeUrl.searchParams.set("q", location);
    geocodeUrl.searchParams.set("format", "jsonv2");
    geocodeUrl.searchParams.set("limit", "1");
    const geocodeResponse = await fetch(geocodeUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "RevoraLeadResearch/1.0 (business discovery)" },
    });
    if (!geocodeResponse.ok) throw new Error(`OpenStreetMap respondió ${geocodeResponse.status}`);
    const geocodes = await geocodeResponse.json() as GeocodeResult[];
    if (!geocodes[0]) {
      return NextResponse.json({ success: false, error: "No se encontró esa ubicación. Prueba con ciudad + estado o ZIP." }, { status: 404 });
    }

    const { lat, lon, display_name: searchArea } = geocodes[0];
    const filters = filtersFor(body.category || "");
    const statements = filters.flatMap(filter =>
      ["node", "way", "relation"].map(type => `${type}(around:12000,${lat},${lon})${filter};`)
    ).join("");
    const query = `[out:json][timeout:25];(${statements});out center tags 40;`;
    const overpassResponse = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: new URLSearchParams({ data: query }),
      signal: AbortSignal.timeout(35000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "RevoraLeadResearch/1.0 (business discovery)",
      },
    });
    if (!overpassResponse.ok) throw new Error(`El buscador de negocios respondió ${overpassResponse.status}`);
    const overpass = await overpassResponse.json() as { elements: OverpassElement[] };

    const existing = body.withoutFunnel
      ? new Set((await pool.query("SELECT b.domain FROM businesses b JOIN funnels f ON f.business_id=b.id")).rows.map(row => row.domain))
      : new Set<string>();
    const seen = new Set<string>();
    const businesses = overpass.elements.flatMap(element => {
      const tags = element.tags || {};
      if (!tags.name) return [];
      const website = tags.website || tags["contact:website"];
      const domain = website?.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
      const key = `${tags.name.toLowerCase()}|${tags["addr:housenumber"] || ""}|${tags["addr:street"] || ""}`;
      if (seen.has(key) || (body.withoutFunnel && domain && existing.has(domain))) return [];
      seen.add(key);
      const businessCategory = tags.amenity || tags.shop || tags.office || tags.craft || tags.tourism || tags.healthcare || "business";
      const address = [
        tags["addr:housenumber"], tags["addr:street"], tags["addr:city"],
        tags["addr:state"], tags["addr:postcode"],
      ].filter(Boolean).join(", ") || searchArea;
      return [{
        id: `osm_${element.type}_${element.id}`,
        name: tags.name,
        category: businessCategory,
        address,
        city: tags["addr:city"] || body.city || "",
        zipcode: tags["addr:postcode"] || body.zipcode || "",
        phone: tags.phone || tags["contact:phone"],
        website,
        email: tags.email || tags["contact:email"],
        lat: element.lat || element.center?.lat,
        lng: element.lon || element.center?.lon,
        source: "OpenStreetMap Overpass",
        hasFunnel: domain ? existing.has(domain) : false,
      }];
    });

    return NextResponse.json({
      success: true,
      count: businesses.length,
      businesses,
      source: "OpenStreetMap Overpass",
      searchArea,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "La búsqueda falló" },
      { status: 502 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ success: true, provider: "OpenStreetMap Overpass", persistedMocks: false });
}
