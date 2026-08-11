import { NextResponse } from "next/server";
import { crmResources } from "@/lib/enterprise/contracts";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { createResource,listResource,requirePermission } from "@/lib/enterprise/store";

export async function GET(request:Request,{params}:{params:Promise<{resource:string}>}) {
  try {
    const {resource}=await params;
    if(!crmResources.includes(resource as never)) return NextResponse.json({error:"Resource not found.",code:"not_found"},{status:404});
    const context=await requirePermission(request,"crm.read");
    return NextResponse.json({data:await listResource(context,resource)});
  } catch(error){ return enterpriseFailure(error); }
}
export async function POST(request:Request,{params}:{params:Promise<{resource:string}>}) {
  try {
    const {resource}=await params;
    if(!crmResources.includes(resource as never)) return NextResponse.json({error:"Resource not found.",code:"not_found"},{status:404});
    const context=await requirePermission(request,"crm.write");
    return NextResponse.json({data:await createResource(context,resource,await safeJson(request))},{status:201});
  } catch(error){ return enterpriseFailure(error); }
}
