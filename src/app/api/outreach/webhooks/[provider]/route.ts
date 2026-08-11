import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { addSuppression, ensureOutreachSchema } from "@/lib/outreach/store";
import { handleResendWebhook } from "@/lib/outreach/resend-webhook-handler";
import { classifyProviderEvent, verifyWebhookSignature } from "@/lib/outreach/webhook";

export async function POST(request:Request,{params}:{params:Promise<{provider:string}>}) {
  const {provider}=await params;
  if(provider==="resend") return handleResendWebhook(request);
  const secret=process.env.OUTREACH_WEBHOOK_SECRET;
  const raw=await request.text();
  if(!secret||!verifyWebhookSignature(raw,request.headers.get("x-outreach-signature")||"",request.headers.get("x-outreach-timestamp")||"",secret)) {
    return NextResponse.json({error:"Invalid webhook."},{status:401});
  }
  try {
    await ensureOutreachSchema();
    const event=JSON.parse(raw);
    const type=classifyProviderEvent(String(event.type));
    const inserted=await pool.query(`INSERT INTO outreach_webhook_events(id,provider,provider_event_id,event_type,safe_payload)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT(provider,provider_event_id) DO NOTHING RETURNING id`,
      [randomUUID(),provider,String(event.id),type,JSON.stringify({messageId:event.messageId||null,type})]);
    if(!inserted.rows[0]) return NextResponse.json({received:true,duplicate:true});
    if(["bounced","complaint"].includes(type)&&event.email) {
      await addSuppression(String(event.email),type==="complaint"?"complaint":"hard_bounce","global",undefined,`webhook:${provider}`,type);
    }
    return NextResponse.json({received:true});
  } catch {
    return NextResponse.json({error:"Webhook rejected."},{status:400});
  }
}
