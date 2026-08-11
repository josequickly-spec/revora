import { createHash } from "node:crypto";
import { deriveOpportunities } from "../opportunity-engine/derive.ts";
import { buildEvidenceCatalog } from "./evidence.ts";
import type { AIConsultantContext, AIConsultantRequest } from "./contracts.ts";
import type { StoredAudit } from "../funnelspy-store.ts";
import { AI_CONSULTANT_CONTEXT_VERSION } from "./versions.ts";

export class ConsultantAssemblyError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function assembleConsultantContext(
  request: AIConsultantRequest,
  business: Record<string, unknown>,
  audit: StoredAudit,
): AIConsultantContext {
  if (audit.businessId !== request.businessId) {
    throw new ConsultantAssemblyError("association_mismatch", "Audit is not associated with this business.", 409);
  }
  const result = deriveOpportunities(audit);
  const selected = request.selectedOpportunityIds?.length
    ? result.opportunities.filter(item => request.selectedOpportunityIds?.includes(item.id))
    : result.opportunities;
  if (request.selectedOpportunityIds?.some(id => !result.opportunities.some(item => item.id === id))) {
    throw new ConsultantAssemblyError("opportunity_not_found", "One or more selected opportunities do not belong to this audit.", 400);
  }
  const evidenceCatalog = buildEvidenceCatalog(business, audit, selected);
  const unavailableFacts = [
    ...(!business.technologyData ? ["Technology enrichment is unavailable."] : []),
    ...(!audit.analysis.performance || audit.analysis.performance.status !== "success" ? ["Complete PageSpeed evidence is unavailable."] : []),
    ...(selected.length ? [] : ["No deterministic opportunities were derived from this audit."]),
    "Traffic, revenue, conversion performance and market share are unavailable unless explicitly represented in supplied evidence.",
  ];
  const core = {
    business,
    businessIntelligenceFacts: {
      technologyData: business.technologyData || null,
      publicProfile: Object.fromEntries(Object.entries(business).filter(([key]) => !["monthlyRevenue", "averageOrderValue", "conversionRate", "monthlyAdSpend"].includes(key))),
    },
    audit: {
      id: audit.id, domain: audit.domain, createdAt: audit.createdAt,
      score: audit.analysis.score, scoreLabel: audit.analysis.scoreLabel,
      totals: audit.analysis.totals, funnelStages: audit.analysis.funnelStages,
      technologies: audit.analysis.technologies.slice(0, 50),
      performance: audit.analysis.performance, discovery: audit.analysis.discovery,
      warnings: audit.analysis.warnings.slice(0, 20),
    },
    opportunities: selected.map(item => ({ ...item, evidence: item.evidence.slice(0, 10) })),
    evidenceCatalog,
    objective: request.objective, locale: request.locale, reportStyle: request.reportStyle,
    knownLimitations: [...result.warnings, ...unavailableFacts],
    unavailableFacts,
    sourceVersions: {
      context: AI_CONSULTANT_CONTEXT_VERSION,
      audit: "funnel-audit-v1",
      scoring: "funnelspy-score-v1",
      opportunityRules: result.rulesVersion,
    },
  };
  return { ...core, contextHash: createHash("sha256").update(JSON.stringify(core)).digest("hex") };
}
