import { NextResponse } from "next/server";
import { configuredAIProviders } from "@/lib/ai-provider-router";

export async function GET() {
  const integrations = {
    database: { ready: Boolean(process.env.DATABASE_URL), required: ["DATABASE_URL"] },
    openai: { ready: Boolean(process.env.OPENAI_API_KEY), required: ["OPENAI_API_KEY"] },
    anthropic: { ready: Boolean(process.env.ANTHROPIC_API_KEY), required: ["ANTHROPIC_API_KEY"] },
    gemini: { ready: Boolean(process.env.GEMINI_API_KEY), required: ["GEMINI_API_KEY"] },
    groq: { ready: Boolean(process.env.GROQ_API_KEY), required: ["GROQ_API_KEY"] },
    hunter: { ready: Boolean(process.env.HUNTER_API_KEY), required: ["HUNTER_API_KEY"] },
    linkedin: { ready: true, mode: "guided_research", required: [] as string[] },
    builtWith: { ready: Boolean(process.env.BUILTWITH_API_KEY), required: ["BUILTWITH_API_KEY"] },
    resend: {
      ready: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      required: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    },
    turnstile: {
      ready: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
      required: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"],
    },
    googleAds: {
      ready: Boolean(process.env.GOOGLE_ADS_CUSTOMER_ID && process.env.GOOGLE_ADS_ACCESS_TOKEN && process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
      required: ["GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_ACCESS_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"],
    },
    metaAds: {
      ready: Boolean(process.env.META_AD_ACCOUNT_ID && process.env.META_ACCESS_TOKEN),
      required: ["META_AD_ACCOUNT_ID", "META_ACCESS_TOKEN"],
    },
  };
  return NextResponse.json({
    success: true,
    aiProviders: configuredAIProviders(),
    integrations: Object.fromEntries(
      Object.entries(integrations).map(([key, value]) => [
        key,
        { ...value, missing: value.required.filter(name => !process.env[name]) },
      ])
    ),
  });
}
