import { NextResponse } from "next/server";
import { mockData } from "@/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (businessId) {
      const data = mockData.proposals.filter(p => p.businessId === parseInt(businessId));
      return NextResponse.json({ success: true, proposals: data });
    }

    return NextResponse.json({ success: true, proposals: mockData.proposals });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
