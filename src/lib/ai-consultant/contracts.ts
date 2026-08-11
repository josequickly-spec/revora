import { z } from "zod";

export const objectives = [
  "improve_lead_generation", "improve_conversion", "improve_local_visibility",
  "improve_tracking", "improve_mobile_experience", "improve_trust",
  "prepare_sales_proposal", "general_growth_strategy",
] as const;
export const reportStyles = ["concise", "standard", "detailed"] as const;

export const aiConsultantRequestSchema = z.object({
  businessId: z.number().int().positive(),
  auditId: z.string().uuid(),
  objective: z.enum(objectives),
  locale: z.enum(["en", "es"]).default("en"),
  reportStyle: z.enum(reportStyles).default("standard"),
  selectedOpportunityIds: z.array(z.string().min(1).max(200)).max(50).optional(),
  regenerate: z.boolean().default(false),
  userInstructions: z.string().trim().max(2_000).optional(),
  requestedSections: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
}).strict();

export type AIConsultantRequest = z.infer<typeof aiConsultantRequestSchema>;

export const evidenceReferenceSchema = z.object({
  id: z.string().min(1),
  sourceType: z.enum(["business_intelligence", "funnel_audit", "opportunity", "competitor_comparison", "user_provided"]),
  sourceId: z.string().min(1),
  sourceVersion: z.string().min(1),
  label: z.string().min(1).max(240),
  fact: z.string().min(1).max(2_000),
  pageUrl: z.string().max(2_048).nullable(),
  auditSection: z.string().max(120).nullable(),
  capturedAt: z.string().datetime().nullable(),
  confidence: z.enum(["high", "medium", "low", "unknown"]),
  availability: z.enum(["available", "unavailable"]),
}).strict();

export type EvidenceReference = z.infer<typeof evidenceReferenceSchema>;

const recommendationSchema = z.object({
  title: z.string().min(1).max(240),
  rationale: z.string().min(1).max(2_000),
  expectedQualitativeImpact: z.enum(["critical", "high", "medium", "low", "unknown"]),
  effort: z.enum(["low", "medium", "high", "unknown"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  recommendedAction: z.string().min(1).max(2_000),
  evidenceReferenceIds: z.array(z.string().min(1)).min(1).max(20),
  relatedOpportunityIds: z.array(z.string().min(1)).max(20),
  confidence: z.enum(["high", "medium", "low"]),
  assumptions: z.array(z.string().max(500)).max(12),
}).strict();

export const aiConsultantOutputSchema = z.object({
  executiveSummary: z.string().min(1).max(4_000),
  currentSituation: z.string().min(1).max(4_000),
  topPriorities: z.array(recommendationSchema).min(1).max(10),
  funnelStrategy: z.array(recommendationSchema).max(8),
  offerStrategy: z.array(recommendationSchema).max(8),
  leadCaptureStrategy: z.array(recommendationSchema).max(8),
  trackingStrategy: z.array(recommendationSchema).max(8),
  trustStrategy: z.array(recommendationSchema).max(8),
  implementationRoadmap: z.array(z.object({
    phase: z.string().min(1).max(120),
    action: z.string().min(1).max(1_000),
    effort: z.enum(["low", "medium", "high", "unknown"]),
    evidenceReferenceIds: z.array(z.string().min(1)).min(1).max(20),
  }).strict()).max(12),
  quickWins: z.array(recommendationSchema).max(8),
  longerTermActions: z.array(recommendationSchema).max(8),
  risks: z.array(z.string().max(1_000)).max(12),
  assumptions: z.array(z.string().max(1_000)).max(20),
  limitations: z.array(z.string().max(1_000)).min(1).max(20),
  evidenceReferences: z.array(evidenceReferenceSchema).min(1).max(200),
  warnings: z.array(z.string().max(1_000)).max(20),
}).strict();

export type AIConsultantOutput = z.infer<typeof aiConsultantOutputSchema>;

export type AIConsultantStatus = "pending" | "generating" | "completed" | "failed" | "superseded";

export interface AIConsultantContext {
  business: Record<string, unknown>;
  businessIntelligenceFacts: Record<string, unknown>;
  audit: Record<string, unknown>;
  opportunities: Array<Record<string, unknown>>;
  evidenceCatalog: EvidenceReference[];
  objective: AIConsultantRequest["objective"];
  locale: AIConsultantRequest["locale"];
  reportStyle: AIConsultantRequest["reportStyle"];
  knownLimitations: string[];
  unavailableFacts: string[];
  sourceVersions: {
    context: string;
    audit: string;
    scoring: string;
    opportunityRules: string;
  };
  contextHash: string;
}

export interface AIConsultantReportRecord {
  id: string;
  businessId: number;
  auditId: string;
  status: AIConsultantStatus;
  objective: AIConsultantRequest["objective"];
  locale: AIConsultantRequest["locale"];
  reportStyle: AIConsultantRequest["reportStyle"];
  provider: string | null;
  model: string | null;
  promptVersion: string;
  schemaVersion: string;
  contextVersion: string;
  opportunityRulesVersion: string | null;
  auditSchemaVersion: string | null;
  scoringVersion: string | null;
  request: AIConsultantRequest;
  contextSummary: Record<string, unknown>;
  report: AIConsultantOutput | null;
  warnings: string[];
  errorCode: string | null;
  errorMessage: string | null;
  usageMetadata: Record<string, unknown> | null;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}
