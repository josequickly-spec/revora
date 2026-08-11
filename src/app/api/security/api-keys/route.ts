import { NextResponse } from "next/server";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { createApiKey,requirePermission } from "@/lib/enterprise/store";
import { pool } from "@/lib/postgres";

export async function GET(request:Request) {
  try {
    const context=await requirePermission(request,"api.manage");
    const result=await pool.query(`SELECT id,name,key_prefix AS prefix,permissions,last_used_at AS "lastUsedAt",expires_at AS "expiresAt",created_at AS "createdAt" FROM enterprise_api_keys WHERE organization_id=$1 AND revoked_at IS NULL ORDER BY created_at DESC`,[context.organizationId]);
    return NextResponse.json({apiKeys:result.rows});
  } catch(error){ return enterpriseFailure(error); }
}
export async function POST(request:Request) {
  try { const context=await requirePermission(request,"api.manage"); return NextResponse.json({apiKey:await createApiKey(context,await safeJson(request))},{status:201}); }
  catch(error){ return enterpriseFailure(error); }
}
