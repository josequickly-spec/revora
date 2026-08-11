import {randomUUID} from "node:crypto";import {pool} from "@/lib/postgres";import type {ForecastType} from "@/lib/warehouse/contracts";import {linearForecast,forecastDisclaimer} from "./engine";
const mapping:Record<ForecastType,{dashboard:string;metric:string;unit:string}>={revenue:{dashboard:"executive",metric:"revenue",unit:"USD_minor"},pipeline:{dashboard:"executive",metric:"pipeline",unit:"USD_minor"},growth:{dashboard:"executive",metric:"customers",unit:"customers"},capacity:{dashboard:"operations",metric:"jobs",unit:"jobs"},usage:{dashboard:"operations",metric:"jobs",unit:"jobs"}};
export async function generateForecasts(organizationId:string){
  const generated:ForecastType[]=[];
  for(const [forecastType,source] of Object.entries(mapping) as [ForecastType,typeof mapping[ForecastType]][]){
    const history=await pool.query(`SELECT period_start::text period,value_numeric::float value,source_watermark FROM warehouse_metric_snapshots WHERE organization_id=$1 AND dashboard=$2 AND metric=$3 AND period_granularity='monthly' AND value_numeric IS NOT NULL ORDER BY period_start DESC LIMIT 12`,[organizationId,source.dashboard,source.metric]);
    const points=history.rows.reverse(),forecast=linearForecast(points);
    if(!forecast)continue;
    const start=new Date();start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()+1);const end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0));
    await pool.query(`INSERT INTO warehouse_forecasts(id,organization_id,forecast_type,horizon,period_start,period_end,estimate,lower_bound,upper_bound,unit,method,sample_size,evidence,disclaimer,source_watermark) VALUES($1,$2,$3,'monthly',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,[randomUUID(),organizationId,forecastType,start.toISOString().slice(0,10),end.toISOString().slice(0,10),forecast.estimate,forecast.lowerBound,forecast.upperBound,source.unit,forecast.method,forecast.sampleSize,JSON.stringify(points.map(point=>({period:point.period,value:point.value}))),forecastDisclaimer,history.rows[0].source_watermark]);
    generated.push(forecastType);
  }
  return generated;
}
export async function readForecasts(organizationId:string){return (await pool.query(`SELECT DISTINCT ON(forecast_type) forecast_type AS "forecastType",horizon,period_start AS "periodStart",period_end AS "periodEnd",estimate::float,lower_bound::float AS "lowerBound",upper_bound::float AS "upperBound",unit,method,sample_size AS "sampleSize",evidence,disclaimer,generated_at AS "generatedAt" FROM warehouse_forecasts WHERE organization_id=$1 ORDER BY forecast_type,generated_at DESC`,[organizationId])).rows;}
