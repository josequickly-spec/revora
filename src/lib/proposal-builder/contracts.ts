import { z } from "zod";

export const proposalStatuses = ["draft", "ready", "published", "viewed", "expired", "accepted", "rejected", "archived"] as const;
export const activeProposalStatuses = ["draft", "ready", "published", "viewed", "expired", "archived"] as const;
export const proposalTypes = ["funnel_optimization", "website_redesign", "lead_generation", "local_seo", "analytics_tracking", "conversion_optimization", "crm_setup", "outreach_setup", "custom"] as const;
export const pricingModels = ["fixed", "recurring", "phased", "custom"] as const;
export const creationModes = ["blank", "evidence_assisted", "template"] as const;
export const currencies = ["USD", "EUR", "GBP"] as const;

export const proposalCreateSchema = z.object({
  businessId: z.number().int().positive(),
  auditId: z.string().uuid(),
  consultantReportId: z.string().uuid().optional(),
  proposalType: z.enum(proposalTypes),
  creationMode: z.enum(creationModes),
  locale: z.enum(["en", "es"]).default("en"),
  currency: z.enum(currencies).default("USD"),
  selectedOpportunityIds: z.array(z.string().min(1).max(200)).max(50).optional(),
  selectedServiceTemplateIds: z.array(z.string().min(1).max(100)).max(20).optional(),
}).strict();

export type ProposalCreateRequest = z.infer<typeof proposalCreateSchema>;

const evidenceReferenceSchema = z.object({
  id: z.string().min(1).max(200),
  sourceType: z.enum(["business_intelligence", "funnel_audit", "opportunity", "competitor_comparison", "ai_consultant", "user_provided"]),
  sourceId: z.string().min(1).max(200),
  sourceVersion: z.string().min(1).max(100),
  label: z.string().min(1).max(240),
  fact: z.string().min(1).max(2_000),
  advisory: z.boolean().default(false),
  capturedAt: z.string().datetime().nullable(),
}).strict();

export const proposalServiceSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(2_000),
  reason: z.string().max(2_000),
  deliverables: z.array(z.string().min(1).max(500)).max(30),
  relatedOpportunityIds: z.array(z.string().min(1).max(200)).max(30),
  evidenceReferenceIds: z.array(z.string().min(1).max(200)).max(30),
  quantity: z.number().int().positive().max(10_000).optional(),
  unitPriceMinor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  recurringInterval: z.enum(["month", "quarter", "year"]).optional(),
  taxable: z.boolean().optional(),
  selected: z.boolean(),
}).strict();

export const proposalContentSchema = z.object({
  executiveSummary: z.string().max(5_000),
  currentSituation: z.string().max(5_000),
  objectives: z.array(z.string().max(1_000)).max(30),
  recommendedServices: z.array(proposalServiceSchema).max(30),
  deliverables: z.array(z.string().max(1_000)).max(60),
  implementationPhases: z.array(z.object({ name: z.string().max(200), description: z.string().max(2_000) }).strict()).max(20),
  timeline: z.string().max(2_000),
  clientResponsibilities: z.array(z.string().max(1_000)).max(30),
  providerResponsibilities: z.array(z.string().max(1_000)).max(30),
  assumptions: z.array(z.string().max(1_000)).max(30),
  exclusions: z.array(z.string().max(1_000)).max(30),
  successMeasurement: z.array(z.string().max(1_000)).max(30),
  nextSteps: z.array(z.string().max(1_000)).max(30),
  evidenceReferences: z.array(evidenceReferenceSchema).max(200),
  disclaimers: z.array(z.string().max(1_000)).min(3).max(20),
}).strict();

export const pricingInputSchema = z.object({
  pricingModel: z.enum(pricingModels),
  lineItems: z.array(z.object({
    id: z.string().min(1).max(100), name: z.string().min(1).max(200),
    quantity: z.number().int().positive().max(10_000),
    unitAmountMinor: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    recurringInterval: z.enum(["month", "quarter", "year"]).nullable(),
    taxable: z.boolean(),
  }).strict()).max(50),
  discount: z.object({ type: z.enum(["none", "percentage", "fixed"]), value: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).strict(),
  taxRateBasisPoints: z.number().int().min(0).max(100_000),
  deposit: z.object({ type: z.enum(["none", "percentage", "fixed"]), value: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).strict(),
  currency: z.enum(currencies),
}).strict();

export const proposalPricingSchema = pricingInputSchema.extend({
  subtotalMinor: z.number().int().nonnegative(),
  discountMinor: z.number().int().nonnegative(),
  taxMinor: z.number().int().nonnegative(),
  totalMinor: z.number().int().nonnegative(),
  depositMinor: z.number().int().nonnegative(),
  remainingMinor: z.number().int().nonnegative(),
  recurringTotalMinor: z.number().int().nonnegative().nullable(),
  calculationVersion: z.literal("proposal-pricing-v1"),
}).strict();

export const proposalTermsSchema = z.object({
  paymentTerms: z.string().max(3_000),
  validityDays: z.number().int().min(1).max(365),
  cancellationTerms: z.string().max(3_000),
  additionalTerms: z.array(z.string().max(2_000)).max(30),
}).strict();

export const proposalUpdateSchema = z.object({
  expectedVersion: z.number().int().positive(),
  title: z.string().trim().min(1).max(240),
  content: proposalContentSchema,
  pricingInput: pricingInputSchema,
  terms: proposalTermsSchema,
  internalNotes: z.string().max(10_000),
}).strict();

export type ProposalContent = z.infer<typeof proposalContentSchema>;
export type ProposalPricing = z.infer<typeof proposalPricingSchema>;
export type ProposalPricingInput = z.infer<typeof pricingInputSchema>;
export type ProposalTerms = z.infer<typeof proposalTermsSchema>;
export type ProposalUpdateRequest = z.infer<typeof proposalUpdateSchema>;
export type ProposalStatus = typeof proposalStatuses[number];

export interface ProposalRecord {
  id: string; businessId: number; auditId: string; consultantReportId: string | null;
  title: string; proposalType: typeof proposalTypes[number]; status: ProposalStatus;
  currency: typeof currencies[number]; locale: "en" | "es"; currentVersion: number; publishedVersion: number | null;
  templateVersion: string; contentSchemaVersion: string; publicTokenPrefix: string | null;
  publicTokenCreatedAt: string | null; publicExpiresAt: string | null;
  firstViewedAt: string | null; lastViewedAt: string | null; viewCount: number;
  createdAt: string; updatedAt: string; publishedAt: string | null; archivedAt: string | null;
  content: ProposalContent; pricing: ProposalPricing; terms: ProposalTerms;
  evidenceSnapshot: ProposalContent["evidenceReferences"]; internalNotes: string; warnings: string[];
  legacy?: boolean;
}
