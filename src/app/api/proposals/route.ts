import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { proposalCreateSchema } from "@/lib/proposal-builder/contracts";
import { buildProposalDraft } from "@/lib/proposal-builder/draft";
import { ProposalContextError } from "@/lib/proposal-builder/evidence";
import { createProposalDocument, listProposalDocuments } from "@/lib/proposal-builder/store";
import { pool } from "@/lib/postgres";

export async function GET(request: NextRequest) {
  try {
    const businessRaw = request.nextUrl.searchParams.get("businessId");
    const businessId = businessRaw ? Number(businessRaw) : undefined;
    if (businessRaw && (!Number.isInteger(businessId) || businessId! <= 0)) return NextResponse.json({ error: "Invalid businessId." }, { status: 400 });
    const limit = Number(request.nextUrl.searchParams.get("limit") || 50);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return NextResponse.json({ error: "Invalid limit." }, { status: 400 });
    const proposals = await listProposalDocuments({
      businessId, auditId: request.nextUrl.searchParams.get("auditId") || undefined,
      status: request.nextUrl.searchParams.get("status") || undefined,
      proposalType: request.nextUrl.searchParams.get("proposalType") || undefined, limit,
    });
    const legacyResult = await pool.query("SELECT * FROM proposals ORDER BY created_at DESC LIMIT 100");
    return NextResponse.json({ proposals, legacyProposals: legacyResult.rows, nextCursor: null });
  } catch {
    return NextResponse.json({ error: "Proposals are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const input = proposalCreateSchema.parse(await request.json());
    const draft = await buildProposalDraft(input);
    const proposal = await createProposalDocument(input, draft);
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: "Invalid proposal request.", details: error.issues }, { status: 400 });
    if (error instanceof ProposalContextError) return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    return NextResponse.json({ error: "Proposal draft could not be created." }, { status: 500 });
  }
}
