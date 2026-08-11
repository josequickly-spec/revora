import { z } from "zod";
import type { FunnelSpyAnalysis } from "@/lib/funnelspy";

export const funnelAuditRequestSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
  url: z.string().trim().min(3).max(300),
  locale: z.enum(["es", "en"]).optional(),
  forceRefresh: z.boolean().default(false),
  comparisonContext: z.array(z.string().trim().min(3).max(300)).max(4).optional(),
  requestedCapabilities: z.array(z.enum(["crawl", "pagespeed", "rdap", "screenshots"])).default(["crawl", "pagespeed", "rdap", "screenshots"]),
});

export type FunnelAuditRequest = z.infer<typeof funnelAuditRequestSchema>;

export interface FunnelAudit {
  id: string;
  businessId: number | null;
  normalizedDomain: string;
  requestedUrl: string;
  finalUrl: string;
  auditStatus: "completed";
  startedAt: string | null;
  completedAt: string;
  sourceMode: "fresh" | "reused";
  analysis: FunnelSpyAnalysis;
  warnings: string[];
  providerStatuses: {
    crawl: "success";
    pagespeed: "success" | "unavailable";
    rdap: "success" | "unavailable";
    screenshots: "success" | "unavailable";
  };
  crawlLimitations: string[];
  version: { auditSchema: "funnel-audit-v1"; crawler: "funnelspy-crawler-v1"; score: "funnelspy-score-v1" };
}
