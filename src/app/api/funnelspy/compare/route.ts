import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeFunnel, type FunnelSpyAnalysis } from "@/lib/funnelspy";
import { saveAudit } from "@/lib/funnelspy-store";

const schema = z.object({ urls: z.array(z.string().min(3)).min(2).max(5) });

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    const { urls } = schema.parse(await request.json());
    const analyses: Array<FunnelSpyAnalysis & { auditId: string }> = [];
    for (const url of urls) {
      const analysis = await analyzeFunnel(url);
      const audit = await saveAudit(analysis);
      analyses.push({ ...analysis, auditId: audit.id });
    }
    const best = [...analyses].sort((a, b) => b.score - a.score)[0];
    const dimensions = ["score", "pages", "ctas", "forms", "pixels", "performance"] as const;
    return NextResponse.json({
      analyses,
      winner: best.domain,
      dimensions: dimensions.map((dimension) => ({
        dimension,
        leader: [...analyses].sort((a, b) => {
          const value = (item: typeof analyses[number]) =>
            dimension === "score" ? item.score :
            dimension === "performance" ? item.performance.performance || 0 :
            item.totals[dimension];
          return value(b) - value(a);
        })[0].domain,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No fue posible comparar." }, { status: 400 });
  }
}
