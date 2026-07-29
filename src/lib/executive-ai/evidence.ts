import {createHash} from "node:crypto";import {pool} from "@/lib/postgres";
export async function buildExecutiveEvidence(organizationId:string,advisor:string){
  const dashboards:Record<string,string[]>={
    business:["executive"],revenue:["executive","sales"],sales:["sales"],marketing:["marketing"],
    operations:["operations"],security:["security"],growth:["executive","marketing","sales"],
  };
  const result=await pool.query(`SELECT id,dashboard,metric,period_granularity AS "granularity",period_start AS "periodStart",period_end AS "periodEnd",value_numeric::float AS "valueNumeric",value_text AS "valueText",currency,evidence,source_watermark AS "sourceWatermark" FROM warehouse_metric_snapshots WHERE organization_id=$1 AND dashboard=ANY($2) AND period_granularity IN('monthly','quarterly') ORDER BY period_start DESC LIMIT 200`,[organizationId,dashboards[advisor]||["executive"]]);
  const catalog=result.rows.map(row=>({evidenceId:`metric:${row.id}`,...row}));
  const serialized=JSON.stringify(catalog);
  return {catalog,evidenceHash:createHash("sha256").update(serialized).digest("hex"),sourceWatermark:catalog[0]?.sourceWatermark||null};
}
