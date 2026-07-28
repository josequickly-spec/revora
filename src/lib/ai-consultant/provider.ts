import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { aiConsultantOutputSchema, type AIConsultantOutput } from "./contracts";
import { AI_CONSULTANT_MODEL, AI_CONSULTANT_PROVIDER, AI_CONSULTANT_TIMEOUT_MS } from "./versions";

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
    if (!process.env.OPENAI_API_KEY) {
      const error = new Error("OpenAI is not configured.") as Error & { code: string };
      error.code = "missing_api_key";
      throw error;
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: AI_CONSULTANT_TIMEOUT_MS, maxRetries: 0 });
    const started = Date.now();
    const response = await client.responses.parse({
      model: AI_CONSULTANT_MODEL,
      reasoning: { effort: "low" },
      input: [{ role: "system", content: input.system }, { role: "user", content: input.user }],
      text: { format: zodTextFormat(aiConsultantOutputSchema, "ai_consultant_report") },
    });
    if (!response.output_parsed) throw new Error("malformed_provider_output");
    return {
      provider: AI_CONSULTANT_PROVIDER,
      model: AI_CONSULTANT_MODEL,
      output: response.output_parsed,
      usage: response.usage ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, totalTokens: response.usage.total_tokens } : null,
      latencyMs: Date.now() - started,
      requestId: response.id || null,
      finishReason: response.status || null,
      warnings: [],
    };
  }
}
