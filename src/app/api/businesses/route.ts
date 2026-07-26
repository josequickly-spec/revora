import { NextResponse } from "next/server";
import { mockData } from "@/db";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      businesses: mockData.businesses,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, domain, businessType, niche, monthlyRevenue, heroOffer, heroPrice, country, contactName } = body;

    if (!name || !domain) {
      return NextResponse.json(
        { success: false, error: "name and domain are required" },
        { status: 400 }
      );
    }

    const newBiz = {
      id: Math.max(...mockData.businesses.map((b) => b.id || 0)) + 1,
      name,
      domain: domain.toLowerCase(),
      country: country || "España",
      businessType: businessType || "ecommerce",
      niche: niche || "general",
      monthlyRevenue: monthlyRevenue || 10000,
      platform: "shopify",
      logoUrl: null,
      brandColor: "#6366f1",
      brandAccent: "#818cf8",
      status: "created",
      heroOffer: heroOffer || "20% descuento",
      heroPrice: heroPrice || "$99",
      painPoint: "Marketing",
      createdAt: new Date().toISOString(),
    };

    mockData.businesses.push(newBiz);

    return NextResponse.json({
      success: true,
      business: newBiz,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
