import { NextResponse } from "next/server";
import { enterpriseFailure } from "@/lib/enterprise/http";
import { requirePermission,revokeSession } from "@/lib/enterprise/store";

export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}) {
  try { const context=await requirePermission(request,"security.manage"); await revokeSession(context,(await params).id); return NextResponse.json({success:true}); }
  catch(error){ return enterpriseFailure(error); }
}
