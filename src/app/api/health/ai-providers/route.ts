import { NextResponse } from "next/server";
import { configuredAIProviders } from "@/lib/ai-provider-router";

export async function GET() {
  try {
    const providers = configuredAIProviders();

    const status = {
      timestamp: new Date().toISOString(),
      allConfigured: providers.every((p) => p.ready),
      providers: providers.map((p) => ({
        name: p.provider,
        status: p.ready ? "✅ Connected" : "❌ Not configured",
        model: p.model,
        ready: p.ready,
      })),
      environment: {
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
        hasAnthropicKey: Boolean(process.env.ANTHROPIC_API_KEY),
        hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
        hasGroqKey: Boolean(process.env.GROQ_API_KEY),
      },
      config: {
        openai: {
          model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
          consultantModel: process.env.OPENAI_CONSULTANT_MODEL || "gpt-5.6-terra",
        },
        anthropic: {
          model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
          promptCacheEnabled: process.env.ANTHROPIC_PROMPT_CACHE !== "false",
        },
        gemini: {
          model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
        },
        groq: {
          model: process.env.GROQ_MODEL || "mixtral-8x7b-32768",
          secondaryModel: process.env.GROQ_SECONDARY_MODEL || "llama-3.1-70b-versatile",
        },
        providerOrder: (process.env.AI_PROVIDER_ORDER || "anthropic,groq,openai,gemini").split(",").map(p => p.trim()),
      },
    };

    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to retrieve AI provider status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
