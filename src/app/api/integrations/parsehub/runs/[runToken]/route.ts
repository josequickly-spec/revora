import { NextResponse } from "next/server";
import { getParseHubRun, getParseHubRunData, normalizeParseHubCandidates } from "@/lib/parsehub";

export async function GET(request: Request, { params }: { params: Promise<{ runToken: string }> }) {
  try {
    const { runToken } = await params;
    const run = await getParseHubRun(runToken);
    if (new URL(request.url).searchParams.get("data") !== "1" || !run.data_ready) {
      return NextResponse.json({ success: true, run, candidates: [] });
    }
    const data = await getParseHubRunData(runToken);
    const candidates = normalizeParseHubCandidates(data);
    return NextResponse.json({ success: true, run, candidates, candidateCount: candidates.length, truncated: candidates.length === 200 });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 503;
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "ParseHub run is unavailable." }, { status: status >= 400 && status < 600 ? status : 503 });
  }
}
