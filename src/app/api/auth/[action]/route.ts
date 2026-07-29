import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { loginSchema,refreshSchema,registrationSchema } from "@/lib/enterprise/contracts";
import { enterpriseFailure,safeJson,shouldUseSecureCookies } from "@/lib/enterprise/http";
import {
  authenticateRequest,loginEnterprise,refreshEnterprise,registerEnterprise,
  revokeSession,requestPasswordReset,confirmPasswordReset,
} from "@/lib/enterprise/store";

export async function POST(request:NextRequest,{params}:{params:Promise<{action:string}>}) {
  try {
    const {action}=await params;
    if(action==="register"||action==="login") {
      const session=action==="register"
        ? await registerEnterprise(request,registrationSchema.parse(await safeJson(request)))
        : await loginEnterprise(request,loginSchema.parse(await safeJson(request)));
      const response=NextResponse.json(session,{status:action==="register"?201:200});
      const secure=shouldUseSecureCookies(request);
      response.cookies.set("revora_access",session.accessToken,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:900});
      response.cookies.set("revora_refresh",session.refreshToken,{httpOnly:true,secure,sameSite:"lax",path:"/api/auth",maxAge:2_592_000});
      return response;
    }
    if(action==="refresh") {
      const body=await safeJson(request).catch(()=>({}));
      const input=refreshSchema.parse({refreshToken:(body as {refreshToken?:string}).refreshToken||request.cookies.get("revora_refresh")?.value});
      const session=await refreshEnterprise(request,input.refreshToken);
      const response=NextResponse.json(session);
      const secure=shouldUseSecureCookies(request);
      response.cookies.set("revora_access",session.accessToken,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:900});
      response.cookies.set("revora_refresh",session.refreshToken,{httpOnly:true,secure,sameSite:"lax",path:"/api/auth",maxAge:2_592_000});
      return response;
    }
    if(action==="logout") {
      const context=await authenticateRequest(request);
      if(context.sessionId) await revokeSession(context,context.sessionId);
      const response=NextResponse.json({success:true});
      response.cookies.delete("revora_access");response.cookies.delete("revora_refresh");
      return response;
    }
    if(action==="password-reset-request") {
      if(!process.env.RESEND_API_KEY||!process.env.AUTH_EMAIL_FROM||!process.env.APP_URL) {
        return NextResponse.json({error:"Password reset delivery is not configured.",code:"reset_delivery_unavailable"},{status:503});
      }
      const {email}=z.object({email:z.string().email().max(320)}).strict().parse(await safeJson(request));
      const reset=await requestPasswordReset(email);
      if(reset) {
        const response=await fetch("https://api.resend.com/emails",{
          method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},
          body:JSON.stringify({from:process.env.AUTH_EMAIL_FROM,to:[reset.email],subject:"Reset your EcoScale Partner password",html:`<p>A password reset was requested for your EcoScale Partner account.</p><p><a href="${process.env.APP_URL}/login?reset=${encodeURIComponent(reset.token)}">Reset password</a></p><p>This link expires in 30 minutes.</p>`}),
        });
        if(!response.ok)return NextResponse.json({error:"Password reset delivery failed.",code:"reset_delivery_failed"},{status:502});
      }
      return NextResponse.json({success:true,message:"If an active account exists, reset instructions were sent."});
    }
    if(action==="password-reset-confirm") {
      const input=z.object({token:z.string().min(32).max(500),password:z.string().min(12).max(200)}).strict().parse(await safeJson(request));
      await confirmPasswordReset(input.token,input.password);
      return NextResponse.json({success:true});
    }
    return NextResponse.json({error:"Authentication action not found.",code:"not_found"},{status:404});
  } catch(error) { return enterpriseFailure(error); }
}
