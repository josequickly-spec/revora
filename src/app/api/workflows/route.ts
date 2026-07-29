import { NextResponse } from "next/server";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { createJob,listJobs,requirePermission } from "@/lib/enterprise/store";
export async function GET(request:Request){try{const context=await requirePermission(request,"workflow.read");return NextResponse.json({jobs:await listJobs(context)});}catch(error){return enterpriseFailure(error);}}
export async function POST(request:Request){try{const context=await requirePermission(request,"workflow.manage");return NextResponse.json({job:await createJob(context,await safeJson(request))},{status:202});}catch(error){return enterpriseFailure(error);}}
