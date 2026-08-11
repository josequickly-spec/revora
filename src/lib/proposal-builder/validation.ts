import type { ProposalContent, ProposalPricing, ProposalTerms } from "./contracts";
import { assertNoUnsupportedFinancialClaims } from "./sanitization.ts";

export function validateProposalForReady(input: {
  title: string; content: ProposalContent; pricing: ProposalPricing; terms: ProposalTerms;
  evidenceSnapshot: ProposalContent["evidenceReferences"];
}) {
  const errors: string[] = [];
  if (!input.title.trim()) errors.push("title_required");
  if (!input.content.executiveSummary.trim()) errors.push("executive_summary_required");
  if (!input.content.recommendedServices.some(item => item.selected)) errors.push("service_required");
  if (!input.content.deliverables.length) errors.push("deliverable_required");
  if (!input.content.timeline.trim()) errors.push("timeline_required");
  if (!input.content.assumptions.length) errors.push("assumptions_required");
  if (!input.content.exclusions.length) errors.push("exclusions_required");
  if (input.content.disclaimers.length < 3) errors.push("disclaimers_required");
  const allowedEvidence = new Set(input.evidenceSnapshot.map(item => item.id));
  for (const reference of input.content.evidenceReferences) if (!allowedEvidence.has(reference.id)) errors.push(`unknown_evidence:${reference.id}`);
  for (const service of input.content.recommendedServices) {
    for (const id of service.evidenceReferenceIds) if (!allowedEvidence.has(id)) errors.push(`unknown_evidence:${id}`);
  }
  assertNoUnsupportedFinancialClaims({ content: input.content, terms: input.terms });
  if (errors.length) throw new Error(`proposal_invalid:${[...new Set(errors)].join(",")}`);
  return true;
}
