import { NextResponse } from "next/server";
import { listConsultantReports } from "@/lib/ai-consultant/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = Number(id);
  if (!Number.isInteger(businessId) || businessId <= 0) return NextResponse.json({ error: "Invalid businessId." }, { status: 400 });
  try {
    return NextResponse.json({ reports: await listConsultantReports({ businessId, limit: 100 }) });
  } catch {
    return NextResponse.json({ error: "Consultant reports are temporarily unavailable." }, { status: 503 });
  }
}
