import{NextResponse}from"next/server";import{z}from"zod";import{suppressionTypes}from"@/lib/outreach/contracts";import{addSuppression,listSuppressions}from"@/lib/outreach/store";
const schema=z.object({email:z.string().email(),type:z.enum(suppressionTypes),scope:z.enum(["global","campaign"]).default("global"),campaignId:z.string().uuid().optional(),reason:z.string().min(1).max(1000)}).strict();
export async function GET(){return NextResponse.json({suppressions:await listSuppressions()})}
export async function POST(r:Request){try{const b=schema.parse(await r.json());await addSuppression(b.email,b.type,b.scope,b.campaignId,"manual",b.reason);return NextResponse.json({suppressed:true},{status:201})}catch{return NextResponse.json({error:"Suppression request failed."},{status:400})}}
