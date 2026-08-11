import { NextRequest,NextResponse } from "next/server";
import { ZodError } from "zod";
import { campaignCreateSchema } from "@/lib/outreach/contracts";
import { createCampaign,ensureConfiguredOutreachProviders,listCampaigns } from "@/lib/outreach/store";
export async function GET(request:NextRequest){try{const raw=request.nextUrl.searchParams.get("businessId");return NextResponse.json({campaigns:await listCampaigns({businessId:raw?Number(raw):undefined,status:request.nextUrl.searchParams.get("status")||undefined,limit:Number(request.nextUrl.searchParams.get("limit")||50)})})}catch{return NextResponse.json({error:"Campaigns unavailable."},{status:503})}}
export async function POST(request:Request){try{await ensureConfiguredOutreachProviders();const input=campaignCreateSchema.parse(await request.json());return NextResponse.json({campaign:await createCampaign(input)},{status:201})}catch(error){if(error instanceof ZodError)return NextResponse.json({error:"Invalid campaign request.",details:error.issues},{status:400});return NextResponse.json({error:error instanceof Error?error.message:"Campaign creation failed."},{status:409})}}
