import { NextResponse } from "next/server";
import { mockData } from "@/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const funnel = mockData.funnels.find(f => f.slug === slug);
      if (funnel && funnel.businessId) {
        const biz = mockData.businesses.find(b => b.id === funnel.businessId);
        return NextResponse.json({ success: true, funnel, business: biz });
      }
      return NextResponse.json({ success: false, error: "Funnel not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, funnels: mockData.funnels });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
