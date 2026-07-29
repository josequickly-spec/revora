import { NextResponse } from "next/server";
import { enterpriseOpenApi } from "@/lib/enterprise/openapi";
export async function GET(){return NextResponse.json(enterpriseOpenApi,{headers:{"Cache-Control":"public, max-age=300"}});}
