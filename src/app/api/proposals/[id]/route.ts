import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { proposalUpdateSchema } from "@/lib/proposal-builder/contracts";
import { getProposalDocument, transitionProposal, updateProposalDocument } from "@/lib/proposal-builder/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proposal = await getProposalDocument(id);
    return proposal ? NextResponse.json({ proposal }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Proposal is temporarily unavailable." }, { status: 503 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [{ id }, input] = await Promise.all([params, request.json().then(value => proposalUpdateSchema.parse(value))]);
    const proposal = await updateProposalDocument(id, input);
    return proposal ? NextResponse.json({ proposal }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid proposal update.", details: error.issues }, { status: 400 });
    if (error instanceof Error && error.message === "optimistic_conflict") return NextResponse.json({ error: "Proposal was edited elsewhere. Reload before saving.", code: "optimistic_conflict" }, { status: 409 });
    return NextResponse.json({ error: "Proposal update failed." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const proposal = await transitionProposal(id, "archived");
    return proposal ? NextResponse.json({ proposal, archived: true }) : NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  } catch { return NextResponse.json({ error: "Proposal could not be archived." }, { status: 409 }); }
}
