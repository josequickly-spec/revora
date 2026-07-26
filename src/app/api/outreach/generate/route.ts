import { NextResponse } from "next/server";
import { mockData } from "@/db";
import { generateOutreachSequence } from "@/lib/outreach-generator";

interface OutreachGenerateRequest {
  contactId?: number;
  contactName: string;
  businessName: string;
  offerHeadline: string;
  painPoint: string;
  bonusOffer: string;
  recipientEmail?: string;
}

export async function POST(req: Request) {
  try {
    const body: OutreachGenerateRequest = await req.json();
    const {
      contactName,
      businessName,
      offerHeadline,
      painPoint,
      bonusOffer,
      recipientEmail,
    } = body;

    if (!contactName || !businessName) {
      return NextResponse.json(
        { success: false, error: "contactName and businessName are required" },
        { status: 400 }
      );
    }

    console.log(`Generating outreach for: ${contactName}`);

    const generatedOutreach = await generateOutreachSequence(
      contactName,
      businessName,
      offerHeadline,
      painPoint,
      bonusOffer
    );

    const outreach = {
      id: Date.now(),
      contactName,
      businessName,
      recipientEmail: recipientEmail || `${contactName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      status: "draft",
      emailSequence: generatedOutreach.emailSequence,
      videoPitch: generatedOutreach.videoPitch,
      followUpTiming: generatedOutreach.followUpTiming,
      createdAt: new Date().toISOString(),
      sentAt: null,
      opens: 0,
      clicks: 0,
    };

    return NextResponse.json({
      success: true,
      outreach,
      message: `Secuencia de outreach generada para ${contactName}`,
    });
  } catch (error) {
    console.error("Outreach generation error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "Use POST to generate outreach sequences",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error" },
      { status: 500 }
    );
  }
}
