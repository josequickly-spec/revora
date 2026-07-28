import type { LeadCandidate } from "./contracts";

export function legacyRequest(body: Record<string, unknown>) {
  const entries = [
    ["address", body.address], ["city", body.city], ["postalCode", body.zipcode], ["query", body.query],
  ] as const;
  const selected = entries.find(([, value]) => typeof value === "string" && value.trim());
  if (!selected) return null;
  return {
    query: typeof body.query === "string" ? body.query : undefined,
    location: { type: selected[0], value: selected[1] as string },
    category: typeof body.category === "string" ? body.category : undefined,
    excludeExisting: body.withoutFunnel === true,
    radius: 12000,
    limit: 40,
  };
}

export function legacyBusiness(candidate: LeadCandidate) {
  return {
    id: candidate.sourceId, name: candidate.name, category: candidate.category || "business",
    address: candidate.address || "", city: candidate.city || "", zipcode: candidate.postalCode || "",
    phone: candidate.phone || undefined, website: candidate.website || undefined,
    email: candidate.publicEmail || undefined, lat: candidate.latitude ?? undefined,
    lng: candidate.longitude ?? undefined, source: "OpenStreetMap Overpass", hasFunnel: false,
  };
}
