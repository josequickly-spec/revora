import { z } from "zod";

export const evidenceStatusSchema = z.enum([
  "verified",
  "inferred",
  "requires_confirmation",
]);

export const profileFieldSchema = z.object({
  value: z.string(),
  status: evidenceStatusSchema,
  evidence: z.string(),
});

export const priceProfileFieldSchema = z.object({
  value: z.number().min(0),
  status: evidenceStatusSchema,
  evidence: z.string(),
});

export const businessProfileSchema = z.object({
  businessName: profileFieldSchema,
  businessType: profileFieldSchema,
  targetAudience: profileFieldSchema,
  currentOffer: profileFieldSchema,
  currentPrice: priceProfileFieldSchema,
  primaryObjective: profileFieldSchema,
  valueProposition: profileFieldSchema,
});

export const businessProfileInputSchema = z.object({
  locale: z.enum(["es", "en"]).optional().default("es"),
  businessName: z.string().trim().max(200).optional().default(""),
  businessType: z.string().trim().max(200).optional().default(""),
  targetAudience: z.string().trim().max(2_000).optional().default(""),
  currentOffer: z.string().trim().max(5_000).optional().default(""),
  currentPrice: z.coerce.number().min(0).optional().default(0),
  primaryObjective: z.string().trim().max(2_000).optional().default(""),
  valueProposition: z.string().trim().max(2_000).optional().default(""),
  weaknesses: z.array(z.string().max(1_000)).max(12).optional().default([]),
  recommendations: z.array(z.string().max(1_000)).max(12).optional().default([]),
  evidence: z.array(z.string().max(2_000)).max(30).optional().default([]),
  auditId: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  visualIdentity: z.object({
    logoUrl: z.string().url().or(z.literal("")).optional().default(""),
    heroImageUrl: z.string().url().or(z.literal("")).optional().default(""),
    colors: z.array(z.string().max(30)).max(8).optional().default([]),
    fonts: z.array(z.string().max(120)).max(6).optional().default([]),
    navigation: z.array(z.string().max(80)).max(8).optional().default([]),
    layout: z.string().max(500).optional().default(""),
  }).optional(),
});

export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type BusinessProfileInput = z.infer<typeof businessProfileInputSchema>;
