import { NextResponse } from "next/server";
import { enterpriseFailure } from "@/lib/enterprise/http";
import { listBilling,requirePermission } from "@/lib/enterprise/store";
export async function GET(request:Request){try{const context=await requirePermission(request,"billing.read");return NextResponse.json(await listBilling(context));}catch(error){return enterpriseFailure(error);}}
