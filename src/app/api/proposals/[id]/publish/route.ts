import { NextResponse } from "next/server";
import { publishProposal } from "@/lib/proposal-builder/store";
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, body] = await Promise.all([params, request.json().catch(() => ({}))]);
    const result = await publishProposal(id, typeof body.expiresAt === "string" ? body.expiresAt : null);
    return result ? NextResponse.json({ ...result, publicUrl: `/proposal/${result.token}` }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Proposal could not be published." }, { status: 409 }); }
}
