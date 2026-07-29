import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";
import { verifySvixSignature } from "@/lib/webhook-security";
import { addSuppression, ensureOutreachSchema } from "./store";
import { classifyProviderEvent } from "./webhook";

type ResendWebhook = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
    headers?: Record<string,string>;
  };
};

const metricColumns:Record<string,string> = {
  sent:"emails_sent",
  opened:"email_opens",
  clicked:"email_clicks",
  bounced:"email_bounces",
};

async function updateLegacyMetrics(campaignId:string,eventType:string) {
  const column=metricColumns[eventType];
  if(!column) return;
  const exists=await pool.query("SELECT to_regclass('public.campaign_metrics') AS metrics");
  if(!exists.rows[0]?.metrics) return;
  await pool.query(`UPDATE campaign_metrics SET ${column}=COALESCE(${column},0)+1
    WHERE campaign_id=$1 AND DATE(timestamp)=CURRENT_DATE`,[campaignId]);
}

export async function handleResendWebhook(request:Request) {
  const raw=await request.text();
  const secret=process.env.RESEND_WEBHOOK_SECRET;
  const eventId=request.headers.get("svix-id")||"";
  const timestamp=request.headers.get("svix-timestamp")||"";
  const signature=request.headers.get("svix-signature")||"";
  if(!secret||!verifySvixSignature(raw,eventId,timestamp,signature,secret)) {
    return NextResponse.json({error:"Invalid webhook signature."},{status:401});
  }
  try {
    await ensureOutreachSchema();
    const event=JSON.parse(raw) as ResendWebhook;
    const eventType=classifyProviderEvent(String(event.type||""));
    const providerMessageId=String(event.data?.email_id||"");
    if(!eventId||!providerMessageId||eventType==="unknown") {
      return NextResponse.json({error:"Unsupported webhook event."},{status:400});
    }
    const message=await pool.query(`SELECT om.id,om.campaign_id,om.recipient_id,r.normalized_email
      FROM outbound_messages om JOIN outreach_recipients r ON r.id=om.recipient_id
      WHERE om.provider_message_id=$1`,[providerMessageId]);
    const linked=message.rows[0]||null;
    const inserted=await pool.query(`INSERT INTO outreach_webhook_events(
      id,provider,provider_event_id,provider_message_id,message_id,event_type,provider_occurred_at,processing_status,safe_payload
    ) VALUES($1,'resend',$2,$3,$4,$5,$6,'processing',$7)
      ON CONFLICT(provider,provider_event_id) DO NOTHING RETURNING id`,
      [randomUUID(),eventId,providerMessageId,linked?.id||null,eventType,event.created_at||null,JSON.stringify({type:eventType,messageId:providerMessageId})]);
    if(!inserted.rows[0]) return NextResponse.json({received:true,duplicate:true});
    if(!linked) {
      await pool.query("UPDATE outreach_webhook_events SET processing_status='ignored',processed_at=NOW(),safe_error_code='message_not_found' WHERE id=$1",[inserted.rows[0].id]);
      return NextResponse.json({received:true,linked:false});
    }
    if(eventType==="sent") {
      await pool.query("UPDATE outbound_messages SET status='sent',sent_at=COALESCE(sent_at,NOW()),updated_at=NOW() WHERE id=$1 AND status IN ('queued','sending','unknown')",[linked.id]);
    } else if(eventType==="delivered") {
      await pool.query("UPDATE outbound_messages SET status='delivered',sent_at=COALESCE(sent_at,NOW()),delivered_at=NOW(),updated_at=NOW() WHERE id=$1",[linked.id]);
    } else if(eventType==="bounced") {
      await pool.query("UPDATE outbound_messages SET status='bounced',bounced_at=NOW(),updated_at=NOW() WHERE id=$1",[linked.id]);
      await pool.query("UPDATE outreach_recipients SET bounce_status='hard',sequence_state='bounced',updated_at=NOW() WHERE id=$1",[linked.recipient_id]);
      await addSuppression(linked.normalized_email,"hard_bounce","global",undefined,"webhook:resend","Provider reported a permanent bounce");
    } else if(eventType==="complaint") {
      await pool.query("UPDATE outreach_recipients SET sequence_state='complaint',updated_at=NOW() WHERE id=$1",[linked.recipient_id]);
      await addSuppression(linked.normalized_email,"complaint","global",undefined,"webhook:resend","Recipient reported spam");
    } else if(eventType==="failed") {
      await pool.query("UPDATE outbound_messages SET status='failed',failed_at=NOW(),safe_error_code='provider_failed',updated_at=NOW() WHERE id=$1",[linked.id]);
    } else if(eventType==="suppressed") {
      await pool.query("UPDATE outbound_messages SET status='suppressed',cancelled_at=NOW(),safe_error_code='provider_suppressed',updated_at=NOW() WHERE id=$1",[linked.id]);
      await addSuppression(linked.normalized_email,"provider_block","global",undefined,"webhook:resend","Provider suppression");
    }
    await pool.query("INSERT INTO outreach_events(id,campaign_id,recipient_id,message_id,event_type,metadata) VALUES($1,$2,$3,$4,$5,$6)",
      [randomUUID(),linked.campaign_id,linked.recipient_id,linked.id,eventType,JSON.stringify({provider:"resend"})]);
    await updateLegacyMetrics(String(linked.campaign_id),eventType);
    await pool.query("UPDATE outreach_webhook_events SET processing_status='processed',processed_at=NOW() WHERE id=$1",[inserted.rows[0].id]);
    return NextResponse.json({received:true,linked:true});
  } catch {
    return NextResponse.json({error:"Webhook processing failed safely."},{status:400});
  }
}
