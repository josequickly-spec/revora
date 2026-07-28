import { NextResponse } from "next/server";
import { rotateProposalToken } from "@/lib/proposal-builder/store";
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try { const { id } = await params; const result = await rotateProposalToken(id); return NextResponse.json({ ...result, publicUrl: `/proposal/${result.token}` }); }
  catch { return NextResponse.json({ error: "Public token could not be rotated." }, { status: 409 }); }
}
