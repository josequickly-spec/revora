import { pool } from "@/lib/postgres";
import type { LeadSearchResponse } from "./contracts";
import { candidateDomain, mapOverpassCandidates, type OverpassElement } from "./normalization";
import type { ValidLeadSearchRequest } from "./validation";

const categoryFilters: Record<string, string[]> = {
  restaurant: ['["amenity"="restaurant"]'], restaurante: ['["amenity"="restaurant"]'],
  cafe: ['["amenity"="cafe"]'], coffee: ['["amenity"="cafe"]'],
  gym: ['["leisure"="fitness_centre"]'], gimnasio: ['["leisure"="fitness_centre"]'],
  "auto repair": ['["shop"="car_repair"]'], taller: ['["shop"="car_repair"]'],
  dealer: ['["shop"="car"]'], concesionario: ['["shop"="car"]'],
  beauty: ['["shop"~"beauty|hairdresser"]'], belleza: ['["shop"~"beauty|hairdresser"]'],
  dentist: ['["amenity"="dentist"]'], dental: ['["amenity"="dentist"]'],
  pharmacy: ['["amenity"="pharmacy"]'], hotel: ['["tourism"~"hotel|motel|guest_house"]'],
  realestate: ['["office"="estate_agent"]'], inmobiliaria: ['["office"="estate_agent"]'],
  shopify: ['["shop"]["name"]'], tienda: ['["shop"]["name"]'],
  retail: ['["shop"]["name"]'], store: ['["shop"]["name"]'],
};

function filtersFor(category = "") {
  const normalized = category.toLowerCase();
  return Object.entries(categoryFilters).find(([key]) => normalized.includes(key))?.[1] || [
    '["amenity"]["name"]',
  ];
}

export class LeadSearchError extends Error {
  constructor(message: string, public status = 502) { super(message); }
}

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://gall.openstreetmap.de/api/interpreter",
  "https://lambert.openstreetmap.de/api/interpreter",
];

async function queryOverpass(query: string) {
  let lastStatus = 502;
  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(25_000),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "RevoraLeadResearch/1.0 (business discovery)",
        },
      });
      if (response.ok) return { response, usedFallback: endpoint !== overpassEndpoints[0] };
      lastStatus = response.status;
      if (![429, 502, 503, 504].includes(response.status)) break;
    } catch {
      lastStatus = 504;
    }
  }
  throw new LeadSearchError(
    `Business search providers are temporarily unavailable (${lastStatus})`,
    lastStatus === 429 ? 429 : 502,
  );
}

export async function searchLeads(input: ValidLeadSearchRequest): Promise<LeadSearchResponse> {
  const hasSpecificCategory = Object.keys(categoryFilters)
    .some(key => input.category?.toLowerCase().includes(key));
  const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
  geocodeUrl.searchParams.set("q", input.query || input.location.value);
  geocodeUrl.searchParams.set("format", "jsonv2");
  geocodeUrl.searchParams.set("limit", "1");
  const geocodeResponse = await fetch(geocodeUrl, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "RevoraLeadResearch/1.0 (business discovery)" },
  });
  if (!geocodeResponse.ok) throw new LeadSearchError(`OpenStreetMap responded ${geocodeResponse.status}`, geocodeResponse.status === 429 ? 429 : 502);
  const geocodes = await geocodeResponse.json() as Array<{ lat: string; lon: string; display_name: string }>;
  if (!geocodes[0]) throw new LeadSearchError("Location not found. Try city and region or a postal code.", 404);
  const { lat, lon, display_name: searchArea } = geocodes[0];
  const statements = filtersFor(input.category).flatMap(filter =>
    ["node", "way", "relation"].map(type => `${type}${filter}(around:${input.radius},${lat},${lon});`)
  ).join("");
  const query = `[out:json][timeout:25];(${statements});out center tags ${input.limit};`;
  const { response: overpassResponse, usedFallback } = await queryOverpass(query);
  const overpass = await overpassResponse.json() as { elements: OverpassElement[] };
  const excluded = input.excludeExisting
    ? new Set<string>((await pool.query("SELECT b.domain FROM businesses b JOIN funnels f ON f.business_id=b.id")).rows.map(row => candidateDomain(row.domain)).filter(Boolean) as string[])
    : new Set<string>();
  const candidates = mapOverpassCandidates(overpass.elements, {
    city: input.location.type === "city" ? input.location.value : undefined,
    postalCode: input.location.type === "postalCode" ? input.location.value : undefined,
    searchArea,
  }, excluded);
  const partial = overpass.elements.length >= input.limit;
  const warnings = [
    ...(partial ? [`Results were limited to ${input.limit}; refine the search for complete coverage.`] : []),
    ...(!hasSpecificCategory ? ["Broad searches prioritize named public amenities. Add a supported category for more targeted business coverage."] : []),
    ...(usedFallback ? ["The primary OpenStreetMap search server was unavailable; results came from its official fallback server."] : []),
  ];
  return {
    candidates,
    providerStatus: { nominatim: "success", overpass: partial ? "partial" : "success" },
    warnings,
    requestMetadata: { searchArea, radius: input.radius, limit: input.limit, returned: candidates.length, partial },
  };
}
