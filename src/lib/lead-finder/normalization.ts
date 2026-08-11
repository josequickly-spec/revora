import type { LeadCandidate, LeadEvidence } from "./contracts";

export interface OverpassElement {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function candidateDomain(website: string | null | undefined) {
  if (!website) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function mapOverpassCandidates(
  elements: OverpassElement[],
  fallback: { city?: string; postalCode?: string; searchArea: string },
  excludedDomains = new Set<string>(),
) {
  const seen = new Set<string>();
  const candidates: LeadCandidate[] = [];
  for (const element of elements) {
    const tags = element.tags || {};
    if (!tags.name) continue;
    const website = tags.website || tags["contact:website"] || null;
    const domain = candidateDomain(website);
    const key = `${tags.name.toLowerCase()}|${tags["addr:housenumber"] || ""}|${tags["addr:street"] || ""}`;
    if (seen.has(key) || (domain && excludedDomains.has(domain))) continue;
    seen.add(key);
    const category = tags.amenity || tags.shop || tags.office || tags.craft || tags.tourism || tags.healthcare || null;
    const address = [
      tags["addr:housenumber"], tags["addr:street"], tags["addr:city"],
      tags["addr:state"], tags["addr:postcode"],
    ].filter(Boolean).join(", ") || fallback.searchArea;
    const evidence: LeadEvidence[] = ([
      ["name", tags.name],
      ["website", website],
      ["phone", tags.phone || tags["contact:phone"]],
      ["publicEmail", tags.email || tags["contact:email"]],
    ] as Array<[string, string | null | undefined]>).flatMap(([field, value]) => value ? [{ field, source: "OpenStreetMap", value }] : []);
    candidates.push({
      source: "openstreetmap",
      sourceId: `osm_${element.type}_${element.id}`,
      name: tags.name,
      category,
      address,
      city: tags["addr:city"] || fallback.city || null,
      region: tags["addr:state"] || null,
      postalCode: tags["addr:postcode"] || fallback.postalCode || null,
      country: tags["addr:country"] || null,
      latitude: element.lat ?? element.center?.lat ?? null,
      longitude: element.lon ?? element.center?.lon ?? null,
      website,
      phone: tags.phone || tags["contact:phone"] || null,
      publicEmail: tags.email || tags["contact:email"] || null,
      evidence,
      confidence: null,
    });
  }
  return candidates;
}
