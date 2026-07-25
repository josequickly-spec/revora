import { NextResponse } from "next/server";
import { mockData } from "@/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (businessId) {
      const data = mockData.outreachCampaigns.filter(c => c.businessId === parseInt(businessId));
      return NextResponse.json({ success: true, outreach: data });
    }

    return NextResponse.json({ success: true, outreach: mockData.outreachCampaigns });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const campaign = {
      id: Math.max(...mockData.outreachCampaigns.map(c => c.id || 0)) + 1,
      businessId: parseInt(body.businessId),
      contactId: body.contactId ? parseInt(body.contactId) : null,
      funnelId: body.funnelId ? parseInt(body.funnelId) : null,
      emailSubject: body.emailSubject || "Embudo creado para tu negocio (gratis)",
      emailBody: body.emailBody || "Hola...",
      loomScript: body.loomScript || null,
      status: "sent",
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    mockData.outreachCampaigns.push(campaign);

    const biz = mockData.businesses.find(b => b.id === parseInt(body.businessId));
    if (biz) biz.status = "pitch_sent";

    return NextResponse.json({ success: true, campaign });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
