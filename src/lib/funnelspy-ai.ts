import { z } from "zod";

export const funnelAIReportSchema = z.object({
  executiveSummary: z.string(),
  funnelType: z.enum(["lead-generation", "ecommerce", "appointment", "application", "subscription", "local-business", "hybrid", "unknown"]),
  confidence: z.number().int().min(0).max(100),
  primaryObjective: z.string(),
  targetAudience: z.string(),
  valueProposition: z.string(),
  primaryCTA: z.string(),
  strengths: z.array(z.string()).max(8),
  weaknesses: z.array(z.string()).max(8),
  recommendations: z.array(z.object({
    priority: z.enum(["high", "medium", "low"]),
    title: z.string(),
    action: z.string(),
    expectedImpact: z.string(),
  })).max(8),
  adAngles: z.array(z.string()).max(6),
  limitations: z.array(z.string()).max(6),
});

export type FunnelAIReport = z.infer<typeof funnelAIReportSchema>;
