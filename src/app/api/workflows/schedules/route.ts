import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { requirePermission } from "@/lib/enterprise/store";
import { pool } from "@/lib/postgres";
import { nextCronOccurrence } from "@/lib/enterprise/scheduler";
const schema=z.object({name:z.string().trim().min(1).max(160),jobType:z.string().min(3).max(100),cronExpression:z.string().min(5).max(100),timezone:z.string().min(1).max(100),payload:z.record(z.string(),z.unknown()).default({})}).strict();
export async function GET(request:Request){try{const context=await requirePermission(request,"workflow.read");const result=await pool.query(`SELECT id,name,job_type AS "jobType",cron_expression AS "cronExpression",timezone,enabled,next_run_at AS "nextRunAt",last_run_at AS "lastRunAt" FROM platform_schedules WHERE organization_id=$1 ORDER BY name`,[context.organizationId]);return NextResponse.json({schedules:result.rows});}catch(error){return enterpriseFailure(error);}}
export async function POST(request:Request){try{const context=await requirePermission(request,"workflow.manage"),input=schema.parse(await safeJson(request)),id=randomUUID(),nextRunAt=nextCronOccurrence(input.cronExpression,input.timezone);await pool.query(`INSERT INTO platform_schedules(id,organization_id,name,job_type,cron_expression,timezone,payload,next_run_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,[id,context.organizationId,input.name,input.jobType,input.cronExpression,input.timezone,JSON.stringify(input.payload),nextRunAt]);return NextResponse.json({id,nextRunAt},{status:201});}catch(error){return enterpriseFailure(error);}}
