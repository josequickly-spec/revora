import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { EnterpriseError } from "./store";

export function enterpriseFailure(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({error:"Invalid request.",code:"validation_error",details:error.issues},{status:400});
  if (error instanceof EnterpriseError) return NextResponse.json({error:error.message,code:error.code},{status:error.status});
  console.error("Enterprise operation failed.",error instanceof Error ? {name:error.name,message:error.message} : {type:typeof error});
  return NextResponse.json({error:"Enterprise operation failed.",code:"internal_error"},{status:500});
}

export async function safeJson(request: Request) {
  try { return await request.json(); }
  catch { throw new EnterpriseError("Request body must be valid JSON.",400,"invalid_json"); }
}
