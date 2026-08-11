import { NextResponse } from "next/server";
import { exportProposalHtml, exportProposalJson } from "@/lib/proposal-builder/export";
import { getProposalDocument } from "@/lib/proposal-builder/store";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const [{ id }, body] = await Promise.all([params, request.json().catch(() => ({}))]);
  const proposal = await getProposalDocument(id, undefined);
  if (!proposal) return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  if (body.format === "html") return new NextResponse(exportProposalHtml(proposal), { headers: { "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="proposal-${proposal.id}.html"` } });
  return new NextResponse(exportProposalJson(proposal), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="proposal-${proposal.id}.json"` } });
}
