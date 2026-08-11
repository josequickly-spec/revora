import { NextResponse } from "next/server";
import { enterpriseFailure } from "@/lib/enterprise/http";
import { requirePermission } from "@/lib/enterprise/store";
import { pool } from "@/lib/postgres";
export async function GET(request:Request){try{const context=await requirePermission(request,"workflow.read");const result=await pool.query(`SELECT id,notification_type AS "type",title,body,action_url AS "actionUrl",read_at AS "readAt",created_at AS "createdAt" FROM platform_notifications WHERE organization_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 100`,[context.organizationId,context.userId]);return NextResponse.json({notifications:result.rows});}catch(error){return enterpriseFailure(error);}}
