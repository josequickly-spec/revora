import { NextRequest, NextResponse } from "next/server";
import { saveApprovedInsights } from "@/lib/outreach/save-insights";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { businessId, campaignId, insights, approvedBy } = body;

    if (!businessId || !insights || insights.length !== 2) {
      return NextResponse.json(
        { success: false, error: "businessId and exactly 2 insights are required" },
        { status: 400 }
      );
    }

    const result = await saveApprovedInsights({
      businessId,
      campaignId,
      insights,
      approvedBy,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
