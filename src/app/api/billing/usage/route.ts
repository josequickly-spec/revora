import { NextResponse } from "next/server";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { recordUsage,requirePermission } from "@/lib/enterprise/store";
export async function POST(request:Request){try{const context=await requirePermission(request,"billing.manage");return NextResponse.json({usage:await recordUsage(context,await safeJson(request))},{status:201});}catch(error){return enterpriseFailure(error);}}
