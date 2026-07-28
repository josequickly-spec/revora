import { createHash } from "node:crypto";
import type { EvidenceReference } from "./contracts.ts";
import type { Opportunity } from "@/lib/opportunity-engine/contracts";
import type { StoredAudit } from "@/lib/funnelspy-store";

function evidenceId(prefix: string, value: string) {
  return `${prefix}-${createHash("sha256").update(value).digest("hex").slice(0, 14)}`;
}

export function buildEvidenceCatalog(
  business: Record<string, unknown>,
  audit: StoredAudit,
  opportunities: Opportunity[],
) {
  const references: EvidenceReference[] = [];
  const add = (reference: Omit<EvidenceReference, "id">, key: string) => {
    references.push({ id: evidenceId(reference.sourceType, key), ...reference });
  };

  for (const key of ["name", "domain", "country", "city", "businessType", "niche", "platform", "status"] as const) {
    const value = business[key];
    if (value == null || value === "") continue;
    add({
      sourceType: "business_intelligence", sourceId: String(business.id), sourceVersion: "business-intelligence-v1",
      label: `Business ${key}`, fact: `${key}: ${String(value)}`, pageUrl: null, auditSection: null,
      capturedAt: typeof business.createdAt === "string" ? business.createdAt : null, confidence: "high", availability: "available",
    }, `${business.id}:${key}:${String(value)}`);
  }

  const analysis = audit.analysis;
  const auditFacts: Array<[string, string, string | number | boolean, string | null]> = [
    ["FunnelSpy score", "score", analysis.score, null],
    ["Pages discovered", "totals", analysis.totals.pages, null],
    ["Calls to action", "totals", analysis.totals.ctas, null],
    ["Lead forms", "totals", analysis.totals.forms, null],
    ["Tracking pixels", "totals", analysis.totals.pixels, null],
    ["Browser rendering", "discovery", analysis.discovery.renderedWithBrowser, null],
  ];
  for (const [label, section, fact, pageUrl] of auditFacts) {
    add({
      sourceType: "funnel_audit", sourceId: audit.id, sourceVersion: "funnel-audit-v1",
      label, fact: `${label}: ${String(fact)}`, pageUrl, auditSection: section,
      capturedAt: audit.createdAt, confidence: "high", availability: "available",
    }, `${audit.id}:${section}:${label}:${String(fact)}`);
  }
  analysis.funnelStages.forEach((stage, index) => add({
    sourceType: "funnel_audit", sourceId: audit.id, sourceVersion: "funnel-audit-v1",
    label: `Funnel stage: ${stage.name}`, fact: `${stage.name} is ${stage.status}. Evidence: ${stage.evidence}`,
    pageUrl: null, auditSection: "funnelStages", capturedAt: audit.createdAt, confidence: stage.status === "detected" ? "high" : "medium", availability: "available",
  }, `${audit.id}:stage:${index}:${stage.name}:${stage.status}`));

  opportunities.forEach((opportunity) => add({
    sourceType: "opportunity", sourceId: opportunity.id, sourceVersion: opportunity.rulesVersion,
    label: opportunity.title, fact: `${opportunity.description} Recommended action: ${opportunity.recommendedAction}`,
    pageUrl: opportunity.affectedPages[0] || null, auditSection: opportunity.category,
    capturedAt: opportunity.derivedAt, confidence: opportunity.confidence, availability: "available",
  }, opportunity.id));
  return references;
}
