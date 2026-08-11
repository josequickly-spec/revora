import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

async function readiness(id: number) {
  const [businessResult, auditResult, funnelResult, strategyResult, contactResult] = await Promise.all([
    pool.query("SELECT id,domain,business_type,technology_data,outreach_approved_at,pipeline_stage FROM businesses WHERE id=$1", [id]),
    pool.query("SELECT id,analysis,report FROM funnelspy_audits WHERE business_id=$1 AND report IS NOT NULL ORDER BY created_at DESC LIMIT 1", [id]),
    pool.query("SELECT id,slug,content_json FROM funnels WHERE business_id=$1 ORDER BY created_at DESC LIMIT 1", [id]),
    pool.query("SELECT id,status,report FROM ai_consultant_reports WHERE business_id=$1 AND status='completed' ORDER BY created_at DESC LIMIT 1", [id]),
    pool.query("SELECT id,status,role,email FROM contacts WHERE business_id=$1 ORDER BY created_at DESC", [id]),
  ]);
  const business = businessResult.rows[0];
  if (!business) return null;
  const audit = auditResult.rows[0];
  const report = audit?.report || {};
  const evidenceCount = [
    ...(Array.isArray(report.weaknesses) ? report.weaknesses : []),
    ...(Array.isArray(report.limitations) ? report.limitations : []),
    ...(Array.isArray(report.strengths) ? report.strengths : []),
  ].filter(Boolean).length;
  const recommendationCount = Array.isArray(report.recommendations) ? report.recommendations.length : 0;
  const verifiedInsightCount = Math.min(recommendationCount, evidenceCount);
  const funnel = funnelResult.rows[0];
  const strategy = strategyResult.rows[0];
  const contacts = contactResult.rows;
  let score = 10;
  if (business.domain && business.business_type) score += 15;
  if (business.technology_data) score += 10;
  if (audit) score += Math.min(30, Math.round(Number(audit.analysis?.score || 0) * 0.3));
  if (verifiedInsightCount >= 2) score += 15;
  if (strategy?.report) score += 10;
  if (funnel?.slug) score += 10;
  if (contacts.some((contact) => contact.email && contact.role)) score += 10;
  score = Math.min(score, 100);
  const grade = score >= 75 ? "A" : score >= 55 ? "B" : score >= 35 ? "C" : "D";
  const checks = {
    businessIdentified: Boolean(business.domain && business.business_type),
    auditCompleted: Boolean(audit),
    twoVerifiedInsights: verifiedInsightCount >= 2,
    strategyCompleted: Boolean(strategy?.report),
    previewReady: Boolean(funnel?.slug),
  };
  return { business, score, grade, checks, ready: Object.values(checks).every(Boolean), verifiedInsightCount, contactReady: contacts.some((contact) => contact.email && contact.role) };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await readiness(Number(id));
  return result ? NextResponse.json(result) : NextResponse.json({ error: "Business not found." }, { status: 404 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const [{ id }, body] = await Promise.all([params, request.json()]);
  if (body.confirmation !== "APPROVE OUTREACH") return NextResponse.json({ error: "Explicit approval confirmation is required." }, { status: 400 });
  const result = await readiness(Number(id));
  if (!result) return NextResponse.json({ error: "Business not found." }, { status: 404 });
  if (!result.ready) return NextResponse.json({ error: "Complete the audit, two evidence-backed insights, strategy, and preview before approval.", checks: result.checks }, { status: 409 });
  await pool.query("UPDATE businesses SET opportunity_score=$2,opportunity_grade=$3,outreach_approved_at=NOW(),pipeline_stage='outreach_ready' WHERE id=$1", [Number(id), result.score, result.grade]);
  return NextResponse.json({ approved: true, score: result.score, grade: result.grade, checks: result.checks });
}
