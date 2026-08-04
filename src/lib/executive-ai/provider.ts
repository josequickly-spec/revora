import { generateStructured } from "@/lib/ai-provider-router";
import { executiveOutputSchema, type ExecutiveOutput } from "./contracts";

export async function generateExecutiveAdvice(input: { advisor: string; evidence: unknown[] }): Promise<{ output: ExecutiveOutput; provider: string; model: string; usage: unknown }> {
  const generation = await generateStructured({
    task: "executive",
    schemaName: "executive_advice",
    schema: executiveOutputSchema,
    timeoutMs: 60_000,
    system: "You are a read-only executive advisor. Use only supplied evidence. Every recommendation must cite one or more exact evidenceId values. Never claim certainty, execute actions, invent values, or imply that a recommendation has been applied. Return no recommendation when evidence is insufficient.",
    user: JSON.stringify({ advisor: input.advisor, evidence: input.evidence }),
  });
  return { output: generation.output, provider: generation.provider, model: generation.model, usage: generation.usage };
}
