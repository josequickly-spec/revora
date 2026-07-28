export type OpportunityCategory =
  | "funnel_stage" | "conversion" | "lead_capture" | "tracking"
  | "performance" | "accessibility" | "seo" | "trust" | "mobile"
  | "technical" | "competitive_gap";

export type OpportunityPriority = "critical" | "high" | "medium" | "low";
export type OpportunityEffort = "low" | "medium" | "high" | "unknown";

export interface OpportunityEvidence {
  fact: string;
  value: string | number | boolean | null;
  pageUrl: string | null;
}

export interface Opportunity {
  id: string;
  businessId: number | null;
  auditId: string;
  category: OpportunityCategory;
  title: string;
  description: string;
  evidence: OpportunityEvidence[];
  evidenceSource: "funnelspy_persisted_audit";
  affectedPages: string[];
  priority: OpportunityPriority;
  impact: OpportunityPriority | "unknown";
  effort: OpportunityEffort;
  confidence: "high" | "medium" | "low";
  status: "derived";
  recommendedAction: string;
  sourceRule: string;
  derivedAt: string;
  rulesVersion: "opportunity-rules-v1";
}

export interface OpportunityResult {
  opportunities: Opportunity[];
  warnings: string[];
  rulesVersion: "opportunity-rules-v1";
}
