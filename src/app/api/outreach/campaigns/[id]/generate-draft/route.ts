import { NextResponse } from "next/server";
import { generateOutreachSequence } from "@/lib/outreach-generator";
import { pool } from "@/lib/postgres";
import { addSequenceStep } from "@/lib/outreach/store";

function textList(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await pool.query(
      `SELECT c.business_id,c.objective,b.name,b.domain,b.business_type,b.city,b.country,
              ct.name AS contact_name,ct.role AS contact_role,
              f.slug,f.headline,f.subheadline,f.content_json,
              a.report AS audit_report
       FROM outreach_campaigns c
       JOIN businesses b ON b.id=c.business_id
       LEFT JOIN outreach_recipients r ON r.campaign_id=c.id
       LEFT JOIN contacts ct ON ct.id=r.contact_id
       LEFT JOIN LATERAL (SELECT * FROM funnels WHERE business_id=b.id ORDER BY id DESC LIMIT 1) f ON TRUE
       LEFT JOIN LATERAL (SELECT report FROM funnelspy_audits WHERE business_id=b.id AND report IS NOT NULL ORDER BY created_at DESC LIMIT 1) a ON TRUE
       WHERE c.id=$1
       ORDER BY r.created_at
       LIMIT 1`,
      [id],
    );
    const row = context.rows[0];
    if (!row) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
    const existingSteps = await pool.query("SELECT COUNT(*)::int AS total FROM outreach_sequence_steps WHERE campaign_id=$1", [id]);
    if (Number(existingSteps.rows[0].total) > 0) return NextResponse.json({ error: "Remove existing steps before generating the evidence-grounded sequence." }, { status: 409 });
    const audit = row.audit_report || {};
    const recommendations = Array.isArray(audit.recommendations) ? audit.recommendations : [];
    const evidence = [...textList(audit.weaknesses), ...textList(audit.limitations), ...textList(audit.strengths)];
    const selectedInsights = recommendations.flatMap((item: Record<string, unknown>, index: number) => {
      const observation = String(item.action || item.expectedImpact || "").trim();
      const evidenceLine = evidence[index];
      return observation && evidenceLine ? [{ title: String(item.title || `Opportunity ${index + 1}`), observation, evidence: evidenceLine }] : [];
    }).slice(0, 2);
    const localized = row.content_json?.translations?.en || row.content_json || {};
    const otom = localized.otom || {};
    const origin = new URL(request.url).origin;
    const previewUrl = row.slug ? `${origin}/en/funnel/${row.slug}` : undefined;
    const generated = await generateOutreachSequence(
      row.contact_name || "",
      row.name,
      otom.coreOffer?.name || localized.offer || row.headline || "Personalized proposal",
      evidence[0] || "",
      otom.upsell?.name || "Implementation plan",
      {
        website: row.domain,
        contactRole: row.contact_role,
        industry: row.business_type,
        location: [row.city, row.country].filter(Boolean).join(", "),
        audience: audit.targetAudience,
        objective: row.objective,
        selectedInsights,
        auditOpportunities: recommendations.map((item: Record<string, unknown>) => String(item.title || item.action || "")).filter(Boolean),
        auditEvidence: evidence,
        priorityIssues: [...textList(audit.weaknesses), ...textList(audit.limitations)],
        hook: otom.hook?.description || row.headline,
        coreOffer: otom.coreOffer?.description || localized.offer || row.headline,
        upsell: otom.upsell?.description,
        downsell: otom.downsell?.description,
        customerJourney: Array.isArray(otom.customerJourney) ? otom.customerJourney.map((step: Record<string, unknown>) => `${step.step || ""}. ${step.action || ""}`.trim()) : [],
        valueProposition: audit.valueProposition || row.subheadline,
        previewUrl,
        previewAvailable: Boolean(previewUrl),
        previewDescription: localized.subheadline || row.subheadline,
      },
    );
    const firstEmail = generated.firstEmail;
    const steps = [];
    for (const email of generated.emailSequence) {
      steps.push(await addSequenceStep(id, {
        position: email.index,
        delayValue: email.index === 1 ? 0 : Math.max(2, email.delay),
        delayUnit: "day",
        subjectTemplate: email.index === 1 ? firstEmail.selectedSubject : email.subject,
        bodyTemplate: email.index === 1 ? firstEmail.fullEmail : email.body,
        messageType: email.index === 1 ? "introduction" : email.index === 5 ? "final_follow_up" : "follow_up",
        requiresManualReview: true,
        enabled: true,
        selectedInsights: firstEmail.insights,
        subjectOptions: email.index === 1 ? firstEmail.subjectOptions : [email.subject],
        generationWarnings: firstEmail.warnings,
        confidence: firstEmail.confidence,
      }));
    }
    await pool.query("UPDATE outreach_campaigns SET video_pitch=$2,updated_at=NOW() WHERE id=$1", [id, JSON.stringify(generated.videoPitch)]);
    return NextResponse.json({ steps, firstEmail, videoPitch: generated.videoPitch, generatedBy: "verified-audit-context", requiresManualReview: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Draft generation failed." }, { status: 409 });
  }
}
