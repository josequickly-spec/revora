import { NextResponse } from "next/server";
import { z } from "zod";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { beginMfa,confirmMfa,requirePermission } from "@/lib/enterprise/store";

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
  try{
    const context=await requirePermission(request,"security.manage");
    const {action}=await params;
    if(action==="setup")return NextResponse.json(await beginMfa(context),{status:201});
    if(action==="confirm"){
      const input=z.object({factorId:z.string().uuid(),code:z.string().regex(/^\d{6}$/)}).strict().parse(await safeJson(request));
      await confirmMfa(context,input.factorId,input.code);return NextResponse.json({success:true});
    }
    return NextResponse.json({error:"MFA action not found.",code:"not_found"},{status:404});
  }catch(error){return enterpriseFailure(error);}
}
