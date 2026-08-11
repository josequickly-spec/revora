import { NextResponse } from "next/server";
import { listProposalVersions } from "@/lib/proposal-builder/store";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; return NextResponse.json({ versions: await listProposalVersions(id) }); }
