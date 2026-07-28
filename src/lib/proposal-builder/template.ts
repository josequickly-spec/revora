import type { ProposalContent, ProposalTerms } from "./contracts.ts";

export const proposalTemplates = [
  { id: "funnel-optimization", type: "funnel_optimization", name: "Funnel Optimization", services: ["Conversion path review", "Lead capture improvements"] },
  { id: "website-conversion", type: "conversion_optimization", name: "Website Conversion Improvement", services: ["CTA and form improvements", "Trust improvements"] },
  { id: "lead-generation", type: "lead_generation", name: "Lead Generation Foundation", services: ["Lead capture foundation", "Measurement plan"] },
  { id: "local-seo", type: "local_seo", name: "Local SEO Improvement", services: ["Local visibility foundation", "Technical SEO review"] },
  { id: "tracking", type: "analytics_tracking", name: "Tracking and Analytics Setup", services: ["Analytics configuration", "Conversion event plan"] },
  { id: "custom", type: "custom", name: "Custom Strategy", services: [] },
] as const;

export const standardDisclaimers = [
  "Outcomes are not guaranteed.",
  "Projections require verified baseline data.",
  "Recommendations are based on available evidence.",
  "Final scope, pricing and terms require review and written approval.",
];

export function blankContent(): ProposalContent {
  return {
    executiveSummary: "", currentSituation: "", objectives: [], recommendedServices: [], deliverables: [],
    implementationPhases: [], timeline: "To be confirmed", clientResponsibilities: [],
    providerResponsibilities: [], assumptions: [], exclusions: [], successMeasurement: [],
    nextSteps: [], evidenceReferences: [], disclaimers: standardDisclaimers,
  };
}

export function defaultTerms(): ProposalTerms {
  return { paymentTerms: "To be confirmed", validityDays: 30, cancellationTerms: "To be confirmed", additionalTerms: [] };
}
