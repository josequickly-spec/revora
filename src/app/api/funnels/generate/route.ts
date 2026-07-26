import { NextResponse } from "next/server";
import { mockData } from "@/db";
import { generateFunnel } from "@/lib/funnel-generator";
import { getIndustry } from "@/lib/industries";

interface FunnelGenerateRequest {
  businessId: number;
  businessName: string;
  industryType: string;
  niche: string;
  painPoint: string;
}

export async function POST(req: Request) {
  try {
    const body: FunnelGenerateRequest = await req.json();
    const { businessId, businessName, industryType, niche, painPoint } = body;

    if (!businessName || !industryType) {
      return NextResponse.json(
        { success: false, error: "businessName and industryType are required" },
        { status: 400 }
      );
    }

    console.log(`Generating funnel for: ${businessName}`);

    const generatedFunnel = await generateFunnel(
      businessName,
      industryType,
      niche,
      painPoint
    );

    const ind = getIndustry(industryType);
    const slug =
      businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Date.now().toString().slice(-4);

    const newFunnel = {
      id: Math.max(...mockData.funnels.map((f) => f.id || 0)) + 1,
      businessId: businessId || null,
      funnelName: `Embudo para ${businessName}`,
      templateType: ind.funnelType,
      headline: generatedFunnel.headline,
      subheadline: generatedFunnel.subheadline,
      ctaText: generatedFunnel.ctaText,
      offerBadge: generatedFunnel.offerBadge,
      bonusOffer: generatedFunnel.bonusOffer,
      customPrimaryColor: generatedFunnel.colorScheme.primary,
      slug,
      viewCount: 0,
      createdAt: new Date().toISOString(),
    };

    mockData.funnels.push(newFunnel as any);

    return NextResponse.json({
      success: true,
      funnel: newFunnel,
      generatedContent: generatedFunnel,
      message: `Embudo generado automaticamente para "${businessName}"`,
    });
  } catch (error) {
    console.error("Funnel generation error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
