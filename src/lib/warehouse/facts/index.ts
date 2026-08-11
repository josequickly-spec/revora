import type {PoolClient} from "pg";
const dateKey=(column:string)=>`TO_CHAR((${column})::date,'YYYYMMDD')::int`;
export async function refreshFacts(client:PoolClient,organizationId:string){
  let rows=0;async function insert(sql:string,params:unknown[]){const result=await client.query(sql,params);rows+=result.rowCount||0;}
  await insert(`INSERT INTO warehouse_fact_business(id,organization_id,date_key,business_id,event_type,source_record_id,occurred_at,measures)
    SELECT gen_random_uuid(),$1,${dateKey("a.created_at")},a.business_id,'crm_account_created',a.id::text,a.created_at,jsonb_build_object('status',a.status)
    FROM crm_accounts a WHERE a.organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  await insert(`INSERT INTO warehouse_fact_opportunity(id,organization_id,date_key,opportunity_id,stage_id,event_type,amount_minor,currency,probability_basis_points,weighted_amount_minor,occurred_at,source_record_id)
    SELECT gen_random_uuid(),$1,${dateKey("o.updated_at")},o.id,o.stage_id,'opportunity_snapshot',o.amount_minor,o.currency,s.probability_basis_points,
      CASE WHEN o.amount_minor IS NULL THEN NULL ELSE ROUND(o.amount_minor*s.probability_basis_points/10000.0)::bigint END,o.updated_at,o.id::text||':v'||o.version
    FROM crm_opportunities o JOIN crm_pipeline_stages s ON s.id=o.stage_id WHERE o.organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  await insert(`INSERT INTO warehouse_fact_proposal(id,organization_id,date_key,proposal_id,business_id,status,event_type,occurred_at,source_record_id)
    SELECT gen_random_uuid(),$1,${dateKey("p.updated_at")},p.id,p.business_id,p.status,'proposal_snapshot',p.updated_at,p.id::text||':v'||p.current_version||':'||p.status
    FROM proposal_documents p JOIN crm_accounts a ON a.business_id=p.business_id AND a.organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  await insert(`INSERT INTO warehouse_fact_outreach(id,organization_id,date_key,campaign_id,message_id,event_type,status,attempt_count,occurred_at,source_record_id)
    SELECT gen_random_uuid(),$1,${dateKey("m.updated_at")},c.id,m.id,'message_snapshot',m.status,m.attempt_count,m.updated_at,m.id::text||':'||m.status||':'||m.attempt_count
    FROM outbound_messages m JOIN outreach_campaigns c ON c.id=m.campaign_id JOIN crm_accounts a ON a.business_id=c.business_id AND a.organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  await insert(`INSERT INTO warehouse_fact_crm(id,organization_id,date_key,aggregate_type,aggregate_id,event_type,aggregate_version,occurred_at,source_record_id)
    SELECT gen_random_uuid(),$1,${dateKey("occurred_at")},aggregate_type,aggregate_id,event_type,aggregate_version,occurred_at,id::text FROM crm_events WHERE organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  await insert(`INSERT INTO warehouse_fact_revenue(id,organization_id,date_key,invoice_id,event_type,amount_minor,currency,occurred_at,source_record_id)
    SELECT gen_random_uuid(),$1,${dateKey("COALESCE(i.paid_at,i.issued_at,i.created_at)")},i.id,'invoice_'||i.status,i.total_minor,i.currency,COALESCE(i.paid_at,i.issued_at,i.created_at),i.id::text||':'||i.status FROM billing_invoices i WHERE i.organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  await insert(`INSERT INTO warehouse_fact_user(id,organization_id,date_key,user_id,event_type,outcome,occurred_at,source_record_id)
    SELECT gen_random_uuid(),$1,${dateKey("created_at")},actor_id,action,outcome,created_at,id::text FROM enterprise_audit_logs WHERE organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  await insert(`INSERT INTO warehouse_fact_workflow(id,organization_id,date_key,job_id,queue,job_type,status,attempts,latency_ms,occurred_at,source_record_id)
    SELECT gen_random_uuid(),$1,${dateKey("j.updated_at")},j.id,j.queue,j.job_type,j.status,j.attempts,CASE WHEN j.started_at IS NULL OR j.completed_at IS NULL THEN NULL ELSE EXTRACT(EPOCH FROM(j.completed_at-j.started_at))*1000 END,j.updated_at,j.id::text||':'||j.status||':'||j.attempts FROM platform_jobs j WHERE j.organization_id=$1 ON CONFLICT DO NOTHING`,[organizationId]);
  return rows;
}
