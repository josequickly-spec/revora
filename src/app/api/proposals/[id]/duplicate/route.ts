import { NextResponse } from "next/server";
import { duplicateProposal } from "@/lib/proposal-builder/store";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const proposal = await duplicateProposal(id); return proposal ? NextResponse.json({ proposal }, { status: 201 }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 }); }
  catch { return NextResponse.json({ error: "Proposal could not be duplicated." }, { status: 409 }); }
}
