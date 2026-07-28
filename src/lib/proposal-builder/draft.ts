import type { ProposalContent, ProposalCreateRequest } from "./contracts";
import { buildProposalEvidence } from "./evidence";
import { blankContent, defaultTerms, proposalTemplates } from "./template";
import { calculateProposalPricing } from "./pricing";

export async function buildProposalDraft(request: ProposalCreateRequest) {
  const context = await buildProposalEvidence(request);
  const content = blankContent();
  const businessName = String(context.business.name || "Client");
  const template = proposalTemplates.find(item => item.type === request.proposalType) || proposalTemplates.at(-1)!;
  if (request.creationMode !== "blank") {
    content.executiveSummary = `This proposal outlines a reviewable scope for ${businessName} based on the selected persisted evidence.`;
    content.currentSituation = `The selected FunnelSpy audit identified ${context.opportunities.length} deterministic opportunities.`;
    content.objectives = context.opportunities.slice(0, 5).map(item => item.title);
    content.recommendedServices = context.opportunities.slice(0, 8).map((item, index) => {
      const evidenceReferenceIds = context.evidence.filter(ref => ref.sourceId === item.id).map(ref => ref.id);
      return {
        id: `service-${index + 1}`, name: item.title, description: item.description,
        reason: item.recommendedAction, deliverables: [item.recommendedAction],
        relatedOpportunityIds: [item.id], evidenceReferenceIds,
        selected: true, taxable: false,
      };
    });
    if (request.creationMode === "template" && content.recommendedServices.length === 0) {
      content.recommendedServices = template.services.map((name, index) => ({
        id: `template-service-${index + 1}`, name, description: "User-reviewable template service.",
        reason: "Selected template structure.", deliverables: [], relatedOpportunityIds: [],
        evidenceReferenceIds: [], selected: true, taxable: false,
      }));
    }
    content.deliverables = content.recommendedServices.flatMap(item => item.deliverables);
    content.implementationPhases = [{ name: "Evidence review", description: "Confirm scope, responsibilities and measurable targets before implementation." }];
    content.assumptions = ["The persisted audit represents the website at its capture date."];
    content.exclusions = ["Guaranteed commercial outcomes", "Unapproved outreach or publication"];
    content.successMeasurement = ["Targets will be defined against verified baseline data."];
    content.nextSteps = ["Review services, pricing and terms.", "Mark ready only after validation.", "Publish explicitly when approved."];
    content.evidenceReferences = context.evidence;
  }
  if (context.consultant?.report) {
    content.executiveSummary = context.consultant.report.executiveSummary;
    content.assumptions = [...new Set([...content.assumptions, ...context.consultant.report.assumptions])];
  }
  const pricing = calculateProposalPricing({
    pricingModel: "fixed", lineItems: [],
    discount: { type: "none", value: 0 }, taxRateBasisPoints: 0,
    deposit: { type: "none", value: 0 }, currency: request.currency,
  });
  return {
    title: `${template.name} Proposal for ${businessName}`,
    content, pricing, terms: defaultTerms(), internalNotes: "",
    evidenceSnapshot: context.evidence,
    warnings: [
      "Pricing is user-controlled and currently contains no prefilled amounts.",
      ...(context.consultant ? ["AI Consultant text is advisory and must be reviewed."] : []),
    ],
  };
}
