import { NextResponse } from "next/server";
import { processOutreachBatch } from "@/lib/outreach/store";

export async function POST(request: Request) {
  const secret = process.env.OUTREACH_WORKER_SECRET || process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({})) as { limit?: number };
    return NextResponse.json(await processOutreachBatch(Number(body.limit || 10)));
  } catch {
    return NextResponse.json({ error: "Worker failed safely." }, { status: 500 });
  }
}
