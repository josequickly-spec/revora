import { NextResponse } from "next/server";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { changeOpportunityStage,requirePermission } from "@/lib/enterprise/store";

export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const context=await requirePermission(request,"crm.stage.change");
    return NextResponse.json({data:await changeOpportunityStage(context,(await params).id,await safeJson(request))});
  } catch(error){ return enterpriseFailure(error); }
}
