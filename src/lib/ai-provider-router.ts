import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

export type AIProviderName = "openai" | "anthropic" | "gemini" | "groq";
export type AITask = "strategy" | "otom" | "vision" | "bulk" | "executive";

type ImageInput = { dataUrl: string };

export type StructuredGenerationResult<T> = {
  output: T;
  provider: AIProviderName;
  model: string;
  usage: Record<string, unknown> | null;
  latencyMs: number;
  requestId: string | null;
  finishReason: string | null;
  warnings: string[];
};

type StructuredGenerationInput<T> = {
  task: AITask;
  schemaName: string;
  schema: z.ZodType<T>;
  system: string;
  user: string;
  images?: ImageInput[];
  timeoutMs?: number;
  preferredProviders?: AIProviderName[];
};

const taskOrder: Record<AITask, AIProviderName[]> = {
  strategy: ["openai", "anthropic", "gemini", "groq"],
  otom: ["openai", "anthropic", "gemini", "groq"],
  vision: ["gemini", "openai", "anthropic", "groq"],
  bulk: ["groq", "gemini", "openai", "anthropic"],
  executive: ["openai", "anthropic", "gemini", "groq"],
};

const providerKeys: Record<AIProviderName, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
};

function configured(provider: AIProviderName) {
  return Boolean(process.env[providerKeys[provider]]);
}

function providerOrder(input: StructuredGenerationInput<unknown>) {
  const envOrder = process.env.AI_PROVIDER_ORDER?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is AIProviderName => ["openai", "anthropic", "gemini", "groq"].includes(item));
  return [...new Set(input.preferredProviders?.length ? input.preferredProviders : envOrder?.length ? envOrder : taskOrder[input.task])]
    .filter(configured);
}

function dataUrlParts(dataUrl: string) {
  const match = /^data:([^;,]+);base64,([\s\S]+)$/.exec(dataUrl);
  return match ? { mediaType: match[1], data: match[2] } : null;
}

function jsonSchema<T>(schema: z.ZodType<T>) {
  const converted = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  delete converted.$schema;
  return converted;
}

async function openAI<T>(input: StructuredGenerationInput<T>): Promise<StructuredGenerationResult<T>> {
  const model = process.env.OPENAI_MODEL
    || (input.task === "strategy" ? process.env.OPENAI_CONSULTANT_MODEL : undefined)
    || "gpt-5.6-terra";
  const started = Date.now();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: input.timeoutMs || 60_000, maxRetries: 0 });
  const response = await client.responses.parse({
    model,
    reasoning: { effort: "low" },
    input: [
      { role: "system", content: input.system },
      {
        role: "user",
        content: [
          { type: "input_text", text: input.user },
          ...(input.images || []).map((image) => ({ type: "input_image" as const, image_url: image.dataUrl, detail: "low" as const })),
        ],
      },
    ],
    text: { format: zodTextFormat(input.schema, input.schemaName) },
  });
  if (!response.output_parsed) throw new Error("malformed_provider_output");
  return {
    output: response.output_parsed,
    provider: "openai",
    model,
    usage: response.usage ? { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens, totalTokens: response.usage.total_tokens } : null,
    latencyMs: Date.now() - started,
    requestId: response.id || null,
    finishReason: response.status || null,
    warnings: [],
  };
}

async function anthropic<T>(input: StructuredGenerationInput<T>): Promise<StructuredGenerationResult<T>> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const promptCachingEnabled = process.env.ANTHROPIC_PROMPT_CACHE !== "false";
  const started = Date.now();
  const content: Array<Record<string, unknown>> = [{ type: "text", text: input.user }];
  for (const image of input.images || []) {
    const parsed = dataUrlParts(image.dataUrl);
    if (parsed) content.push({ type: "image", source: { type: "base64", media_type: parsed.mediaType, data: parsed.data } });
  }
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 12_000,
      system: promptCachingEnabled
        ? [{ type: "text", text: input.system, cache_control: { type: "ephemeral" } }]
        : input.system,
      messages: [{ role: "user", content }],
      tools: [{ name: "submit_structured_result", description: "Return the final validated structured result.", input_schema: jsonSchema(input.schema) }],
      tool_choice: { type: "tool", name: "submit_structured_result" },
    }),
    signal: AbortSignal.timeout(input.timeoutMs || 60_000),
  });
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(`anthropic_${response.status}`);
  const blocks = Array.isArray(body.content) ? body.content as Array<Record<string, unknown>> : [];
  const tool = blocks.find((block) => block.type === "tool_use" && block.name === "submit_structured_result");
  if (!tool) throw new Error("malformed_provider_output");
  return {
    output: input.schema.parse(tool.input),
    provider: "anthropic",
    model,
    usage: body.usage as Record<string, unknown> || null,
    latencyMs: Date.now() - started,
    requestId: typeof body.id === "string" ? body.id : null,
    finishReason: typeof body.stop_reason === "string" ? body.stop_reason : null,
    warnings: promptCachingEnabled ? ["Anthropic prompt caching enabled (5-minute TTL)."] : [],
  };
}

async function gemini<T>(input: StructuredGenerationInput<T>): Promise<StructuredGenerationResult<T>> {
  const model = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
  const started = Date.now();
  const parts: Array<Record<string, unknown>> = [{ text: input.user }];
  for (const image of input.images || []) {
    const parsed = dataUrlParts(image.dataUrl);
    if (parsed) parts.push({ inlineData: { mimeType: parsed.mediaType, data: parsed.data } });
  }
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY || "")}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: input.system }] },
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json", responseJsonSchema: jsonSchema(input.schema) },
    }),
    signal: AbortSignal.timeout(input.timeoutMs || 60_000),
  });
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(`gemini_${response.status}`);
  const candidates = body.candidates as Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }> | undefined;
  const text = candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  if (!text) throw new Error("malformed_provider_output");
  return {
    output: input.schema.parse(JSON.parse(text)),
    provider: "gemini",
    model,
    usage: body.usageMetadata as Record<string, unknown> || null,
    latencyMs: Date.now() - started,
    requestId: null,
    finishReason: candidates?.[0]?.finishReason || null,
    warnings: [],
  };
}

async function groq<T>(input: StructuredGenerationInput<T>): Promise<StructuredGenerationResult<T>> {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const started = Date.now();
  const warnings = input.images?.length ? ["Groq fallback used text evidence without image inputs."] : [];
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: input.system }, { role: "user", content: input.user }],
      response_format: { type: "json_schema", json_schema: { name: input.schemaName, strict: true, schema: jsonSchema(input.schema) } },
    }),
    signal: AbortSignal.timeout(input.timeoutMs || 60_000),
  });
  const body = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(`groq_${response.status}`);
  const choices = body.choices as Array<{ message?: { content?: string }; finish_reason?: string }> | undefined;
  const text = choices?.[0]?.message?.content || "";
  if (!text) throw new Error("malformed_provider_output");
  return {
    output: input.schema.parse(JSON.parse(text)),
    provider: "groq",
    model,
    usage: body.usage as Record<string, unknown> || null,
    latencyMs: Date.now() - started,
    requestId: typeof body.id === "string" ? body.id : null,
    finishReason: choices?.[0]?.finish_reason || null,
    warnings,
  };
}

export async function generateStructured<T>(input: StructuredGenerationInput<T>) {
  const order = providerOrder(input as StructuredGenerationInput<unknown>);
  if (!order.length) {
    const error = new Error("No AI provider is configured.") as Error & { code: string };
    error.code = "missing_api_key";
    throw error;
  }
  const attempts: string[] = [];
  const failureCodes = new Set<string>();
  for (const provider of order) {
    try {
      if (provider === "openai") return await openAI(input);
      if (provider === "anthropic") return await anthropic(input);
      if (provider === "gemini") return await gemini(input);
      return await groq(input);
    } catch (error) {
      const candidate = error as { name?: string; code?: string; status?: number; message?: string };
      const message = candidate?.message || "provider_error";
      const failureCode = candidate?.status === 429 || candidate?.code === "rate_limit_exceeded"
        ? "provider_rate_limited"
        : candidate?.status === 404 || candidate?.code === "model_not_found"
          ? "provider_model_unavailable"
          : /timeout|timed out|aborted/i.test(`${candidate?.name || ""} ${candidate?.code || ""} ${message}`)
            ? "provider_timeout"
            : "provider_error";
      failureCodes.add(failureCode);
      attempts.push(`${provider}:${failureCode}:${message.slice(0, 100)}`);
    }
  }
  const error = new Error("All configured AI providers failed.") as Error & { code: string; attempts: string[] };
  error.code = failureCodes.size === 1 ? [...failureCodes][0] : "all_providers_failed";
  error.attempts = attempts;
  throw error;
}

export function configuredAIProviders() {
  return (["openai", "anthropic", "gemini", "groq"] as AIProviderName[]).map((provider) => ({
    provider,
    ready: configured(provider),
    model: provider === "openai" ? process.env.OPENAI_MODEL || process.env.OPENAI_CONSULTANT_MODEL || "gpt-5.6-terra"
      : provider === "anthropic" ? process.env.ANTHROPIC_MODEL || "claude-sonnet-5"
        : provider === "gemini" ? process.env.GEMINI_MODEL || "gemini-3-flash-preview"
          : process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  }));
}
