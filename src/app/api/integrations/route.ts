import { NextResponse } from "next/server";

export async function GET() {
  const integrations = {
    database: { ready: Boolean(process.env.DATABASE_URL), required: ["DATABASE_URL"] },
    openai: { ready: Boolean(process.env.OPENAI_API_KEY), required: ["OPENAI_API_KEY"] },
    hunter: { ready: Boolean(process.env.HUNTER_API_KEY), required: ["HUNTER_API_KEY"] },
    resend: {
      ready: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      required: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
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
    integrations: Object.fromEntries(
      Object.entries(integrations).map(([key, value]) => [
        key,
        { ...value, missing: value.required.filter(name => !process.env[name]) },
      ])
    ),
  });
}
