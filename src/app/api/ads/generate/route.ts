import { NextResponse } from "next/server";
import { generateAdCampaign, generateAIBotOptimizations } from "@/lib/ad-generator";

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

    const mockMetrics = {
      impressions: Math.floor(Math.random() * 50000) + 10000,
      clicks: Math.floor(Math.random() * 1500) + 300,
      conversions: Math.floor(Math.random() * 150) + 20,
      spend: budget / 30,
    };

    const optimizations = await generateAIBotOptimizations(
      campaign.id,
      mockMetrics
    );

    return NextResponse.json({
      success: true,
      campaign,
      metrics: mockMetrics,
      aiOptimizations: optimizations,
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
