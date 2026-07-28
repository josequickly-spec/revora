import { NextResponse } from "next/server";
import { getConsultantReport } from "@/lib/ai-consultant/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await getConsultantReport(id);
    return report
      ? NextResponse.json({ report })
      : NextResponse.json({ error: "Consultant report not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Consultant report is temporarily unavailable." }, { status: 503 });
  }
}
