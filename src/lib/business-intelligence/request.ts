import type { FunnelLanguageMode } from "@/lib/funnel-generator";

export interface DiscoveryRequest {
  domain?: string;
  businessName: string;
  industryType?: string;
  businessCategory?: string;
  city?: string;
  zipcode?: string;
  contactName?: string;
  firstName?: string;
  lastName?: string;
  languageMode?: FunnelLanguageMode;
  createFunnel?: boolean;
}

export function parseCreateFunnel(body: DiscoveryRequest) {
  return body.createFunnel === true;
}
