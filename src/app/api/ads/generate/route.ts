import { NextResponse } from "next/server";
import { generateAdCampaign } from "@/lib/ad-generator";

interface AdGenerateRequest {
  businessName: string;
  offer: string;
  painPoint: string;
  budget: number;
  platform: "facebook" | "google" | "instagram";
}

export async function POST(req: Request) {
  try {
    const body: AdGenerateRequest = await req.json();
    const { businessName, offer, painPoint, budget, platform } = body;

    if (!businessName || !budget) {
      return NextResponse.json(
        { success: false, error: "businessName and budget are required" },
        { status: 400 }
      );
    }

    console.log(`Generating ad campaign for: ${businessName} on ${platform}`);

    const campaign = await generateAdCampaign(
      businessName,
      offer,
      painPoint,
      budget,
      platform
    );

    const readiness = platform === "google"
      ? {
          ready: Boolean(process.env.GOOGLE_ADS_CUSTOMER_ID && process.env.GOOGLE_ADS_ACCESS_TOKEN && process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
          missing: ["GOOGLE_ADS_CUSTOMER_ID", "GOOGLE_ADS_ACCESS_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN"].filter(key => !process.env[key]),
        }
      : {
          ready: Boolean(process.env.META_AD_ACCOUNT_ID && process.env.META_ACCESS_TOKEN),
          missing: ["META_AD_ACCOUNT_ID", "META_ACCESS_TOKEN"].filter(key => !process.env[key]),
        };

    return NextResponse.json({
      success: true,
      campaign,
      metrics: null,
      providerReadiness: readiness,
      publicationStatus: readiness.ready ? "ready_for_review" : "credentials_required",
      message: `Campana publicitaria generada para ${businessName}`,
    });
  } catch (error) {
    console.error("Ad campaign error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error" },
      { status: 500 }
    );
  }
}
