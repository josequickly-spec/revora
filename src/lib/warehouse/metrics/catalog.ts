import type {PoolClient} from "pg";import type {Dashboard} from "../contracts";
export type CalculatedMetric={dashboard:Dashboard;metric:string;valueNumeric:number|null;valueText:string|null;currency:string|null;evidence:unknown[]};
async function scalar(client:PoolClient,sql:string,params:unknown[]){return (await client.query(sql,params)).rows[0]||{};}
export async function calculateMetrics(client:PoolClient,organizationId:string,start:string,end:string):Promise<CalculatedMetric[]>{
  const startDate=new Date(`${start}T00:00:00Z`),endDate=new Date(`${end}T00:00:00Z`),days=Math.round((endDate.valueOf()-startDate.valueOf())/86_400_000)+1;
  const previousEnd=new Date(startDate);previousEnd.setUTCDate(previousEnd.getUTCDate()-1);const previousStart=new Date(previousEnd);previousStart.setUTCDate(previousStart.getUTCDate()-days+1);
  const previous=[previousStart.toISOString().slice(0,10),previousEnd.toISOString().slice(0,10)];
  const [executive,sales,marketing,operations,security]=await Promise.all([
    scalar(client,`SELECT
      (SELECT COUNT(DISTINCT business_id)::int FROM warehouse_fact_business WHERE organization_id=$1 AND TO_DATE(date_key::text,'YYYYMMDD') BETWEEN $2 AND $3) customers,
      (SELECT COUNT(DISTINCT business_id)::int FROM warehouse_fact_business WHERE organization_id=$1 AND TO_DATE(date_key::text,'YYYYMMDD') BETWEEN $4 AND $5) previous_customers,
      (SELECT COALESCE(SUM(amount_minor) FILTER(WHERE event_type='invoice_paid' AND currency='USD'),0)::bigint FROM warehouse_fact_revenue WHERE organization_id=$1 AND TO_DATE(date_key::text,'YYYYMMDD') BETWEEN $2 AND $3) revenue,
      (SELECT COALESCE(SUM(p.monthly_price_minor),0)::bigint FROM billing_subscriptions s JOIN billing_plans p ON p.id=s.plan_id WHERE s.organization_id=$1 AND s.status IN('active','trialing') AND p.currency='USD') mrr,
      (SELECT COUNT(*)::int FROM billing_subscriptions WHERE organization_id=$1) subscriptions,
      (SELECT COUNT(*)::int FROM billing_subscriptions WHERE organization_id=$1 AND status IN('cancelled','canceled')) cancelled,
      (SELECT COUNT(*)::int FROM billing_subscriptions WHERE organization_id=$1 AND status IN('active','trialing')) retained`,[organizationId,start,end,...previous]),
    scalar(client,`SELECT COUNT(*)::int opportunities,COUNT(*) FILTER(WHERE p.is_won)::int won,COALESCE(AVG(f.amount_minor) FILTER(WHERE f.amount_minor IS NOT NULL AND f.currency='USD'),0)::numeric average_deal,COALESCE(SUM(f.weighted_amount_minor) FILTER(WHERE NOT p.is_closed AND f.currency='USD'),0)::bigint forecast FROM warehouse_fact_opportunity f JOIN warehouse_dim_pipeline p ON p.organization_id=f.organization_id AND p.stage_id=f.stage_id AND p.is_current WHERE f.organization_id=$1 AND TO_DATE(f.date_key::text,'YYYYMMDD') BETWEEN $2 AND $3`,[organizationId,start,end]),
    scalar(client,`SELECT COUNT(*) FILTER(WHERE event_type='crm_account_created')::int leads,(SELECT COUNT(*)::int FROM funnelspy_audits fa JOIN crm_accounts ca ON ca.business_id=fa.business_id WHERE ca.organization_id=$1 AND fa.created_at::date BETWEEN $2 AND $3) audits,(SELECT COUNT(*)::int FROM warehouse_fact_outreach WHERE organization_id=$1 AND status IN('sent','delivered') AND TO_DATE(date_key::text,'YYYYMMDD') BETWEEN $2 AND $3) messages FROM warehouse_fact_business WHERE organization_id=$1 AND TO_DATE(date_key::text,'YYYYMMDD') BETWEEN $2 AND $3`,[organizationId,start,end]),
    scalar(client,`SELECT COUNT(*)::int jobs,COUNT(*) FILTER(WHERE status='succeeded')::int succeeded,COUNT(*) FILTER(WHERE status IN('failed','dead_lettered'))::int failures,COALESCE(SUM(attempts),0)::int attempts,COALESCE(AVG(latency_ms) FILTER(WHERE latency_ms IS NOT NULL),0)::numeric latency FROM warehouse_fact_workflow WHERE organization_id=$1 AND TO_DATE(date_key::text,'YYYYMMDD') BETWEEN $2 AND $3`,[organizationId,start,end]),
    scalar(client,`SELECT (SELECT COUNT(*)::int FROM warehouse_dim_user WHERE organization_id=$1 AND is_current) users,(SELECT COUNT(*)::int FROM enterprise_device_sessions WHERE organization_id=$1 AND revoked_at IS NULL AND expires_at>NOW()) sessions,(SELECT COUNT(*)::int FROM enterprise_mfa_factors f JOIN enterprise_memberships m ON m.user_id=f.user_id WHERE m.organization_id=$1 AND f.verified_at IS NOT NULL AND f.disabled_at IS NULL) mfa,(SELECT COUNT(*)::int FROM enterprise_api_keys WHERE organization_id=$1 AND revoked_at IS NULL) api_keys,(SELECT COUNT(*)::int FROM enterprise_auth_identities i JOIN enterprise_memberships m ON m.user_id=i.user_id WHERE m.organization_id=$1) oauth,(SELECT COUNT(*)::int FROM warehouse_fact_user WHERE organization_id=$1 AND outcome='denied' AND TO_DATE(date_key::text,'YYYYMMDD') BETWEEN $2 AND $3) denied`,[organizationId,start,end]),
  ]);
  const ratio=(a:number,b:number)=>b?Number((a/b*100).toFixed(2)):0;
  const currency="USD",unavailable=(dashboard:Dashboard,metric:string):CalculatedMetric=>({dashboard,metric,valueNumeric:null,valueText:"Unavailable: no authoritative source is connected.",currency:null,evidence:[]});
  return [
    {dashboard:"executive",metric:"customers",valueNumeric:Number(executive.customers||0),valueText:null,currency:null,evidence:["warehouse_fact_business"]},
    {dashboard:"executive",metric:"revenue",valueNumeric:Number(executive.revenue||0),valueText:null,currency,evidence:["warehouse_fact_revenue"]},
    {dashboard:"executive",metric:"pipeline",valueNumeric:Number(sales.forecast||0),valueText:null,currency,evidence:["warehouse_fact_opportunity","warehouse_dim_pipeline"]},
    {dashboard:"executive",metric:"conversion_rate",valueNumeric:ratio(Number(sales.won||0),Number(sales.opportunities||0)),valueText:null,currency:null,evidence:["warehouse_fact_opportunity"]},
    {dashboard:"executive",metric:"mrr",valueNumeric:Number(executive.mrr||0),valueText:null,currency,evidence:["billing_subscriptions","billing_plans"]},
    {dashboard:"executive",metric:"arr",valueNumeric:Number(executive.mrr||0)*12,valueText:null,currency,evidence:["billing_subscriptions","billing_plans"]},
    {dashboard:"executive",metric:"churn",valueNumeric:ratio(Number(executive.cancelled||0),Number(executive.subscriptions||0)),valueText:null,currency:null,evidence:["billing_subscriptions"]},
    {dashboard:"executive",metric:"retention",valueNumeric:ratio(Number(executive.retained||0),Number(executive.subscriptions||0)),valueText:null,currency:null,evidence:["billing_subscriptions"]},
    {dashboard:"executive",metric:"growth",valueNumeric:Number(executive.previous_customers||0)?Number((((Number(executive.customers||0)-Number(executive.previous_customers))/Number(executive.previous_customers))*100).toFixed(2)):0,valueText:null,currency:null,evidence:["warehouse_fact_business"]},
    {dashboard:"sales",metric:"opportunities",valueNumeric:Number(sales.opportunities||0),valueText:null,currency:null,evidence:["warehouse_fact_opportunity"]},
    {dashboard:"sales",metric:"win_rate",valueNumeric:ratio(Number(sales.won||0),Number(sales.opportunities||0)),valueText:null,currency:null,evidence:["warehouse_fact_opportunity","warehouse_dim_pipeline"]},
    {dashboard:"sales",metric:"average_deal",valueNumeric:Number(sales.average_deal||0),valueText:null,currency,evidence:["warehouse_fact_opportunity"]},
    {dashboard:"sales",metric:"forecast",valueNumeric:Number(sales.forecast||0),valueText:null,currency,evidence:["warehouse_fact_opportunity"]},
    {dashboard:"marketing",metric:"lead_sources",valueNumeric:Number(marketing.leads||0),valueText:null,currency:null,evidence:["warehouse_fact_business"]},
    {dashboard:"marketing",metric:"funnel_audits",valueNumeric:Number(marketing.audits||0),valueText:null,currency:null,evidence:["funnelspy_audits"]},
    {dashboard:"marketing",metric:"campaign_messages",valueNumeric:Number(marketing.messages||0),valueText:null,currency:null,evidence:["warehouse_fact_outreach"]},
    unavailable("marketing","seo"),unavailable("marketing","reviews"),unavailable("marketing","traffic"),
    {dashboard:"operations",metric:"jobs",valueNumeric:Number(operations.jobs||0),valueText:null,currency:null,evidence:["warehouse_fact_workflow"]},
    {dashboard:"operations",metric:"success_rate",valueNumeric:ratio(Number(operations.succeeded||0),Number(operations.jobs||0)),valueText:null,currency:null,evidence:["warehouse_fact_workflow"]},
    {dashboard:"operations",metric:"failures",valueNumeric:Number(operations.failures||0),valueText:null,currency:null,evidence:["warehouse_fact_workflow"]},
    {dashboard:"operations",metric:"retries",valueNumeric:Math.max(0,Number(operations.attempts||0)-Number(operations.jobs||0)),valueText:null,currency:null,evidence:["warehouse_fact_workflow"]},
    {dashboard:"operations",metric:"average_latency_ms",valueNumeric:Number(operations.latency||0),valueText:null,currency:null,evidence:["warehouse_fact_workflow"]},
    {dashboard:"security",metric:"users",valueNumeric:Number(security.users||0),valueText:null,currency:null,evidence:["warehouse_dim_user"]},
    {dashboard:"security",metric:"sessions",valueNumeric:Number(security.sessions||0),valueText:null,currency:null,evidence:["enterprise_device_sessions"]},
    {dashboard:"security",metric:"mfa_factors",valueNumeric:Number(security.mfa||0),valueText:null,currency:null,evidence:["enterprise_mfa_factors"]},
    {dashboard:"security",metric:"api_keys",valueNumeric:Number(security.api_keys||0),valueText:null,currency:null,evidence:["enterprise_api_keys"]},
    {dashboard:"security",metric:"oauth_identities",valueNumeric:Number(security.oauth||0),valueText:null,currency:null,evidence:["enterprise_auth_identities"]},
    {dashboard:"security",metric:"denied_actions",valueNumeric:Number(security.denied||0),valueText:null,currency:null,evidence:["warehouse_fact_user"]},
  ];
}
