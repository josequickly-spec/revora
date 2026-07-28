import { createHash, randomUUID } from "node:crypto";
import { pool } from "@/lib/postgres";
import type { CampaignCreate, CampaignStatus, CampaignUpdate, SequenceStepInput } from "./contracts";
import { assertCampaignTransition } from "./lifecycle";
import { createUnsubscribeToken, hashUnsubscribeToken } from "./public-token";
import { isEmailSyntaxValid, normalizeEmail } from "./recipient";
import { OUTREACH_COMPLIANCE_VERSION, OUTREACH_SEQUENCE_VERSION } from "./versions";
import { validateCompliance } from "./compliance";
import { messageIdempotencyKey } from "./idempotency";
import { nextAllowedTime } from "./scheduling";
import { renderTemplate } from "./template";
import { getOutreachProvider } from "./provider";

let ready=false;
export async function ensureOutreachSchema() {
  if (ready) return;
  const result=await pool.query("SELECT to_regclass('public.outreach_campaigns') AS campaigns, to_regclass('public.outbound_messages') AS messages");
  if(!result.rows[0]?.campaigns||!result.rows[0]?.messages) throw new Error("outreach_schema_not_initialized");
  ready=true;
}
async function addEvent(campaignId:string|null,eventType:string,metadata:Record<string,unknown>={},recipientId:string|null=null,messageId:string|null=null) {
  await pool.query("INSERT INTO outreach_events(id,campaign_id,recipient_id,message_id,event_type,metadata) VALUES($1,$2,$3,$4,$5,$6)",[randomUUID(),campaignId,recipientId,messageId,eventType,JSON.stringify(metadata)]);
}
function campaign(row:Record<string,unknown>) {
  return { id:String(row.id),name:String(row.name),status:String(row.status),businessId:Number(row.business_id),proposalId:row.proposal_id?String(row.proposal_id):null,auditId:row.audit_id?String(row.audit_id):null,consultantReportId:row.consultant_report_id?String(row.consultant_report_id):null,objective:String(row.objective),senderIdentityId:String(row.sender_identity_id),providerConnectionId:String(row.provider_connection_id),timezone:String(row.timezone),sendingWindow:row.sending_window,dailyLimit:Number(row.daily_limit),hourlyLimit:Number(row.hourly_limit),version:Number(row.version),contentVersion:Number(row.content_version),warnings:row.warnings||[],approvedAt:row.approved_at,scheduledAt:row.scheduled_at,createdAt:row.created_at,updatedAt:row.updated_at };
}
export async function createCampaign(input:CampaignCreate) {
  await ensureOutreachSchema();
  const business=await pool.query("SELECT id FROM businesses WHERE id=$1",[input.businessId]);
  if (!business.rows[0]) throw new Error("business_not_found");
  if (input.proposalId) {
    const proposal=await pool.query("SELECT id,business_id,status,published_version,public_token_hash,public_expires_at FROM proposal_documents WHERE id=$1",[input.proposalId]);
    const p=proposal.rows[0];
    if (!p || Number(p.business_id)!==input.businessId) throw new Error("proposal_association_mismatch");
    if (!["published","viewed"].includes(p.status) || !p.published_version || !p.public_token_hash || (p.public_expires_at && new Date(p.public_expires_at)<=new Date())) throw new Error("published_proposal_required");
  }
  const id=randomUUID();
  const result=await pool.query(`INSERT INTO outreach_campaigns(id,name,status,business_id,proposal_id,audit_id,consultant_report_id,objective,sender_identity_id,provider_connection_id,timezone,sending_window,daily_limit,hourly_limit,sequence_version,compliance_version)
    VALUES($1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [id,input.name,input.businessId,input.proposalId||null,input.auditId||null,input.consultantReportId||null,input.objective,input.senderIdentityId,input.providerConnectionId,input.timezone,JSON.stringify(input.sendingWindow),input.dailyLimit,input.hourlyLimit,OUTREACH_SEQUENCE_VERSION,OUTREACH_COMPLIANCE_VERSION]);
  await addEvent(id,"created",{explicit:true,providerMode:"dry-run"});
  return campaign(result.rows[0]);
}
export async function listCampaigns(filters:{businessId?:number;status?:string;limit?:number}={}) {
  await ensureOutreachSchema(); const values:unknown[]=[]; const where:string[]=[];
  if(filters.businessId){values.push(filters.businessId);where.push(`business_id=$${values.length}`)}
  if(filters.status){values.push(filters.status);where.push(`status=$${values.length}`)}
  values.push(Math.min(filters.limit||50,100));
  const result=await pool.query(`SELECT * FROM outreach_campaigns ${where.length?`WHERE ${where.join(" AND ")}`:""} ORDER BY updated_at DESC LIMIT $${values.length}`,values);
  return result.rows.map(campaign);
}
export async function getCampaign(id:string) {
  await ensureOutreachSchema();
  const [c,r,s,m,e]=await Promise.all([
    pool.query("SELECT * FROM outreach_campaigns WHERE id=$1",[id]),
    pool.query("SELECT id,contact_id,verification_status,provenance,risky_approved,sequence_state,current_step,last_sent_at,next_scheduled_at,bounce_status,unsubscribe_status,reply_status,created_at FROM outreach_recipients WHERE campaign_id=$1 ORDER BY created_at",[id]),
    pool.query("SELECT * FROM outreach_sequence_steps WHERE campaign_id=$1 ORDER BY position",[id]),
    pool.query("SELECT id,recipient_id,sequence_step_id,status,scheduled_at,sent_at,delivered_at,safe_error_code,created_at FROM outbound_messages WHERE campaign_id=$1 ORDER BY created_at DESC LIMIT 100",[id]),
    pool.query("SELECT event_type,metadata,created_at FROM outreach_events WHERE campaign_id=$1 ORDER BY created_at DESC LIMIT 100",[id]),
  ]);
  return c.rows[0]?{...campaign(c.rows[0]),recipients:r.rows,steps:s.rows,messages:m.rows,events:e.rows}:null;
}
export async function updateCampaign(id:string,input:CampaignUpdate) {
  const result=await pool.query(`UPDATE outreach_campaigns SET name=$3,objective=$4,timezone=$5,sending_window=$6,daily_limit=$7,hourly_limit=$8,version=version+1,status='draft',updated_at=NOW() WHERE id=$1 AND version=$2 AND status IN ('draft','review_required') RETURNING *`,
    [id,input.expectedVersion,input.name,input.objective,input.timezone,JSON.stringify(input.sendingWindow),input.dailyLimit,input.hourlyLimit]);
  if(!result.rows[0]) throw new Error("optimistic_conflict");
  await addEvent(id,"edited",{version:Number(result.rows[0].version)});
  return campaign(result.rows[0]);
}
export async function addRecipient(campaignId:string,input:{contactId:number;provenance:string;verificationStatus:string;verificationSource:string;verificationDate:string|null;riskyApproved:boolean}) {
  const context=await pool.query(`SELECT oc.business_id,oc.status,c.email,c.status AS contact_status,c.business_id AS contact_business FROM outreach_campaigns oc JOIN contacts c ON c.id=$2 WHERE oc.id=$1`,[campaignId,input.contactId]);
  const row=context.rows[0]; if(!row) throw new Error("campaign_or_contact_not_found");
  if(row.status!=="draft") throw new Error("campaign_not_editable");
  if(Number(row.contact_business)!==Number(row.business_id)) throw new Error("contact_association_mismatch");
  const email=normalizeEmail(row.email); if(!isEmailSyntaxValid(email)||input.verificationStatus==="invalid") throw new Error("invalid_contact");
  const suppressed=await checkSuppression(email,campaignId); if(suppressed) throw new Error(`suppressed:${suppressed}`);
  const verificationStatus=row.contact_status==="verified"?"provider_verified":"syntax_valid";
  const verificationSource=`existing_repository_contact:${row.contact_status||"unknown"}`;
  const token=createUnsubscribeToken(); const id=randomUUID();
  await pool.query(`INSERT INTO outreach_recipients(id,campaign_id,business_id,contact_id,email,normalized_email,verification_status,verification_source,verification_date,provenance,risky_approved,unsubscribe_token_hash,unsubscribe_token_prefix)
    VALUES($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12)`,[id,campaignId,row.business_id,input.contactId,email,verificationStatus,verificationSource,input.verificationDate,input.provenance,input.riskyApproved,token.hash,token.prefix]);
  await addEvent(campaignId,"recipient_added",{verificationStatus,provenance:input.provenance},id);
  return {id,unsubscribeToken:token.token};
}
export async function addSequenceStep(campaignId:string,input:SequenceStepInput) {
  const current=await pool.query("SELECT status FROM outreach_campaigns WHERE id=$1",[campaignId]); if(current.rows[0]?.status!=="draft") throw new Error("campaign_not_editable");
  const count=await pool.query("SELECT COUNT(*)::int total FROM outreach_sequence_steps WHERE campaign_id=$1",[campaignId]); if(count.rows[0].total>=5) throw new Error("maximum_five_steps");
  const id=randomUUID(); await pool.query(`INSERT INTO outreach_sequence_steps(id,campaign_id,position,delay_value,delay_unit,subject_template,body_template,message_type,requires_manual_review,enabled)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[id,campaignId,input.position,input.delayValue,input.delayUnit,input.subjectTemplate,input.bodyTemplate,input.messageType,input.requiresManualReview,input.enabled]);
  await addEvent(campaignId,"sequence_step_added",{position:input.position}); return {id,...input};
}
export async function checkSuppression(email:string,campaignId?:string) {
  const hash=createHash("sha256").update(normalizeEmail(email)).digest("hex");
  const result=await pool.query(`SELECT suppression_type FROM outreach_suppressions WHERE normalized_email_hash=$1 AND (scope='global' OR (scope='campaign' AND campaign_id=$2)) ORDER BY created_at DESC LIMIT 1`,[hash,campaignId||null]);
  return result.rows[0]?.suppression_type||null;
}
export async function addSuppression(email:string,type:string,scope="global",campaignId?:string,source="manual",reason="Manually suppressed") {
  await ensureOutreachSchema(); const normalized=normalizeEmail(email); if(!isEmailSyntaxValid(normalized)) throw new Error("invalid_email");
  const hash=createHash("sha256").update(normalized).digest("hex");
  await pool.query("INSERT INTO outreach_suppressions(id,normalized_email,normalized_email_hash,scope,campaign_id,suppression_type,source,reason) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[randomUUID(),normalized,hash,scope,campaignId||null,type,source,reason]);
  if(campaignId) await pool.query("UPDATE outbound_messages SET status='suppressed',cancelled_at=NOW() WHERE campaign_id=$1 AND recipient_id IN (SELECT id FROM outreach_recipients WHERE normalized_email=$2) AND status IN ('scheduled','queued','pending')",[campaignId,normalized]);
  await addEvent(campaignId||null,"suppressed",{type,scope,source});
}
export async function transitionCampaign(id:string,to:CampaignStatus,expectedVersion:number) {
  const current=await pool.query("SELECT * FROM outreach_campaigns WHERE id=$1",[id]); if(!current.rows[0]) return null;
  if(Number(current.rows[0].version)!==expectedVersion) throw new Error("optimistic_conflict");
  assertCampaignTransition(current.rows[0].status,to);
  const result=await pool.query(`UPDATE outreach_campaigns SET status=$2,version=version+1,updated_at=NOW(),
    approved_at=CASE WHEN $2='approved' THEN NOW() ELSE approved_at END,
    scheduled_at=CASE WHEN $2='scheduled' THEN NOW() ELSE scheduled_at END,
    paused_at=CASE WHEN $2='paused' THEN NOW() ELSE paused_at END,
    completed_at=CASE WHEN $2='completed' THEN NOW() ELSE completed_at END,
    cancelled_at=CASE WHEN $2='cancelled' THEN NOW() ELSE cancelled_at END,
    archived_at=CASE WHEN $2='archived' THEN NOW() ELSE archived_at END WHERE id=$1 RETURNING *`,[id,to]);
  await addEvent(id,to==="review_required"?"review_requested":to,{explicit:true}); return campaign(result.rows[0]);
}
export async function unsubscribeByToken(token:string,global=true) {
  await ensureOutreachSchema(); const hash=hashUnsubscribeToken(token);
  const result=await pool.query("SELECT id,campaign_id,normalized_email FROM outreach_recipients WHERE unsubscribe_token_hash=$1",[hash]);
  const row=result.rows[0]; if(!row) return null;
  await addSuppression(row.normalized_email,global?"global_unsubscribe":"campaign_unsubscribe",global?"global":"campaign",row.campaign_id,"public_unsubscribe","Recipient unsubscribe request");
  await pool.query("UPDATE outreach_recipients SET unsubscribe_status='unsubscribed',sequence_state='unsubscribed',updated_at=NOW() WHERE id=$1",[row.id]);
  return {success:true};
}
export async function listSuppressions() {
  await ensureOutreachSchema(); const result=await pool.query("SELECT id,scope,suppression_type,source,reason,created_at FROM outreach_suppressions ORDER BY created_at DESC LIMIT 100"); return result.rows;
}
export async function createDryRunDefaults() {
  await ensureOutreachSchema();
  const providerId="00000000-0000-4000-8000-000000000006", senderId="00000000-0000-4000-8000-000000000016";
  await pool.query(`INSERT INTO outreach_provider_connections(id,provider,display_label,verification_status,configuration) VALUES($1,'dry-run','Dry-run provider','verified','{"liveSending":false}') ON CONFLICT(id) DO NOTHING`,[providerId]);
  await pool.query(`INSERT INTO outreach_sender_identities(id,display_name,from_email,reply_to,business_name,physical_address,domain,verification_status,provider_connection_id)
    VALUES($1,'Revora Review','review@example.invalid','reply@example.invalid','Revora','Configure a verified physical address before live delivery','example.invalid','verified',$2) ON CONFLICT(id) DO NOTHING`,[senderId,providerId]);
  return {providerId,senderId};
}
export async function listSenderIdentities() { await ensureOutreachSchema(); const r=await pool.query("SELECT id,display_name,from_email,reply_to,business_name,physical_address,domain,verification_status,provider_connection_id,created_at FROM outreach_sender_identities ORDER BY created_at"); return r.rows; }

export async function reviewCampaign(id:string,expectedVersion:number) {
  const details=await getCampaign(id); if(!details) return null;
  if(details.version!==expectedVersion) throw new Error("optimistic_conflict");
  if(details.status!=="draft") throw new Error("invalid_review_state");
  const context=await pool.query(`SELECT si.verification_status sender_status,si.physical_address,pc.verification_status provider_status
    FROM outreach_campaigns c JOIN outreach_sender_identities si ON si.id=c.sender_identity_id JOIN outreach_provider_connections pc ON pc.id=c.provider_connection_id WHERE c.id=$1`,[id]);
  const active=details.steps.filter((step:Record<string,unknown>)=>step.enabled);
  if(!details.recipients.length) throw new Error("compliance_failed:eligible_recipient_required");
  for(const recipient of details.recipients) {
    const emailResult=await pool.query("SELECT normalized_email FROM outreach_recipients WHERE id=$1",[recipient.id]);
    const email=emailResult.rows[0].normalized_email; const suppressed=Boolean(await checkSuppression(email,id));
    for(const step of active) validateCompliance({
      campaignStatus:"review_required",recipientEmail:email,verificationStatus:recipient.verification_status,
      riskyApproved:Boolean(recipient.risky_approved),suppressed,unsubscribed:recipient.unsubscribe_status==="unsubscribed",
      hardBounced:recipient.bounce_status==="hard",senderVerified:context.rows[0].sender_status==="verified",
      providerVerified:context.rows[0].provider_status==="verified",physicalAddress:context.rows[0].physical_address,
      subject:step.subject_template,body:step.body_template,timezone:details.timezone,activeSteps:active.length,
    });
  }
  return transitionCampaign(id,"review_required",expectedVersion);
}

export async function scheduleCampaign(id:string,expectedVersion:number,startAt:string) {
  const details=await getCampaign(id); if(!details) return null;
  if(details.version!==expectedVersion) throw new Error("optimistic_conflict");
  if(details.status!=="approved") throw new Error("campaign_not_approved");
  const start=new Date(startAt); if(Number.isNaN(start.getTime())) throw new Error("invalid_schedule");
  const policy={...(details.sendingWindow as {weekdays:number[];startHour:number;endHour:number}),timezone:details.timezone,dailyLimit:details.dailyLimit,hourlyLimit:details.hourlyLimit};
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    for(const recipient of details.recipients) {
      const privateRecipient=await client.query(`SELECT r.normalized_email,r.unsubscribe_token_prefix,c.name contact_name,b.name business_name,si.display_name sender_name,si.physical_address
        FROM outreach_recipients r JOIN contacts c ON c.id=r.contact_id JOIN businesses b ON b.id=r.business_id
        JOIN outreach_campaigns oc ON oc.id=r.campaign_id JOIN outreach_sender_identities si ON si.id=oc.sender_identity_id WHERE r.id=$1`,[recipient.id]);
      if(await checkSuppression(privateRecipient.rows[0].normalized_email,id)) throw new Error("suppressed_at_schedule");
      if(recipient.unsubscribe_status==="unsubscribed"||recipient.bounce_status==="hard") throw new Error("recipient_ineligible_at_schedule");
      const vars={business_name:privateRecipient.rows[0].business_name,contact_greeting:privateRecipient.rows[0].contact_name?` ${String(privateRecipient.rows[0].contact_name).split(/\s+/)[0]}`:"",sender_name:privateRecipient.rows[0].sender_name,sender_business:privateRecipient.rows[0].business_name,physical_address:privateRecipient.rows[0].physical_address,unsubscribe_url:"[generated securely at delivery]",audit_insight:"See the reviewed campaign context.",proposal_url:"[published proposal link]"};
      let occurrence=nextAllowedTime(start,policy);
      for(const step of details.steps.filter((item:Record<string,unknown>)=>item.enabled)) {
        occurrence=new Date(occurrence.getTime()+Number(step.delay_value)*(step.delay_unit==="day"?86_400_000:3_600_000));
        occurrence=nextAllowedTime(occurrence,policy);
        const key=messageIdempotencyKey(id,String(recipient.id),String(step.id),details.contentVersion,occurrence.toISOString());
        await client.query(`INSERT INTO outbound_messages(id,campaign_id,recipient_id,sequence_step_id,idempotency_key,subject,body_html,body_text,status,content_version,scheduled_at,next_attempt_at)
          VALUES($1,$2,$3,$4,$5,$6,$7,$7,'scheduled',$8,$9,$9) ON CONFLICT(idempotency_key) DO NOTHING`,
          [randomUUID(),id,recipient.id,step.id,key,renderTemplate(String(step.subject_template),vars),renderTemplate(String(step.body_template),vars),details.contentVersion,occurrence.toISOString()]);
      }
    }
    await client.query("COMMIT");
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
  return transitionCampaign(id,"scheduled",expectedVersion);
}

export async function processDryRunBatch(limit=10) {
  await ensureOutreachSchema(); const provider=getOutreachProvider(); const client=await pool.connect(); const processed:string[]=[];
  try {
    await client.query("BEGIN");
    const result=await client.query(`SELECT om.*,r.normalized_email,si.from_email,si.reply_to
      FROM outbound_messages om JOIN outreach_recipients r ON r.id=om.recipient_id
      JOIN outreach_campaigns c ON c.id=om.campaign_id JOIN outreach_sender_identities si ON si.id=c.sender_identity_id
      WHERE om.status IN ('scheduled','deferred') AND om.next_attempt_at<=NOW() AND c.status IN ('scheduled','running')
      ORDER BY om.scheduled_at FOR UPDATE OF om SKIP LOCKED LIMIT $1`,[Math.min(Math.max(limit,1),25)]);
    for(const row of result.rows) {
      const suppression=await checkSuppression(row.normalized_email,row.campaign_id);
      if(suppression) {
        await client.query("UPDATE outbound_messages SET status='suppressed',cancelled_at=NOW(),updated_at=NOW() WHERE id=$1",[row.id]);
      } else {
        const sent=await provider.send({to:row.normalized_email,from:row.from_email,replyTo:row.reply_to,subject:row.subject,html:row.body_html,text:row.body_text,idempotencyKey:row.idempotency_key});
        await client.query("UPDATE outbound_messages SET status='unknown',provider_message_id=$2,provider_metadata=$3,attempt_count=attempt_count+1,updated_at=NOW() WHERE id=$1",[row.id,sent.providerMessageId,JSON.stringify({provider:sent.provider,status:sent.status,warnings:sent.warnings})]);
      }
      processed.push(row.id);
    }
    await client.query("COMMIT"); return {processed,provider:"dry-run",liveMessagesSent:0};
  } catch(error){await client.query("ROLLBACK");throw error} finally{client.release()}
}
export async function duplicateCampaign(id:string) {
  const source=await getCampaign(id); if(!source) return null;
  return createCampaign({name:`${source.name} (Copy)`,businessId:source.businessId,proposalId:source.proposalId||undefined,auditId:source.auditId||undefined,consultantReportId:source.consultantReportId||undefined,objective:source.objective,senderIdentityId:source.senderIdentityId,providerConnectionId:source.providerConnectionId,timezone:source.timezone,sendingWindow:source.sendingWindow as CampaignCreate["sendingWindow"],dailyLimit:source.dailyLimit,hourlyLimit:source.hourlyLimit});
}
export async function removeRecipient(campaignId:string,recipientId:string) {
  const result=await pool.query(`DELETE FROM outreach_recipients r USING outreach_campaigns c WHERE r.id=$1 AND r.campaign_id=$2 AND c.id=r.campaign_id AND c.status='draft' AND NOT EXISTS(SELECT 1 FROM outbound_messages m WHERE m.recipient_id=r.id) RETURNING r.id`,[recipientId,campaignId]);
  if(!result.rows[0]) throw new Error("recipient_not_removable"); await addEvent(campaignId,"recipient_removed",{},recipientId);
}
export async function updateSequenceStep(campaignId:string,stepId:string,input:SequenceStepInput) {
  const result=await pool.query(`UPDATE outreach_sequence_steps s SET position=$3,delay_value=$4,delay_unit=$5,subject_template=$6,body_template=$7,message_type=$8,requires_manual_review=$9,enabled=$10,version=version+1,updated_at=NOW()
    FROM outreach_campaigns c WHERE s.id=$1 AND s.campaign_id=$2 AND c.id=s.campaign_id AND c.status='draft' RETURNING s.*`,[stepId,campaignId,input.position,input.delayValue,input.delayUnit,input.subjectTemplate,input.bodyTemplate,input.messageType,input.requiresManualReview,input.enabled]);
  if(!result.rows[0]) throw new Error("sequence_step_not_editable"); await addEvent(campaignId,"sequence_step_edited",{stepId}); return result.rows[0];
}
export async function removeSequenceStep(campaignId:string,stepId:string) {
  const result=await pool.query(`DELETE FROM outreach_sequence_steps s USING outreach_campaigns c WHERE s.id=$1 AND s.campaign_id=$2 AND c.id=s.campaign_id AND c.status='draft' AND NOT EXISTS(SELECT 1 FROM outbound_messages m WHERE m.sequence_step_id=s.id) RETURNING s.id`,[stepId,campaignId]);
  if(!result.rows[0]) throw new Error("sequence_step_not_removable"); await addEvent(campaignId,"sequence_step_removed",{stepId});
}
export async function markRecipientReplied(campaignId:string,recipientId:string) {
  const result=await pool.query("UPDATE outreach_recipients SET reply_status='replied',sequence_state='replied',updated_at=NOW() WHERE id=$1 AND campaign_id=$2 RETURNING id",[recipientId,campaignId]);
  if(!result.rows[0]) throw new Error("recipient_not_found");
  await pool.query("UPDATE outbound_messages SET status='cancelled',cancelled_at=NOW(),updated_at=NOW() WHERE recipient_id=$1 AND status IN ('pending','scheduled','queued','deferred')",[recipientId]);
  await addEvent(campaignId,"replied",{source:"manual"},recipientId);
}
export async function createSenderIdentity(input:{displayName:string;fromEmail:string;replyTo:string;businessName:string;physicalAddress:string;domain:string;providerConnectionId:string}) {
  const id=randomUUID(); await pool.query(`INSERT INTO outreach_sender_identities(id,display_name,from_email,reply_to,business_name,physical_address,domain,verification_status,provider_connection_id) VALUES($1,$2,$3,$4,$5,$6,$7,'unverified',$8)`,[id,input.displayName,input.fromEmail,input.replyTo,input.businessName,input.physicalAddress,input.domain,input.providerConnectionId]); return {id,verificationStatus:"unverified"};
}
