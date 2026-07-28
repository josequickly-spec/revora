import { NextResponse } from "next/server";
import { analyzeFunnel } from "@/lib/funnelspy";
import { findLatestAudit, saveAudit, storageWarning } from "@/lib/funnelspy-store";
import { checkRateLimit } from "@/lib/funnelspy-rate-limit";
import { funnelAuditRequestSchema } from "@/lib/funnel-audit/contracts";
import { isReusableAudit, normalizeAuditDomain } from "@/lib/funnel-audit/reuse";
import { pool } from "@/lib/postgres";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const client = request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    const limit = checkRateLimit(`audit:${client}`);
    if (!limit.allowed) return NextResponse.json({ error: "Límite temporal alcanzado. Intenta más tarde." }, { status: 429 });
    const input = funnelAuditRequestSchema.parse(await request.json());
    const domain = normalizeAuditDomain(input.url);
    if (input.businessId) {
      const business = await pool.query("SELECT id::int AS id, domain FROM businesses WHERE id=$1", [input.businessId]);
      if (!business.rows[0]) return NextResponse.json({ error: "Business not found." }, { status: 404 });
      if (normalizeAuditDomain(business.rows[0].domain) !== domain) {
        return NextResponse.json({ error: "The requested URL does not match the selected business." }, { status: 409 });
      }
    }
    if (!input.forceRefresh) {
      const existing = await findLatestAudit(domain, input.businessId);
      if (existing && isReusableAudit(existing)) {
        return NextResponse.json({
          analysis: existing.analysis,
          audit: { id: existing.id, shareToken: existing.shareToken, createdAt: existing.createdAt, businessId: existing.businessId, storageMode: existing.storageMode },
          reused: true,
          warnings: [storageWarning(existing)].filter(Boolean),
          freshnessPolicyDays: 7,
        });
      }
    }
    const analysis = await analyzeFunnel(input.url);
    const audit = await saveAudit(analysis, null, { businessId: input.businessId });
    return NextResponse.json({
      analysis,
      audit: { id: audit.id, shareToken: audit.shareToken, createdAt: audit.createdAt, businessId: audit.businessId, storageMode: audit.storageMode },
      reused: false,
      warnings: [storageWarning(audit)].filter(Boolean),
      freshnessPolicyDays: 7,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No fue posible analizar el dominio.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
