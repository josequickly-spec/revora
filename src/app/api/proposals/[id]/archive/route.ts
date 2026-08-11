import { NextResponse } from "next/server";
import { transitionProposal } from "@/lib/proposal-builder/store";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const proposal = await transitionProposal(id, "archived"); return proposal ? NextResponse.json({ proposal }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 }); }
  catch { return NextResponse.json({ error: "Proposal could not be archived." }, { status: 409 }); }
}
