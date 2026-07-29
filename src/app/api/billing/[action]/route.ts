import { NextResponse } from "next/server";
import { z } from "zod";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { EnterpriseError,requirePermission } from "@/lib/enterprise/store";
import { pool } from "@/lib/postgres";

async function stripe(path:string,body:URLSearchParams){
  if(!process.env.STRIPE_SECRET_KEY)throw new EnterpriseError("Stripe is not configured.",503,"stripe_unavailable");
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:"POST",headers:{Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,"Content-Type":"application/x-www-form-urlencoded"},body});
  const result=await response.json() as {id?:string;url?:string;error?:{message?:string}};
  if(!response.ok)throw new EnterpriseError(result.error?.message||"Stripe request failed.",502,"stripe_request_failed");
  return result;
}

export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
  try{
    const context=await requirePermission(request,"billing.manage"),{action}=await params;
    const origin=new URL(request.url).origin;
    const subscription=await pool.query(`SELECT provider_customer_id FROM billing_subscriptions WHERE organization_id=$1`,[context.organizationId]);
    let customerId=subscription.rows[0]?.provider_customer_id as string|undefined;
    if(action==="checkout"){
      const {plan}=z.object({plan:z.string().min(1).max(50)}).strict().parse(await safeJson(request));
      const selected=await pool.query(`SELECT id,stripe_price_id FROM billing_plans WHERE code=$1 AND active`,[plan]);
      if(!selected.rowCount||!selected.rows[0].stripe_price_id)throw new EnterpriseError("This plan is not configured for online checkout.",409,"plan_checkout_unavailable");
      if(!customerId){
        const organization=await pool.query(`SELECT name FROM enterprise_organizations WHERE id=$1`,[context.organizationId]);
        const customer=await stripe("customers",new URLSearchParams({name:organization.rows[0].name,"metadata[organization_id]":context.organizationId}));
        customerId=customer.id!;
        await pool.query(`UPDATE billing_subscriptions SET provider_customer_id=$1,updated_at=NOW() WHERE organization_id=$2`,[customerId,context.organizationId]);
      }
      const session=await stripe("checkout/sessions",new URLSearchParams({mode:"subscription",customer:customerId!,"line_items[0][price]":selected.rows[0].stripe_price_id,"line_items[0][quantity]":"1",success_url:`${origin}/billing?checkout=success`,cancel_url:`${origin}/billing?checkout=cancelled`,"metadata[organization_id]":context.organizationId,"metadata[plan_id]":selected.rows[0].id,"subscription_data[metadata][organization_id]":context.organizationId,"subscription_data[metadata][plan_id]":selected.rows[0].id}));
      return NextResponse.json({url:session.url});
    }
    if(action==="portal"){
      if(!customerId)throw new EnterpriseError("No Stripe customer exists for this organization.",409,"stripe_customer_missing");
      const session=await stripe("billing_portal/sessions",new URLSearchParams({customer:customerId,return_url:`${origin}/billing`}));
      return NextResponse.json({url:session.url});
    }
    return NextResponse.json({error:"Billing action not found.",code:"not_found"},{status:404});
  }catch(error){return enterpriseFailure(error);}
}
