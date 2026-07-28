import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { campaignUpdateSchema } from "@/lib/outreach/contracts";
import { getCampaign,transitionCampaign,updateCampaign } from "@/lib/outreach/store";
export async function GET(_r:Request,{params}:{params:Promise<{id:string}>}){const{id}=await params;const item=await getCampaign(id);return item?NextResponse.json({campaign:item}):NextResponse.json({error:"Campaign not found."},{status:404})}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const[{id},input]=await Promise.all([params,request.json().then(v=>campaignUpdateSchema.parse(v))]);return NextResponse.json({campaign:await updateCampaign(id,input)})}catch(error){if(error instanceof ZodError)return NextResponse.json({error:"Invalid update."},{status:400});return NextResponse.json({error:error instanceof Error?error.message:"Update failed."},{status:error instanceof Error&&error.message==="optimistic_conflict"?409:400})}}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}){try{const[{id},body]=await Promise.all([params,request.json()]);return NextResponse.json({campaign:await transitionCampaign(id,"cancelled",body.expectedVersion)})}catch{return NextResponse.json({error:"Campaign could not be cancelled."},{status:409})}}
