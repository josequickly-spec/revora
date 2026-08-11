import { generateStructured } from "@/lib/ai-provider-router";
import { aiConsultantOutputSchema, type AIConsultantOutput } from "./contracts";
import { AI_CONSULTANT_TIMEOUT_MS } from "./versions";

export interface AIConsultantProviderResult {
  provider: string;
  model: string;
  output: AIConsultantOutput;
  usage: Record<string, unknown> | null;
  latencyMs: number;
  requestId: string | null;
  finishReason: string | null;
  warnings: string[];
}

export interface AIConsultantProvider {
  generateStructuredReport(input: { system: string; user: string }): Promise<AIConsultantProviderResult>;
}

export class OpenAIConsultantProvider implements AIConsultantProvider {
  async generateStructuredReport(input: { system: string; user: string }) {
    const result = await generateStructured({
      task: "strategy",
      schemaName: "ai_consultant_report",
      schema: aiConsultantOutputSchema,
      timeoutMs: AI_CONSULTANT_TIMEOUT_MS,
      system: input.system,
      user: input.user,
    });
    return {
      provider: result.provider,
      model: result.model,
      output: result.output,
      usage: result.usage,
      latencyMs: result.latencyMs,
      requestId: result.requestId,
      finishReason: result.finishReason,
      warnings: result.warnings,
    };
  }
}
