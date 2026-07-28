import { NextResponse } from "next/server";
import { publicProposalPayload } from "@/lib/proposal-builder/export";
import { getPublicProposal } from "@/lib/proposal-builder/store";
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const proposal = token.length >= 40 ? await getPublicProposal(token) : null;
    return proposal
      ? NextResponse.json({ proposal: publicProposalPayload(proposal) }, { headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } })
      : NextResponse.json({ error: "Proposal is unavailable." }, { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "Proposal is unavailable." }, { status: 404 }); }
}
