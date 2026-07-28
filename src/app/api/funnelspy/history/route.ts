import { NextRequest, NextResponse } from "next/server";
import { getAudit, listAudits } from "@/lib/funnelspy-store";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const audit = await getAudit(id);
    return audit ? NextResponse.json({ audit }) : NextResponse.json({ error: "Auditoría no encontrada." }, { status: 404 });
  }
  const domain = request.nextUrl.searchParams.get("domain") || undefined;
  const audits = await listAudits(domain, 40);
  return NextResponse.json({
    audits: audits.map((item) => ({
      id: item.id,
      domain: item.domain,
      score: item.analysis.score,
      scoreLabel: item.analysis.scoreLabel,
      totals: item.analysis.totals,
      createdAt: item.createdAt,
      shareToken: item.shareToken,
      hasReport: Boolean(item.report),
    })),
  });
}
