import { createHash } from "node:crypto";
import { businessSelect, ensureTechnologyDataColumn, pool } from "@/lib/postgres";
import { getAudit } from "@/lib/funnelspy-store";
import { deriveOpportunities } from "@/lib/opportunity-engine/derive";
import { buildEvidenceCatalog } from "@/lib/ai-consultant/evidence";
import { getConsultantReport } from "@/lib/ai-consultant/store";
import type { ProposalContent, ProposalCreateRequest } from "./contracts";

export class ProposalContextError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) { super(message); this.code = code; this.status = status; }
}

export async function buildProposalEvidence(request: ProposalCreateRequest) {
  await ensureTechnologyDataColumn();
  const businessResult = await pool.query(`SELECT ${businessSelect} FROM businesses WHERE id=$1 LIMIT 1`, [request.businessId]);
  if (!businessResult.rows[0]) throw new ProposalContextError("business_not_found", "Business not found.", 404);
  const audit = await getAudit(request.auditId);
  if (!audit) throw new ProposalContextError("audit_not_found", "Audit not found.", 404);
  if (audit.businessId !== request.businessId) throw new ProposalContextError("association_mismatch", "Audit is not associated with this business.", 409);
  const opportunityResult = deriveOpportunities(audit);
  const opportunities = request.selectedOpportunityIds?.length
    ? opportunityResult.opportunities.filter(item => request.selectedOpportunityIds?.includes(item.id))
    : opportunityResult.opportunities;
  if (request.selectedOpportunityIds?.some(id => !opportunityResult.opportunities.some(item => item.id === id))) {
    throw new ProposalContextError("opportunity_not_found", "A selected opportunity does not belong to this audit.", 400);
  }
  const evidence: ProposalContent["evidenceReferences"] = buildEvidenceCatalog(businessResult.rows[0], audit, opportunities).map(item => ({
    id: item.id, sourceType: item.sourceType === "opportunity" ? "opportunity" : item.sourceType,
    sourceId: item.sourceId, sourceVersion: item.sourceVersion, label: item.label, fact: item.fact,
    advisory: false, capturedAt: item.capturedAt,
  }));
  let consultant: Awaited<ReturnType<typeof getConsultantReport>> = null;
  if (request.consultantReportId) {
    consultant = await getConsultantReport(request.consultantReportId);
    if (!consultant) throw new ProposalContextError("consultant_not_found", "AI Consultant report not found.", 404);
    if (consultant.status !== "completed" || !consultant.report) throw new ProposalContextError("consultant_incomplete", "AI Consultant report is not completed.", 409);
    if (consultant.businessId !== request.businessId || consultant.auditId !== request.auditId) {
      throw new ProposalContextError("consultant_association_mismatch", "AI Consultant report does not match this business and audit.", 409);
    }
    consultant.report.topPriorities.forEach((priority, index) => evidence.push({
      id: `ai-${createHash("sha256").update(`${consultant?.id}:${index}:${priority.title}`).digest("hex").slice(0, 14)}`,
      sourceType: "ai_consultant", sourceId: consultant!.id, sourceVersion: consultant!.promptVersion,
      label: `Advisory: ${priority.title}`, fact: priority.rationale, advisory: true,
      capturedAt: consultant!.completedAt,
    }));
  }
  return { business: businessResult.rows[0] as Record<string, unknown>, audit, opportunities, opportunityResult, consultant, evidence };
}
