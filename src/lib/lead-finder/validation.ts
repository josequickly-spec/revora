import { z } from "zod";

export const leadSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  location: z.object({
    type: z.enum(["city", "postalCode", "address", "query"]),
    value: z.string().trim().min(1).max(200),
  }),
  category: z.string().trim().max(100).optional(),
  radius: z.coerce.number().int().min(500).max(25000).default(12000),
  bounds: z.object({
    south: z.number().min(-90).max(90),
    west: z.number().min(-180).max(180),
    north: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
  }).optional(),
  excludeExisting: z.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(40),
});

export type ValidLeadSearchRequest = z.infer<typeof leadSearchSchema>;
