import { NextResponse } from "next/server";

export async function GET() {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  const status = {
    timestamp: new Date().toISOString(),
    turnstile: {
      status: siteKey && secretKey ? "✅ Configured" : "❌ Not configured",
      siteKeyPresent: Boolean(siteKey),
      secretKeyPresent: Boolean(secretKey),
      siteKey: siteKey || "missing",
      mode: "dark",
      apiEndpoint: "https://challenges.cloudflare.com/turnstile/v0",
      documentation: "https://developers.cloudflare.com/turnstile/",
    },
    environment: {
      isDevelopment: process.env.NODE_ENV === "development",
      skipValidation: process.env.TURNSTILE_SKIP_VALIDATION === "true",
    },
    recommendations: [
      !siteKey && "❌ NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing",
      !secretKey && "❌ TURNSTILE_SECRET_KEY is missing",
      siteKey && secretKey && "✅ Both keys are configured",
    ].filter(Boolean),
  };

  return NextResponse.json(status);
}
