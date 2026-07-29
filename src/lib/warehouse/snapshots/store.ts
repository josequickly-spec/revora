import {pool} from "@/lib/postgres";import type {Dashboard,Granularity} from "../contracts";
export async function readDashboard(organizationId:string,dashboard:Dashboard,granularity:Granularity){
  const latest=await pool.query(`SELECT MAX(period_start) period_start FROM warehouse_metric_snapshots WHERE organization_id=$1 AND dashboard=$2 AND period_granularity=$3`,[organizationId,dashboard,granularity]);
  if(!latest.rows[0]?.period_start)return {dashboard,granularity,metrics:[],status:"empty" as const,lastRefresh:null};
  const result=await pool.query(`SELECT metric,value_numeric::float AS "valueNumeric",value_text AS "valueText",currency,evidence,calculated_at AS "calculatedAt",source_watermark AS "sourceWatermark",period_start AS "periodStart",period_end AS "periodEnd" FROM warehouse_metric_snapshots WHERE organization_id=$1 AND dashboard=$2 AND period_granularity=$3 AND period_start=$4 ORDER BY metric`,[organizationId,dashboard,granularity,latest.rows[0].period_start]);
  return {dashboard,granularity,metrics:result.rows,status:"ready" as const,lastRefresh:result.rows[0]?.calculatedAt||null};
}
