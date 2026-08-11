import { NextResponse } from "next/server";
import { enterpriseFailure } from "@/lib/enterprise/http";
import { claimJobs,EnterpriseError } from "@/lib/enterprise/store";
export async function POST(request:Request){
  try{
    const secret=request.headers.get("x-worker-secret");
    if(!process.env.WORKFLOW_WORKER_SECRET||secret!==process.env.WORKFLOW_WORKER_SECRET)throw new EnterpriseError("Worker authentication failed.",401,"worker_auth_failed");
    const input=await request.json() as {workerId?:string;queue?:string;limit?:number};
    if(!input.workerId||!input.queue)throw new EnterpriseError("workerId and queue are required.",400,"invalid_worker_request");
    return NextResponse.json({jobs:await claimJobs(input.workerId,input.queue,input.limit)});
  }catch(error){return enterpriseFailure(error);}
}
