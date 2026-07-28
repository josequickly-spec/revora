import { NextResponse } from "next/server";
import { z } from "zod";
import { listDueMonitors, markMonitorChecked, saveAudit, upsertMonitor } from "@/lib/funnelspy-store";
import { analyzeFunnel } from "@/lib/funnelspy";

const schema = z.object({
  domain: z.string().min(3),
  frequency: z.enum(["daily", "weekly", "monthly"]).default("weekly"),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const monitor = await upsertMonitor(input.domain, input.frequency);
    return NextResponse.json({ monitor, message: "Monitoreo activado." }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible activar el monitoreo." }, { status: 400 });
  }
}

export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const authorization = request.headers.get("authorization");
    if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
  }
  const monitors = await listDueMonitors();
  const completed: Array<{ domain: string; auditId: string; score: number }> = [];
  for (const monitor of monitors) {
    try {
      const analysis = await analyzeFunnel(monitor.domain);
      const audit = await saveAudit(analysis);
      await markMonitorChecked(monitor.id, audit.id);
      completed.push({ domain: monitor.domain, auditId: audit.id, score: analysis.score });
    } catch (error) {
      console.warn(`Monitor failed for ${monitor.domain}`, error);
    }
  }
  return NextResponse.json({ checked: monitors.length, completed });
}
