import { createHmac,timingSafeEqual,randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { pool } from "@/lib/postgres";

function validSignature(payload:string,header:string,secret:string){
  const parts=Object.fromEntries(header.split(",").map(part=>part.split("=")));
  const timestamp=Number(parts.t);
  if(!timestamp||Math.abs(Date.now()/1000-timestamp)>300||!parts.v1)return false;
  const expected=createHmac("sha256",secret).update(`${timestamp}.${payload}`).digest();
  const supplied=Buffer.from(parts.v1,"hex");
  return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}

export async function POST(request:Request){
  const secret=process.env.STRIPE_WEBHOOK_SECRET,signature=request.headers.get("stripe-signature")||"",payload=await request.text();
  if(!secret||!validSignature(payload,signature,secret))return NextResponse.json({error:"Invalid webhook signature."},{status:401});
  let event:{id?:string;type?:string;data?:{object?:Record<string,unknown>}};
  try{event=JSON.parse(payload);}catch{return NextResponse.json({error:"Invalid webhook JSON."},{status:400});}
  if(!event.id||!event.type)return NextResponse.json({error:"Invalid webhook envelope."},{status:400});
  const object=event.data?.object||{},objectId=typeof object.id==="string"?object.id:null;
  const inserted=await pool.query(`INSERT INTO billing_webhook_events(id,provider_event_id,event_type,safe_payload) VALUES($1,$2,$3,$4) ON CONFLICT(provider_event_id) DO NOTHING RETURNING id`,[randomUUID(),event.id,event.type,JSON.stringify({objectId,objectType:typeof object.object==="string"?object.object:null})]);
  if(!inserted.rowCount)return NextResponse.json({received:true,duplicate:true});
  const organizationId=typeof (object.metadata as Record<string,unknown>|undefined)?.organization_id==="string"?(object.metadata as Record<string,string>).organization_id:null;
  try{
    if(event.type.startsWith("customer.subscription.")&&organizationId){
      await pool.query(`UPDATE billing_subscriptions SET provider_subscription_id=$1,status=$2,period_start=TO_TIMESTAMP($3),period_end=TO_TIMESTAMP($4),cancel_at_period_end=$5,updated_at=NOW() WHERE organization_id=$6`,[objectId,String(object.status||"incomplete"),Number(object.current_period_start||0),Number(object.current_period_end||0),Boolean(object.cancel_at_period_end),organizationId]);
    }
    await pool.query(`UPDATE billing_webhook_events SET processing_status='processed',processed_at=NOW() WHERE provider_event_id=$1`,[event.id]);
    return NextResponse.json({received:true});
  }catch{
    await pool.query(`UPDATE billing_webhook_events SET processing_status='failed',processed_at=NOW(),safe_error_code='processing_failed' WHERE provider_event_id=$1`,[event.id]);
    return NextResponse.json({received:true,processing:"failed"},{status:500});
  }
}
