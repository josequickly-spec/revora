import { NextResponse } from "next/server";
import { getProposalDocument } from "@/lib/proposal-builder/store";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; version: string }> }) {
  const { id, version } = await params; const numeric = Number(version);
  if (!Number.isInteger(numeric) || numeric < 1) return NextResponse.json({ error: "Invalid version." }, { status: 400 });
  const proposal = await getProposalDocument(id, numeric);
  return proposal ? NextResponse.json({ proposal }) : NextResponse.json({ error: "Proposal version not found." }, { status: 404 });
}
