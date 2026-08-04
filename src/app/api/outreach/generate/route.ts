import { NextResponse } from "next/server";
import { generateOutreachSequence } from "@/lib/outreach-generator";
import { pool } from "@/lib/postgres";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const businessId = Number(body.businessId || 0);
    const contactId = Number(body.contactId || 0);
    const [businessResult, contactResult, funnelResult, auditResult] = await Promise.all([
      businessId
        ? pool.query(`SELECT * FROM businesses WHERE id=$1 LIMIT 1`, [businessId])
        : Promise.resolve({ rows: [] }),
      contactId
        ? pool.query(`SELECT * FROM contacts WHERE id=$1 AND ($2::bigint=0 OR business_id=$2) LIMIT 1`, [contactId, businessId])
        : businessId
          ? pool.query(`SELECT * FROM contacts WHERE business_id=$1 AND email<>'' ORDER BY id DESC LIMIT 1`, [businessId])
          : Promise.resolve({ rows: [] }),
      businessId
        ? pool.query(`SELECT * FROM funnels WHERE business_id=$1 ORDER BY id DESC LIMIT 1`, [businessId])
        : Promise.resolve({ rows: [] }),
      businessId
        ? pool.query(`SELECT report FROM funnelspy_audits WHERE business_id=$1 AND report IS NOT NULL ORDER BY created_at DESC LIMIT 1`, [businessId])
        : Promise.resolve({ rows: [] }),
    ]);
    const business = businessResult.rows[0] || {};
    const contact = contactResult.rows[0] || {};
    const funnel = funnelResult.rows[0] || {};
    const auditReport = auditResult.rows[0]?.report || {};
    const localized = funnel.content_json?.translations?.es || funnel.content_json || {};
    const otom = localized.otom || {};
    const contactName = body.contactName || contact.name;
    const businessName = body.businessName || business.name;
    const recipientEmail = body.recipientEmail || contact.email;
    if (!contactName || !businessName || !recipientEmail) {
      return NextResponse.json(
        { success: false, error: "Añade un decisor con un email real antes de generar la secuencia." },
        { status: 400 }
      );
    }

    const origin = new URL(req.url).origin;
    const previewUrl = body.previewUrl || (funnel.slug ? `${origin}/es/funnel/${funnel.slug}` : undefined);
    const problems = Array.isArray(body.problems) && body.problems.length
      ? body.problems
      : [...(auditReport.weaknesses || []), ...(auditReport.limitations || [])].slice(0, 3);
    const offerHeadline = body.offerHeadline || otom.coreOffer?.name || localized.offer || business.hero_offer || "Propuesta comercial personalizada";
    const opportunity = body.opportunity || otom.coreOffer?.description || funnel.subheadline || auditReport.primaryObjective;

    const generated = await generateOutreachSequence(
      contactName,
      businessName,
      offerHeadline,
      body.painPoint || problems[0] || business.pain_point || "Mejorar la continuidad del recorrido comercial",
      body.bonusOffer || funnel.bonus_offer || "Plan de implementación",
      {
        website: body.website || business.domain,
        contactRole: body.contactRole || contact.role,
        industry: body.industry || business.business_type,
        location: body.location || business.city || business.country,
        audience: body.audience || auditReport.targetAudience || business.niche,
        problems,
        opportunity,
        previewUrl,
        objective: body.objective,
        senderName: body.senderName,
        senderCompany: body.senderCompany,
      },
    );
    const firstEmail = generated.emailSequence[0];
    const result = await pool.query(
      `INSERT INTO outreach_messages
       (business_id,contact_id,campaign_id,recipient_email,email_subject,email_body,email_sequence,video_script,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'draft') RETURNING *`,
      [body.businessId || null, body.contactId || null, body.campaignId || null,
       recipientEmail, firstEmail.subject, firstEmail.body,
       JSON.stringify(generated.emailSequence), JSON.stringify(generated.videoPitch)]
    );

    return NextResponse.json({
      success: true,
      outreach: result.rows[0],
      emailSequence: generated.emailSequence,
      videoPitch: generated.videoPitch,
      personalizationUsed: generated.personalizationUsed,
      claimsToVerify: generated.claimsToVerify,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Outreach generation failed" },
      { status: 500 }
    );
  }
}
