import { NextRequest, NextResponse } from "next/server";
import { getAudit, listAudits } from "@/lib/funnelspy-store";
import { deriveOpportunities } from "@/lib/opportunity-engine/derive";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const audit = await getAudit(id);
    return audit
      ? NextResponse.json({ audit, opportunityResult: deriveOpportunities(audit) })
      : NextResponse.json({ error: "Audit not found." }, { status: 404 });
  }
  const domain = request.nextUrl.searchParams.get("domain") || undefined;
  const businessRaw = request.nextUrl.searchParams.get("businessId");
  const businessId = businessRaw ? Number(businessRaw) : undefined;
  if (businessRaw && (!Number.isInteger(businessId) || Number(businessId) <= 0)) {
    return NextResponse.json({ error: "Invalid businessId." }, { status: 400 });
  }
  const audits = await listAudits(domain, 40, businessId);
  return NextResponse.json({
    audits: audits.map(item => ({
      id: item.id,
      domain: item.domain,
      score: item.analysis.score,
      scoreLabel: item.analysis.scoreLabel,
      totals: item.analysis.totals,
      createdAt: item.createdAt,
      shareToken: item.shareToken,
      hasReport: Boolean(item.report),
      businessId: item.businessId,
      businessName: item.businessName,
      storageMode: item.storageMode,
      status: "completed",
      opportunityCount: deriveOpportunities(item).opportunities.length,
    })),
    warnings: audits.some(item => item.storageMode === "memory")
      ? ["Some audit history is using non-durable in-memory storage."]
      : [],
  });
}
