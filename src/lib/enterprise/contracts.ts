import { z } from "zod";

export const systemRoles = ["owner","admin","manager","sales","marketing","viewer"] as const;
export const permissions = [
  "organization.manage","security.manage","crm.read","crm.write","crm.stage.change",
  "billing.read","billing.manage","workflow.read","workflow.manage","api.manage",
] as const;

export type Permission = typeof permissions[number];
export type SystemRole = typeof systemRoles[number];

export const registrationSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(12).max(200),
  displayName: z.string().trim().min(1).max(200),
  organizationName: z.string().trim().min(2).max(200),
}).strict();

export const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
  mfaCode: z.string().regex(/^\d{6}$/).optional(),
}).strict();

export const refreshSchema = z.object({ refreshToken: z.string().min(32).max(500) }).strict();
export const apiKeyCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  permissions: z.array(z.enum(permissions)).min(1),
  expiresAt: z.string().datetime().nullable().default(null),
}).strict();

export const accountCreateSchema = z.object({
  businessId: z.number().int().positive(),
  workspaceId: z.string().uuid(),
  ownerMembershipId: z.string().uuid().nullable().default(null),
}).strict();

export const opportunityCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  accountId: z.string().uuid(),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  ownerMembershipId: z.string().uuid().nullable().default(null),
  title: z.string().trim().min(1).max(240),
  amountMinor: z.number().int().nonnegative().nullable().default(null),
  currency: z.string().length(3).toUpperCase().nullable().default(null),
  expectedCloseDate: z.string().date().nullable().default(null),
  sourceContext: z.enum(["manual","proposal","outreach","import"]).default("manual"),
  sourceId: z.string().max(100).nullable().default(null),
}).strict().refine(value => (value.amountMinor === null) === (value.currency === null), {
  message: "Amount and currency must be supplied together.",
});

export const stageChangeSchema = z.object({
  stageId: z.string().uuid(),
  expectedVersion: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1_000),
}).strict();

export const taskCreateSchema = z.object({
  workspaceId: z.string().uuid(),
  accountId: z.string().uuid().nullable().default(null),
  opportunityId: z.string().uuid().nullable().default(null),
  assigneeMembershipId: z.string().uuid().nullable().default(null),
  title: z.string().trim().min(1).max(240),
  description: z.string().max(5_000).nullable().default(null),
  priority: z.enum(["low","normal","high","urgent"]).default("normal"),
  dueAt: z.string().datetime().nullable().default(null),
}).strict();

export const activityCreateSchema = z.object({
  accountId:z.string().uuid().nullable().default(null),opportunityId:z.string().uuid().nullable().default(null),
  contactId:z.number().int().positive().nullable().default(null),
  activityType:z.enum(["call","meeting","email","note","proposal","outreach_event","system_event"]),
  subject:z.string().trim().min(1).max(240),body:z.string().max(10_000).nullable().default(null),
  occurredAt:z.string().datetime(),
}).strict();
export const noteCreateSchema = z.object({
  accountId:z.string().uuid().nullable().default(null),opportunityId:z.string().uuid().nullable().default(null),
  body:z.string().trim().min(1).max(20_000),
}).strict();
export const calendarCreateSchema = z.object({
  workspaceId:z.string().uuid(),accountId:z.string().uuid().nullable().default(null),opportunityId:z.string().uuid().nullable().default(null),
  title:z.string().trim().min(1).max(240),startsAt:z.string().datetime(),endsAt:z.string().datetime(),
  timezone:z.string().min(1).max(100),location:z.string().max(1_000).nullable().default(null),
}).strict().refine(value=>new Date(value.endsAt)>new Date(value.startsAt),{message:"Calendar event must end after it starts."});

export const jobCreateSchema = z.object({
  queue: z.enum(["crm","notifications","maintenance","webhook","export"]),
  jobType: z.string().regex(/^[a-z][a-z0-9_.-]{2,99}$/),
  payload: z.record(z.string(), z.unknown()).default({}),
  idempotencyKey: z.string().trim().min(8).max(120),
  priority: z.number().int().min(1).max(1_000).default(100),
  maxAttempts: z.number().int().min(1).max(10).default(3),
  availableAt: z.string().datetime().optional(),
}).strict();

export const usageCreateSchema = z.object({
  metric: z.string().regex(/^[a-z][a-z0-9_.-]{1,79}$/),
  quantity: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(8).max(100),
  sourceContext: z.string().trim().min(1).max(60),
  sourceId: z.string().max(100).nullable().default(null),
}).strict();

export const crmResources = ["accounts","contacts","opportunities","tasks","activities","notes","calendar","forecast","pipeline","suggested-actions"] as const;
export type CrmResource = typeof crmResources[number];
