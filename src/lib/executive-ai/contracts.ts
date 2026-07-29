import {z} from "zod";
export const advisors=["business","revenue","sales","marketing","operations","security","growth"] as const;
export const advisorSchema=z.enum(advisors);
export const executiveRecommendationSchema=z.object({priority:z.enum(["critical","high","medium","low"]),title:z.string().min(1).max(240),recommendation:z.string().min(1).max(3000),rationale:z.string().min(1).max(3000),evidenceRefs:z.array(z.string().min(1)).min(1),risks:z.array(z.string().min(1).max(500)).max(10)}).strict();
export const executiveOutputSchema=z.object({summary:z.string().min(1).max(3000),recommendations:z.array(executiveRecommendationSchema).max(12),limitations:z.array(z.string().min(1).max(500)).max(20)}).strict();
export type Advisor=typeof advisors[number];export type ExecutiveOutput=z.infer<typeof executiveOutputSchema>;
