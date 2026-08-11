import {NextResponse} from "next/server";import {healthSnapshot} from "@/lib/observability/health";
export const dynamic="force-dynamic";export async function GET(){const health=await healthSnapshot();return NextResponse.json(health,{status:health.ok?200:503,headers:{"Cache-Control":"no-store"}});}
