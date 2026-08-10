import { NextRequest,NextResponse } from "next/server";
import { enterpriseFailure,shouldUseSecureCookies } from "@/lib/enterprise/http";
import { EnterpriseError,oauthEnterprise } from "@/lib/enterprise/store";
import { createOpaqueToken,sha256,signJwt,verifyJwt } from "@/lib/enterprise/security";

const configs={
  google:{
    authorize:"https://accounts.google.com/o/oauth2/v2/auth",token:"https://oauth2.googleapis.com/token",userinfo:"https://openidconnect.googleapis.com/v1/userinfo",
    clientId:"GOOGLE_CLIENT_ID",clientSecret:"GOOGLE_CLIENT_SECRET",scope:"openid email profile",
  },
  microsoft:{
    authorize:"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",token:"https://login.microsoftonline.com/common/oauth2/v2.0/token",userinfo:"https://graph.microsoft.com/oidc/userinfo",
    clientId:"MICROSOFT_CLIENT_ID",clientSecret:"MICROSOFT_CLIENT_SECRET",scope:"openid email profile",
  },
} as const;

export async function GET(request:NextRequest,{params}:{params:Promise<{provider:string;action:string}>}){
  try{
    const {provider,action}=await params;
    if(!(provider in configs))throw new EnterpriseError("OAuth provider not supported.",404,"oauth_provider_not_found");
    const key=provider as keyof typeof configs,config=configs[key];
    const clientId=process.env[config.clientId],clientSecret=process.env[config.clientSecret];
    if(!clientId||!clientSecret)throw new EnterpriseError(`${provider} OAuth is not configured.`,503,"oauth_unavailable");
    const callback=new URL(`/api/auth/oauth/${provider}/callback`,request.nextUrl.origin).toString();
    if(action==="start"){
      const nonce=createOpaqueToken(24);
      const state=signJwt({sub:"oauth",org:"oauth",sid:"oauth",type:"oauth_state",nonce,redirect:"/"},600);
      const target=new URL(config.authorize);
      target.search=new URLSearchParams({client_id:clientId,redirect_uri:callback,response_type:"code",scope:config.scope,state,nonce,prompt:"select_account"}).toString();
      const response=NextResponse.redirect(target);
      response.cookies.set("revora_oauth_state",sha256(nonce),{httpOnly:true,secure:shouldUseSecureCookies(request),sameSite:"lax",path:`/api/auth/oauth/${provider}`,maxAge:600});
      return response;
    }
    if(action==="callback"){
      const code=request.nextUrl.searchParams.get("code"),state=request.nextUrl.searchParams.get("state");
      if(!code||!state)throw new EnterpriseError("OAuth callback is incomplete.",400,"oauth_callback_invalid");
      const stateClaims=verifyJwt(state,"oauth_state");
      if(!stateClaims.nonce||request.cookies.get("revora_oauth_state")?.value!==sha256(stateClaims.nonce))throw new EnterpriseError("OAuth browser state is invalid.",400,"oauth_state_invalid");
      const tokenResponse=await fetch(config.token,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,code,redirect_uri:callback,grant_type:"authorization_code"})});
      if(!tokenResponse.ok)throw new EnterpriseError("OAuth token exchange failed.",502,"oauth_exchange_failed");
      const token=await tokenResponse.json() as {access_token?:string};
      if(!token.access_token)throw new EnterpriseError("OAuth provider returned no access token.",502,"oauth_exchange_failed");
      const profileResponse=await fetch(config.userinfo,{headers:{Authorization:`Bearer ${token.access_token}`}});
      if(!profileResponse.ok)throw new EnterpriseError("OAuth profile request failed.",502,"oauth_profile_failed");
      const profile=await profileResponse.json() as {sub?:string;email?:string;name?:string};
      if(!profile.sub||!profile.email)throw new EnterpriseError("OAuth profile lacks required identity claims.",409,"oauth_profile_incomplete");
      const session=await oauthEnterprise(request,{provider:key,subject:profile.sub,email:profile.email,displayName:profile.name||profile.email.split("@")[0]});
      const response=NextResponse.redirect(new URL("/",request.nextUrl.origin));
      const secure=shouldUseSecureCookies(request);
      response.cookies.set("revora_access",session.accessToken,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:900});
      response.cookies.set("revora_refresh",session.refreshToken,{httpOnly:true,secure,sameSite:"lax",path:"/",maxAge:2_592_000});
      response.headers.append("Set-Cookie",`revora_refresh=; Path=/api/auth; Max-Age=0; HttpOnly; SameSite=Lax${secure?"; Secure":""}`);
      response.cookies.delete("revora_oauth_state");
      return response;
    }
    throw new EnterpriseError("OAuth action not found.",404,"oauth_action_not_found");
  }catch(error){return enterpriseFailure(error);}
}
