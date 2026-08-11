import type { ProviderState } from "@/lib/lead-finder/contracts";
import type { SiteAudit } from "@/lib/site-audit";
import type { BuiltWithTechnology } from "@/lib/builtwith";

export interface BusinessIntelligenceProfile {
  business: Record<string, unknown>;
  normalizedDomain: string;
  websiteStatus: { reachable: boolean; url: string | null };
  platform: string | null;
  technologies: BuiltWithTechnology[];
  contacts: Array<Record<string, unknown>>;
  publicContactEvidence: Array<{ source: string; uri: string | null }>;
  auditSummary: SiteAudit | null;
  enrichmentProviderStatus: {
    website: ProviderState;
    siteAudit: ProviderState;
    builtWith: ProviderState;
    hunter: ProviderState;
  };
  warnings: string[];
  timestamps: { enrichedAt: string };
}
