export type ProviderState = "configured" | "not_configured" | "success" | "partial" | "unavailable" | "rate_limited" | "failed" | "not_checked";

export interface LeadEvidence {
  field: string;
  source: string;
  value: string;
}

export interface LeadCandidate {
  source: "openstreetmap";
  sourceId: string | null;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  website: string | null;
  phone: string | null;
  publicEmail: string | null;
  evidence: LeadEvidence[];
  confidence: number | null;
}

export interface LeadSearchRequest {
  query?: string;
  location: { type: "city" | "postalCode" | "address" | "query"; value: string };
  category?: string;
  radius?: number;
  bounds?: { south: number; west: number; north: number; east: number };
  excludeExisting?: boolean;
  limit?: number;
}

export interface LeadSearchResponse {
  candidates: LeadCandidate[];
  providerStatus: { nominatim: ProviderState; overpass: ProviderState };
  warnings: string[];
  requestMetadata: {
    searchArea: string;
    radius: number;
    limit: number;
    returned: number;
    partial: boolean;
  };
}
