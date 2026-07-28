import { z } from "zod";

export const campaignStatuses = ["draft","review_required","approved","scheduled","running","paused","completed","cancelled","failed","archived"] as const;
export const messageStatuses = ["draft","pending","scheduled","queued","sending","sent","delivered","deferred","bounced","failed","suppressed","unsubscribed","replied","cancelled","skipped","unknown"] as const;
export const verificationStatuses = ["unverified","syntax_valid","domain_valid","provider_verified","provider_risky","invalid","unknown"] as const;
export const suppressionTypes = ["global_unsubscribe","campaign_unsubscribe","hard_bounce","repeated_soft_bounce","complaint","manual_block","invalid_address","legal_hold","provider_block"] as const;
export const messageTypes = ["introduction","audit_summary","proposal_delivery","follow_up","final_follow_up","custom"] as const;

export const sendingWindowSchema = z.object({
  weekdays: z.array(z.number().int().min(1).max(5)).min(1).max(5),
  startHour: z.number().int().min(0).max(23),
  endHour: z.number().int().min(1).max(24),
}).strict().refine(value => value.endHour > value.startHour, "End time must be after start time.");

export const campaignCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  businessId: z.number().int().positive(),
  proposalId: z.string().uuid().optional(),
  auditId: z.string().uuid().optional(),
  consultantReportId: z.string().uuid().optional(),
  objective: z.string().trim().min(1).max(1_000),
  senderIdentityId: z.string().uuid(),
  providerConnectionId: z.string().uuid(),
  timezone: z.string().trim().min(1).max(100),
  sendingWindow: sendingWindowSchema.default({ weekdays: [1,2,3,4,5], startHour: 9, endHour: 17 }),
  dailyLimit: z.number().int().min(1).max(200).default(25),
  hourlyLimit: z.number().int().min(1).max(50).default(10),
}).strict();

export const campaignUpdateSchema = z.object({
  expectedVersion: z.number().int().positive(),
  name: z.string().trim().min(1).max(200),
  objective: z.string().trim().min(1).max(1_000),
  timezone: z.string().trim().min(1).max(100),
  sendingWindow: sendingWindowSchema,
  dailyLimit: z.number().int().min(1).max(200),
  hourlyLimit: z.number().int().min(1).max(50),
}).strict();

export const recipientCreateSchema = z.object({
  contactId: z.number().int().positive(),
  provenance: z.enum(["business_website","user_supplied","connected_crm","public_business_listing","enrichment_provider","existing_repository_data","prior_verified_communication"]),
  verificationStatus: z.enum(verificationStatuses),
  verificationSource: z.string().trim().min(1).max(200),
  verificationDate: z.string().datetime().nullable(),
  riskyApproved: z.boolean().default(false),
});

export const sequenceStepSchema = z.object({
  position: z.number().int().min(1).max(5),
  delayValue: z.number().int().min(0).max(90),
  delayUnit: z.enum(["hour","day"]),
  subjectTemplate: z.string().trim().min(1).max(200),
  bodyTemplate: z.string().trim().min(1).max(10_000),
  messageType: z.enum(messageTypes),
  requiresManualReview: z.boolean().default(true),
  enabled: z.boolean().default(true),
});

export const senderIdentitySchema = z.object({
  displayName: z.string().trim().min(1).max(200),
  fromEmail: z.string().email().max(320),
  replyTo: z.string().email().max(320),
  businessName: z.string().trim().min(1).max(200),
  physicalAddress: z.string().trim().min(1).max(1_000),
  domain: z.string().trim().min(1).max(253),
  providerConnectionId: z.string().uuid(),
}).strict();

export type CampaignStatus = typeof campaignStatuses[number];
export type VerificationStatus = typeof verificationStatuses[number];
export type SuppressionType = typeof suppressionTypes[number];
export type CampaignCreate = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdate = z.infer<typeof campaignUpdateSchema>;
export type SequenceStepInput = z.infer<typeof sequenceStepSchema>;
