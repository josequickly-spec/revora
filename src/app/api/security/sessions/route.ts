import { NextResponse } from "next/server";
import { enterpriseFailure } from "@/lib/enterprise/http";
import { listSessions,requirePermission } from "@/lib/enterprise/store";

export async function GET(request:Request) {
  try { const context=await requirePermission(request,"security.manage"); return NextResponse.json({sessions:await listSessions(context)}); }
  catch(error){ return enterpriseFailure(error); }
}
