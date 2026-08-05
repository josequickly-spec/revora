import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { structuredLog } from "@/lib/observability/logger";

function validSecret(request: Request) {
  const expected = process.env.PARSEHUB_WEBHOOK_SECRET || "";
  const received = request.headers.get("x-parsehub-webhook-secret") || new URL(request.url).searchParams.get("secret") || "";
  if (!expected || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(request: Request) {
  if (!validSecret(request)) return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  try {
    const raw = await request.text();
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(raw);
    } catch {
      const form = new URLSearchParams(raw);
      const candidate = form.get("payload") || form.keys().next().value || "{}";
      event = JSON.parse(candidate);
    }
    structuredLog("info", "ParseHub run webhook received.", {
      projectToken: event.project_token,
      runToken: event.run_token,
      status: event.status,
      dataReady: event.data_ready,
      pages: event.pages,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid ParseHub webhook payload." }, { status: 400 });
  }
}
