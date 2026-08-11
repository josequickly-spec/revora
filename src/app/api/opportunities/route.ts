import { NextRequest, NextResponse } from "next/server";
import { deriveOpportunities } from "@/lib/opportunity-engine/derive";
import { getAudit, listAudits, type StoredAudit } from "@/lib/funnelspy-store";

export async function GET(request: NextRequest) {
  const auditId = request.nextUrl.searchParams.get("auditId");
  const businessRaw = request.nextUrl.searchParams.get("businessId");
  const businessId = businessRaw ? Number(businessRaw) : undefined;
  if (businessRaw && (!Number.isInteger(businessId) || Number(businessId) <= 0)) {
    return NextResponse.json({ error: "Invalid businessId." }, { status: 400 });
  }
  if (auditId) {
    const audit = await getAudit(auditId);
    if (!audit) return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    if (businessId && audit.businessId !== businessId) return NextResponse.json({ error: "Audit is not associated with this business." }, { status: 409 });
    return NextResponse.json({ audit: summary(audit), ...deriveOpportunities(audit) });
  }
  const audits = await listAudits(undefined, 100, businessId);
  const results = audits.map(audit => ({ audit: summary(audit), ...deriveOpportunities(audit) }));
  return NextResponse.json({
    results,
    opportunities: results.flatMap(result => result.opportunities),
    warnings: [...new Set(results.flatMap(result => result.warnings))],
    derived: true,
  });
}

function summary(audit: StoredAudit) {
  return {
    id: audit.id, businessId: audit.businessId, domain: audit.domain,
    score: audit.analysis.score, createdAt: audit.createdAt, storageMode: audit.storageMode,
  };
}
