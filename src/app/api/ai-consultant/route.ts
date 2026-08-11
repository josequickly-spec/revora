import { NextRequest, NextResponse } from "next/server";
import { listConsultantReports } from "@/lib/ai-consultant/store";
import type { AIConsultantStatus } from "@/lib/ai-consultant/contracts";

const statuses = new Set(["pending", "generating", "completed", "failed", "superseded"]);

export async function GET(request: NextRequest) {
  try {
    const businessRaw = request.nextUrl.searchParams.get("businessId");
    const businessId = businessRaw ? Number(businessRaw) : undefined;
    if (businessRaw && (!Number.isInteger(businessId) || Number(businessId) <= 0)) {
      return NextResponse.json({ error: "Invalid businessId." }, { status: 400 });
    }
    const statusRaw = request.nextUrl.searchParams.get("status") || undefined;
    if (statusRaw && !statuses.has(statusRaw)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number(limitRaw) : 30;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return NextResponse.json({ error: "Invalid limit." }, { status: 400 });
    const reports = await listConsultantReports({
      businessId, auditId: request.nextUrl.searchParams.get("auditId") || undefined,
      status: statusRaw as AIConsultantStatus | undefined, limit,
    });
    return NextResponse.json({ reports, nextCursor: null });
  } catch {
    return NextResponse.json({ error: "Consultant reports are temporarily unavailable." }, { status: 503 });
  }
}
