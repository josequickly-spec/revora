import { NextResponse } from "next/server";
import { z } from "zod";
import { enterpriseFailure } from "@/lib/enterprise/http";
import { EnterpriseError,finishJob } from "@/lib/enterprise/store";
const resultSchema=z.object({workerId:z.string().min(1).max(200),outcome:z.enum(["succeeded","retry","failed"]),safeErrorCode:z.string().max(100).optional(),safeErrorMessage:z.string().max(1000).optional()}).strict();
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){try{if(!process.env.WORKFLOW_WORKER_SECRET||request.headers.get("x-worker-secret")!==process.env.WORKFLOW_WORKER_SECRET)throw new EnterpriseError("Worker authentication failed.",401,"worker_auth_failed");const input=resultSchema.parse(await request.json());return NextResponse.json({job:await finishJob(input.workerId,(await params).id,input)});}catch(error){return enterpriseFailure(error);}}
