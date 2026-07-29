import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { pool } from "@/lib/postgres";
import {
  type Permission, type SystemRole, accountCreateSchema, apiKeyCreateSchema,
  jobCreateSchema, opportunityCreateSchema, stageChangeSchema, taskCreateSchema,
  activityCreateSchema,noteCreateSchema,calendarCreateSchema,
  usageCreateSchema,
} from "./contracts";
import { roleAllows, rolePermissions } from "./permissions";
import {
  createOpaqueToken, hashPassword, requestFingerprint, sha256, signJwt,
  verifyJwt, verifyPassword, createTotpSecret, encryptSecret, decryptSecret, verifyTotp,
} from "./security";

export class EnterpriseError extends Error {
  constructor(message: string, public status = 400, public code = "enterprise_error") { super(message); }
}

export type AuthContext = {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: SystemRole;
  sessionId?: string;
  apiKeyId?: string;
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,70) || "workspace";
}

async function audit(client: PoolClient, context: Partial<AuthContext>, action: string, outcome: "success"|"denied"|"failure", resourceType?: string, resourceId?: string) {
  await client.query(
    `INSERT INTO enterprise_audit_logs(id,organization_id,actor_type,actor_id,action,resource_type,resource_id,outcome,correlation_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [randomUUID(),context.organizationId||null,context.apiKeyId?"api_key":context.userId?"user":"system",context.apiKeyId||context.userId||null,action,resourceType||null,resourceId||null,outcome,randomUUID()],
  );
}

async function seedOrganizationRoles(client: PoolClient, organizationId: string) {
  const entries = Object.entries(rolePermissions) as [SystemRole,readonly Permission[]][];
  for (const [code,allowed] of entries) {
    const id = randomUUID();
    const role = await client.query(
      `INSERT INTO enterprise_roles(id,organization_id,code,name,is_system)
       VALUES($1,$2,$3,$4,TRUE) RETURNING id`,
      [id,organizationId,code,code[0].toUpperCase()+code.slice(1)],
    );
    for (const permission of allowed) {
      await client.query(`INSERT INTO enterprise_role_permissions(role_id,permission_code) VALUES($1,$2)`,[role.rows[0].id,permission]);
    }
  }
}

async function seedDefaultPipeline(client:PoolClient,organizationId:string,workspaceId:string){
  const pipelineId=randomUUID();
  await client.query(`INSERT INTO crm_pipelines(id,organization_id,workspace_id,name,is_default) VALUES($1,$2,$3,'Primary pipeline',TRUE)`,[pipelineId,organizationId,workspaceId]);
  const stages=[["Qualified",1000,false,false],["Discovery",2500,false,false],["Proposal",5000,false,false],["Negotiation",7500,false,false],["Won",10000,true,true],["Lost",0,true,false]] as const;
  for(let index=0;index<stages.length;index++){const [name,probability,closed,won]=stages[index];await client.query(`INSERT INTO crm_pipeline_stages(id,pipeline_id,name,position,probability_basis_points,is_closed,is_won) VALUES($1,$2,$3,$4,$5,$6,$7)`,[randomUUID(),pipelineId,name,index+1,probability,closed,won]);}
}

async function createSession(client: PoolClient, request: Request, userId: string, organizationId: string) {
  const id = randomUUID();
  const refreshToken = createOpaqueToken(48);
  const fingerprint = requestFingerprint(request);
  await client.query(
    `INSERT INTO enterprise_device_sessions(id,user_id,organization_id,refresh_token_hash,user_agent_hash,ip_hash,expires_at)
     VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '30 days')`,
    [id,userId,organizationId,sha256(refreshToken),fingerprint.userAgentHash,fingerprint.ipHash],
  );
  return {accessToken:signJwt({sub:userId,org:organizationId,sid:id,type:"access"}),refreshToken,expiresIn:900,sessionId:id};
}

export async function registerEnterprise(request: Request, input: {email:string;password:string;displayName:string;organizationName:string}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const normalized = input.email.trim().toLowerCase();
    if ((await client.query(`SELECT 1 FROM enterprise_users WHERE normalized_email=$1`,[normalized])).rowCount) {
      throw new EnterpriseError("An account already exists for this email.",409,"email_exists");
    }
    const userId = randomUUID();
    const organizationId = randomUUID();
    const workspaceId = randomUUID();
    await client.query(
      `INSERT INTO enterprise_users(id,email,normalized_email,display_name,password_hash)
       VALUES($1,$2,$3,$4,$5)`,
      [userId,input.email.trim(),normalized,input.displayName,await hashPassword(input.password)],
    );
    const baseSlug = slugify(input.organizationName);
    const slug = `${baseSlug}-${organizationId.slice(0,8)}`;
    await client.query(
      `INSERT INTO enterprise_organizations(id,name,slug,created_by) VALUES($1,$2,$3,$4)`,
      [organizationId,input.organizationName,slug,userId],
    );
    await client.query(
      `INSERT INTO enterprise_workspaces(id,organization_id,name,slug) VALUES($1,$2,'Primary','primary')`,
      [workspaceId,organizationId],
    );
    await seedDefaultPipeline(client,organizationId,workspaceId);
    await seedOrganizationRoles(client,organizationId);
    const ownerRole = await client.query(`SELECT id FROM enterprise_roles WHERE organization_id=$1 AND code='owner'`,[organizationId]);
    const membershipId = randomUUID();
    await client.query(
      `INSERT INTO enterprise_memberships(id,organization_id,user_id,role_id) VALUES($1,$2,$3,$4)`,
      [membershipId,organizationId,userId,ownerRole.rows[0].id],
    );
    const starter = await client.query(`SELECT id FROM billing_plans WHERE code='starter'`);
    await client.query(
      `INSERT INTO billing_subscriptions(id,organization_id,plan_id,status) VALUES($1,$2,$3,'active')`,
      [randomUUID(),organizationId,starter.rows[0].id],
    );
    const session = await createSession(client,request,userId,organizationId);
    await audit(client,{userId,organizationId,membershipId,role:"owner"},"auth.register","success","organization",organizationId);
    await client.query("COMMIT");
    return {user:{id:userId,email:input.email.trim(),displayName:input.displayName},organization:{id:organizationId,name:input.organizationName,slug},workspaceId,...session};
  } catch (error) {
    await client.query("ROLLBACK");
    await audit(client,{},"auth.register","failure");
    throw error;
  } finally { client.release(); }
}

export async function loginEnterprise(request: Request, input: {email:string;password:string;mfaCode?:string}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT u.id,u.email,u.display_name AS "displayName",u.password_hash,u.status,m.organization_id,m.id AS membership_id,r.code AS role
       FROM enterprise_users u JOIN enterprise_memberships m ON m.user_id=u.id AND m.status='active'
       JOIN enterprise_roles r ON r.id=m.role_id
       WHERE u.normalized_email=$1 ORDER BY m.joined_at LIMIT 1`,
      [input.email.trim().toLowerCase()],
    );
    const row = result.rows[0];
    if (!row || row.status!=="active" || !row.password_hash || !(await verifyPassword(input.password,row.password_hash))) {
      throw new EnterpriseError("Invalid credentials.",401,"invalid_credentials");
    }
    const factor = await client.query(`SELECT encrypted_secret FROM enterprise_mfa_factors WHERE user_id=$1 AND verified_at IS NOT NULL AND disabled_at IS NULL LIMIT 1`,[row.id]);
    if (factor.rowCount && !input.mfaCode) throw new EnterpriseError("MFA code required.",401,"mfa_required");
    if (factor.rowCount) {
      const {decryptSecret,verifyTotp} = await import("./security");
      if (!verifyTotp(decryptSecret(factor.rows[0].encrypted_secret),input.mfaCode!)) throw new EnterpriseError("Invalid MFA code.",401,"invalid_mfa");
    }
    const session = await createSession(client,request,row.id,row.organization_id);
    await client.query(`UPDATE enterprise_users SET last_login_at=NOW(),updated_at=NOW() WHERE id=$1`,[row.id]);
    await audit(client,{userId:row.id,organizationId:row.organization_id,membershipId:row.membership_id,role:row.role},"auth.login","success");
    await client.query("COMMIT");
    return {user:{id:row.id,email:row.email,displayName:row.displayName},organizationId:row.organization_id,...session};
  } catch (error) {
    await client.query("ROLLBACK");
    await audit(client,{},"auth.login","failure");
    throw error;
  } finally { client.release(); }
}

export async function refreshEnterprise(request: Request, refreshToken: string) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id,user_id,organization_id FROM enterprise_device_sessions
       WHERE refresh_token_hash=$1 AND revoked_at IS NULL AND expires_at>NOW() FOR UPDATE`,
      [sha256(refreshToken)],
    );
    if (!result.rowCount) throw new EnterpriseError("Refresh token is invalid or expired.",401,"invalid_refresh_token");
    await client.query(`UPDATE enterprise_device_sessions SET revoked_at=NOW() WHERE id=$1`,[result.rows[0].id]);
    const session = await createSession(client,request,result.rows[0].user_id,result.rows[0].organization_id);
    await client.query("COMMIT");
    return session;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function oauthEnterprise(request: Request, profile: {provider:"google"|"microsoft";subject:string;email:string;displayName:string}) {
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const normalized=profile.email.trim().toLowerCase();
    let user=(await client.query(
      `SELECT u.id,u.email,u.display_name FROM enterprise_auth_identities i JOIN enterprise_users u ON u.id=i.user_id WHERE i.provider=$1 AND i.provider_subject=$2`,
      [profile.provider,profile.subject],
    )).rows[0];
    if(!user) user=(await client.query(`SELECT id,email,display_name FROM enterprise_users WHERE normalized_email=$1`,[normalized])).rows[0];
    if(!user) {
      user={id:randomUUID(),email:profile.email,display_name:profile.displayName};
      await client.query(`INSERT INTO enterprise_users(id,email,normalized_email,display_name,email_verified_at) VALUES($1,$2,$3,$4,NOW())`,[user.id,profile.email,normalized,profile.displayName]);
      const orgId=randomUUID();
      await client.query(`INSERT INTO enterprise_organizations(id,name,slug,created_by) VALUES($1,$2,$3,$4)`,[orgId,`${profile.displayName}'s organization`,`${slugify(profile.displayName)}-${orgId.slice(0,8)}`,user.id]);
      const workspaceId=randomUUID();
      await client.query(`INSERT INTO enterprise_workspaces(id,organization_id,name,slug) VALUES($1,$2,'Primary','primary')`,[workspaceId,orgId]);
      await seedDefaultPipeline(client,orgId,workspaceId);
      await seedOrganizationRoles(client,orgId);
      const role=await client.query(`SELECT id FROM enterprise_roles WHERE organization_id=$1 AND code='owner'`,[orgId]);
      await client.query(`INSERT INTO enterprise_memberships(id,organization_id,user_id,role_id) VALUES($1,$2,$3,$4)`,[randomUUID(),orgId,user.id,role.rows[0].id]);
      const starter=await client.query(`SELECT id FROM billing_plans WHERE code='starter'`);
      await client.query(`INSERT INTO billing_subscriptions(id,organization_id,plan_id,status) VALUES($1,$2,$3,'active')`,[randomUUID(),orgId,starter.rows[0].id]);
    }
    await client.query(
      `INSERT INTO enterprise_auth_identities(id,user_id,provider,provider_subject,provider_email)
       VALUES($1,$2,$3,$4,$5) ON CONFLICT(provider,provider_subject) DO NOTHING`,
      [randomUUID(),user.id,profile.provider,profile.subject,profile.email],
    );
    const membership=await client.query(`SELECT organization_id FROM enterprise_memberships WHERE user_id=$1 AND status='active' ORDER BY joined_at LIMIT 1`,[user.id]);
    const session=await createSession(client,request,user.id,membership.rows[0].organization_id);
    await client.query("COMMIT");
    return {user:{id:user.id,email:user.email,displayName:user.display_name},organizationId:membership.rows[0].organization_id,...session};
  } catch(error){await client.query("ROLLBACK");throw error;} finally{client.release();}
}

export async function beginMfa(context: AuthContext) {
  const secret=createTotpSecret(),id=randomUUID();
  await pool.query(`UPDATE enterprise_mfa_factors SET disabled_at=NOW() WHERE user_id=$1 AND disabled_at IS NULL`,[context.userId]);
  await pool.query(`INSERT INTO enterprise_mfa_factors(id,user_id,encrypted_secret) VALUES($1,$2,$3)`,[id,context.userId,encryptSecret(secret)]);
  const user=await pool.query(`SELECT email FROM enterprise_users WHERE id=$1`,[context.userId]);
  return {factorId:id,secret,otpauthUri:`otpauth://totp/EcoScale%20Partner:${encodeURIComponent(user.rows[0].email)}?secret=${secret}&issuer=EcoScale%20Partner&digits=6&period=30`};
}

export async function confirmMfa(context: AuthContext, factorId: string, code: string) {
  const result=await pool.query(`SELECT encrypted_secret FROM enterprise_mfa_factors WHERE id=$1 AND user_id=$2 AND verified_at IS NULL AND disabled_at IS NULL`,[factorId,context.userId]);
  if(!result.rowCount||!verifyTotp(decryptSecret(result.rows[0].encrypted_secret),code))throw new EnterpriseError("MFA code is invalid.",400,"invalid_mfa");
  await pool.query(`UPDATE enterprise_mfa_factors SET verified_at=NOW() WHERE id=$1`,[factorId]);
}

export async function requestPasswordReset(email: string) {
  const user=await pool.query(`SELECT id,email FROM enterprise_users WHERE normalized_email=$1 AND status='active'`,[email.trim().toLowerCase()]);
  if(!user.rowCount)return null;
  const token=createOpaqueToken(48);
  await pool.query(`INSERT INTO enterprise_password_reset_tokens(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL '30 minutes')`,[randomUUID(),user.rows[0].id,sha256(token)]);
  return {email:user.rows[0].email,token};
}

export async function confirmPasswordReset(token: string, password: string) {
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const result=await client.query(`SELECT id,user_id FROM enterprise_password_reset_tokens WHERE token_hash=$1 AND consumed_at IS NULL AND expires_at>NOW() FOR UPDATE`,[sha256(token)]);
    if(!result.rowCount)throw new EnterpriseError("Reset token is invalid or expired.",400,"invalid_reset_token");
    await client.query(`UPDATE enterprise_users SET password_hash=$1,updated_at=NOW() WHERE id=$2`,[await hashPassword(password),result.rows[0].user_id]);
    await client.query(`UPDATE enterprise_password_reset_tokens SET consumed_at=NOW() WHERE id=$1`,[result.rows[0].id]);
    await client.query(`UPDATE enterprise_device_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL`,[result.rows[0].user_id]);
    await client.query("COMMIT");
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}

function bearer(request: Request) {
  const value = request.headers.get("authorization");
  if(value?.startsWith("Bearer "))return value.slice(7);
  const cookie=request.headers.get("cookie")?.split(";").map(part=>part.trim()).find(part=>part.startsWith("revora_access="));
  return cookie ? decodeURIComponent(cookie.slice("revora_access=".length)) : null;
}

export async function authenticateRequest(request: Request): Promise<AuthContext> {
  const token = bearer(request);
  if (!token) throw new EnterpriseError("Authentication required.",401,"authentication_required");
  if (token.startsWith("rvk_")) {
    const result = await pool.query(
      `SELECT k.id,k.organization_id,k.permissions,k.created_by,m.id AS membership_id,r.code AS role
       FROM enterprise_api_keys k
       JOIN enterprise_memberships m ON m.organization_id=k.organization_id AND m.user_id=k.created_by AND m.status='active'
       JOIN enterprise_roles r ON r.id=m.role_id
       WHERE k.key_hash=$1 AND k.revoked_at IS NULL AND (k.expires_at IS NULL OR k.expires_at>NOW())`,
      [sha256(token)],
    );
    if (!result.rowCount) throw new EnterpriseError("API key is invalid or expired.",401,"invalid_api_key");
    await pool.query(`UPDATE enterprise_api_keys SET last_used_at=NOW() WHERE id=$1`,[result.rows[0].id]);
    return {userId:result.rows[0].created_by,organizationId:result.rows[0].organization_id,membershipId:result.rows[0].membership_id,role:result.rows[0].role,apiKeyId:result.rows[0].id};
  }
  let claims;
  try { claims=verifyJwt(token); } catch { throw new EnterpriseError("Access token is invalid or expired.",401,"invalid_access_token"); }
  const result = await pool.query(
    `SELECT m.id AS membership_id,r.code AS role
     FROM enterprise_device_sessions s JOIN enterprise_memberships m ON m.user_id=s.user_id AND m.organization_id=s.organization_id AND m.status='active'
     JOIN enterprise_roles r ON r.id=m.role_id
     WHERE s.id=$1 AND s.user_id=$2 AND s.organization_id=$3 AND s.revoked_at IS NULL AND s.expires_at>NOW()`,
    [claims.sid,claims.sub,claims.org],
  );
  if (!result.rowCount) throw new EnterpriseError("Session is no longer active.",401,"inactive_session");
  return {userId:claims.sub,organizationId:claims.org,membershipId:result.rows[0].membership_id,role:result.rows[0].role,sessionId:claims.sid};
}

export async function requirePermission(request: Request, permission: Permission) {
  const context = await authenticateRequest(request);
  if (!roleAllows(context.role,permission)) {
    const client = await pool.connect();
    try { await audit(client,context,permission,"denied"); } finally { client.release(); }
    throw new EnterpriseError("Permission denied.",403,"permission_denied");
  }
  if (context.apiKeyId) {
    const result = await pool.query(`SELECT permissions FROM enterprise_api_keys WHERE id=$1`,[context.apiKeyId]);
    if (!(result.rows[0]?.permissions as string[]).includes(permission)) throw new EnterpriseError("API key lacks permission.",403,"api_key_permission_denied");
  }
  return context;
}

export async function requireLegacyDatasetAccess(context: AuthContext) {
  const client = await pool.connect();
  let denied = false;
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO platform_legacy_dataset_owner(singleton,organization_id,claimed_by)
       VALUES(TRUE,$1,$2) ON CONFLICT(singleton) DO NOTHING`,
      [context.organizationId, context.userId],
    );
    const owner = await client.query(
      "SELECT organization_id FROM platform_legacy_dataset_owner WHERE singleton=TRUE FOR SHARE",
    );
    if (owner.rows[0]?.organization_id !== context.organizationId) {
      await audit(client,context,"legacy.dataset.access","denied","legacy_dataset","singleton");
      denied = true;
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  if (denied) {
    throw new EnterpriseError(
      "This organization does not own the quarantined legacy dataset.",
      403,
      "legacy_dataset_access_denied",
    );
  }
}

export async function listSessions(context: AuthContext) {
  const result = await pool.query(
    `SELECT id,user_agent_hash AS "userAgentHash",ip_hash AS "ipHash",expires_at AS "expiresAt",last_seen_at AS "lastSeenAt",created_at AS "createdAt"
     FROM enterprise_device_sessions WHERE user_id=$1 AND revoked_at IS NULL AND expires_at>NOW() ORDER BY last_seen_at DESC`,
    [context.userId],
  );
  return result.rows;
}

export async function revokeSession(context: AuthContext, sessionId: string) {
  const result = await pool.query(`UPDATE enterprise_device_sessions SET revoked_at=NOW() WHERE id=$1 AND user_id=$2 AND revoked_at IS NULL RETURNING id`,[sessionId,context.userId]);
  if (!result.rowCount) throw new EnterpriseError("Session not found.",404,"session_not_found");
}

export async function createApiKey(context: AuthContext, raw: unknown) {
  const input = apiKeyCreateSchema.parse(raw);
  for (const permission of input.permissions) if (!roleAllows(context.role,permission)) throw new EnterpriseError("Cannot grant a permission you do not hold.",403,"permission_escalation");
  const secret = `rvk_${createOpaqueToken(36)}`;
  const id = randomUUID();
  await pool.query(
    `INSERT INTO enterprise_api_keys(id,organization_id,created_by,name,key_prefix,key_hash,permissions,expires_at)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id,context.organizationId,context.userId,input.name,secret.slice(0,12),sha256(secret),JSON.stringify(input.permissions),input.expiresAt],
  );
  return {id,name:input.name,key:secret,prefix:secret.slice(0,12),permissions:input.permissions,expiresAt:input.expiresAt};
}

export async function listResource(context: AuthContext, resource: string) {
  const queries: Record<string,{sql:string;params?:unknown[]}> = {
    accounts:{sql:`SELECT a.id,a.business_id::int AS "businessId",b.name,b.domain,a.status,a.updated_at AS "updatedAt" FROM crm_accounts a JOIN businesses b ON b.id=a.business_id WHERE a.organization_id=$1 ORDER BY a.updated_at DESC`,params:[context.organizationId]},
    contacts:{sql:`SELECT c.id::int AS id,c.business_id::int AS "businessId",c.name,c.role,c.email,c.status,c.created_at AS "createdAt" FROM contacts c JOIN crm_accounts a ON a.business_id=c.business_id WHERE a.organization_id=$1 ORDER BY c.created_at DESC`,params:[context.organizationId]},
    opportunities:{sql:`SELECT o.id,o.title,o.amount_minor::int AS "amountMinor",o.currency,o.expected_close_date AS "expectedCloseDate",o.version,s.name AS "stage",a.business_id::int AS "businessId",o.updated_at AS "updatedAt" FROM crm_opportunities o JOIN crm_pipeline_stages s ON s.id=o.stage_id JOIN crm_accounts a ON a.id=o.account_id WHERE o.organization_id=$1 ORDER BY o.updated_at DESC`,params:[context.organizationId]},
    tasks:{sql:`SELECT id,title,description,status,priority,due_at AS "dueAt",completed_at AS "completedAt",updated_at AS "updatedAt" FROM crm_tasks WHERE organization_id=$1 ORDER BY due_at NULLS LAST,created_at DESC`,params:[context.organizationId]},
    activities:{sql:`SELECT id,account_id AS "accountId",opportunity_id AS "opportunityId",contact_id::int AS "contactId",activity_type AS "activityType",subject,body,occurred_at AS "occurredAt" FROM crm_activities WHERE organization_id=$1 ORDER BY occurred_at DESC LIMIT 200`,params:[context.organizationId]},
    notes:{sql:`SELECT id,account_id AS "accountId",opportunity_id AS "opportunityId",body,created_at AS "createdAt",updated_at AS "updatedAt" FROM crm_notes WHERE organization_id=$1 ORDER BY updated_at DESC`,params:[context.organizationId]},
    calendar:{sql:`SELECT id,title,starts_at AS "startsAt",ends_at AS "endsAt",timezone,location FROM crm_calendar_events WHERE organization_id=$1 ORDER BY starts_at`,params:[context.organizationId]},
    forecast:{sql:`SELECT period_start AS "periodStart",period_end AS "periodEnd",currency,open_amount_minor::int AS "openAmountMinor",weighted_amount_minor::int AS "weightedAmountMinor",won_amount_minor::int AS "wonAmountMinor",calculated_at AS "calculatedAt" FROM crm_forecast_snapshots WHERE organization_id=$1 ORDER BY calculated_at DESC LIMIT 24`,params:[context.organizationId]},
    pipeline:{sql:`SELECT p.id,p.name,s.id AS "stageId",s.name AS "stageName",s.position,s.probability_basis_points AS "probabilityBasisPoints",COUNT(o.id)::int AS "opportunityCount" FROM crm_pipelines p JOIN crm_pipeline_stages s ON s.pipeline_id=p.id LEFT JOIN crm_opportunities o ON o.stage_id=s.id WHERE p.organization_id=$1 GROUP BY p.id,s.id ORDER BY p.name,s.position`,params:[context.organizationId]},
    "suggested-actions":{sql:`SELECT id,account_id AS "accountId",opportunity_id AS "opportunityId",action_type AS "actionType",rationale,evidence_refs AS "evidenceRefs",status,created_at AS "createdAt" FROM crm_suggested_actions WHERE organization_id=$1 ORDER BY created_at DESC`,params:[context.organizationId]},
  };
  const query = queries[resource];
  if (!query) throw new EnterpriseError("Resource not found.",404,"resource_not_found");
  return (await pool.query(query.sql,query.params)).rows;
}

export async function createResource(context: AuthContext, resource: string, raw: unknown) {
  if (resource==="accounts") {
    const input=accountCreateSchema.parse(raw); const id=randomUUID();
    const result=await pool.query(
      `INSERT INTO crm_accounts(id,organization_id,workspace_id,business_id,owner_membership_id)
       SELECT $1,$2,$3,b.id,$4 FROM businesses b WHERE b.id=$5
       ON CONFLICT(organization_id,business_id) DO NOTHING RETURNING id`,
      [id,context.organizationId,input.workspaceId,input.ownerMembershipId,input.businessId],
    );
    if (!result.rowCount) throw new EnterpriseError("Business not found or account already exists.",409,"account_conflict");
    return {id};
  }
  if (resource==="opportunities") {
    const input=opportunityCreateSchema.parse(raw); const id=randomUUID();
    await pool.query(
      `INSERT INTO crm_opportunities(id,organization_id,workspace_id,account_id,pipeline_id,stage_id,owner_membership_id,title,amount_minor,currency,expected_close_date,source_context,source_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [id,context.organizationId,input.workspaceId,input.accountId,input.pipelineId,input.stageId,input.ownerMembershipId,input.title,input.amountMinor,input.currency,input.expectedCloseDate,input.sourceContext,input.sourceId],
    );
    await appendCrmEvent(context,"opportunity",id,1,"crm.opportunity-created.v1",{stageId:input.stageId});
    return {id,version:1};
  }
  if (resource==="tasks") {
    const input=taskCreateSchema.parse(raw); const id=randomUUID();
    await pool.query(
      `INSERT INTO crm_tasks(id,organization_id,workspace_id,account_id,opportunity_id,assignee_membership_id,title,description,priority,due_at,created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id,context.organizationId,input.workspaceId,input.accountId,input.opportunityId,input.assigneeMembershipId,input.title,input.description,input.priority,input.dueAt,context.userId],
    );
    return {id};
  }
  if(resource==="activities"){
    const input=activityCreateSchema.parse(raw),id=randomUUID();
    await pool.query(`INSERT INTO crm_activities(id,organization_id,account_id,opportunity_id,contact_id,activity_type,subject,body,occurred_at,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[id,context.organizationId,input.accountId,input.opportunityId,input.contactId,input.activityType,input.subject,input.body,input.occurredAt,context.userId]);
    return {id};
  }
  if(resource==="notes"){
    const input=noteCreateSchema.parse(raw),id=randomUUID();
    await pool.query(`INSERT INTO crm_notes(id,organization_id,account_id,opportunity_id,body,created_by) VALUES($1,$2,$3,$4,$5,$6)`,[id,context.organizationId,input.accountId,input.opportunityId,input.body,context.userId]);
    return {id};
  }
  if(resource==="calendar"){
    const input=calendarCreateSchema.parse(raw),id=randomUUID();
    await pool.query(`INSERT INTO crm_calendar_events(id,organization_id,workspace_id,account_id,opportunity_id,title,starts_at,ends_at,timezone,location,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,[id,context.organizationId,input.workspaceId,input.accountId,input.opportunityId,input.title,input.startsAt,input.endsAt,input.timezone,input.location,context.userId]);
    return {id};
  }
  throw new EnterpriseError("Resource does not support creation.",405,"method_not_allowed");
}

async function appendCrmEvent(context: AuthContext, aggregateType: string, aggregateId: string, version: number, eventType: string, data: Record<string,unknown>) {
  const correlationId=randomUUID(); const eventId=randomUUID();
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO crm_events(id,organization_id,aggregate_type,aggregate_id,aggregate_version,event_type,actor_type,actor_id,correlation_id,data)
       VALUES($1,$2,$3,$4,$5,$6,'user',$7,$8,$9)`,
      [eventId,context.organizationId,aggregateType,aggregateId,version,eventType,context.userId,correlationId,JSON.stringify(data)],
    );
    await client.query(
      `INSERT INTO platform_outbox(id,organization_id,event_type,aggregate_type,aggregate_id,aggregate_version,correlation_id,payload)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
      [eventId,context.organizationId,eventType,aggregateType,aggregateId,version,correlationId,JSON.stringify(data)],
    );
    await client.query("COMMIT");
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function changeOpportunityStage(context: AuthContext, opportunityId: string, raw: unknown) {
  const input=stageChangeSchema.parse(raw); const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const current=await client.query(`SELECT stage_id,version FROM crm_opportunities WHERE id=$1 AND organization_id=$2 FOR UPDATE`,[opportunityId,context.organizationId]);
    if (!current.rowCount) throw new EnterpriseError("Opportunity not found.",404,"opportunity_not_found");
    if (current.rows[0].version!==input.expectedVersion) throw new EnterpriseError("Opportunity version conflict.",409,"version_conflict");
    const stage=await client.query(`SELECT 1 FROM crm_pipeline_stages s JOIN crm_opportunities o ON o.pipeline_id=s.pipeline_id WHERE s.id=$1 AND o.id=$2`,[input.stageId,opportunityId]);
    if (!stage.rowCount) throw new EnterpriseError("Stage does not belong to this opportunity pipeline.",409,"invalid_stage");
    const next=input.expectedVersion+1;
    await client.query(`UPDATE crm_opportunities SET stage_id=$1,version=$2,updated_at=NOW() WHERE id=$3`,[input.stageId,next,opportunityId]);
    await client.query(
      `INSERT INTO crm_opportunity_stage_history(id,opportunity_id,from_stage_id,to_stage_id,changed_by,reason) VALUES($1,$2,$3,$4,$5,$6)`,
      [randomUUID(),opportunityId,current.rows[0].stage_id,input.stageId,context.userId,input.reason],
    );
    const eventId=randomUUID(),correlationId=randomUUID(),data=JSON.stringify({fromStageId:current.rows[0].stage_id,toStageId:input.stageId,reason:input.reason});
    await client.query(`INSERT INTO crm_events(id,organization_id,aggregate_type,aggregate_id,aggregate_version,event_type,actor_type,actor_id,correlation_id,data) VALUES($1,$2,'opportunity',$3,$4,'crm.stage-changed.v1','user',$5,$6,$7)`,[eventId,context.organizationId,opportunityId,next,context.userId,correlationId,data]);
    await client.query(`INSERT INTO platform_outbox(id,organization_id,event_type,aggregate_type,aggregate_id,aggregate_version,correlation_id,payload) VALUES($1,$2,'crm.stage-changed.v1','opportunity',$3,$4,$5,$6)`,[eventId,context.organizationId,opportunityId,next,correlationId,data]);
    await client.query("COMMIT");
    return {id:opportunityId,version:next,stageId:input.stageId};
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function listBilling(context: AuthContext) {
  const [plans,subscription,usage,invoices]=await Promise.all([
    pool.query(`SELECT code,name,monthly_price_minor::int AS "monthlyPriceMinor",currency,included_credits::int AS "includedCredits",limits FROM billing_plans WHERE active ORDER BY monthly_price_minor`),
    pool.query(`SELECT s.status,p.code AS plan,s.period_start AS "periodStart",s.period_end AS "periodEnd",s.cancel_at_period_end AS "cancelAtPeriodEnd" FROM billing_subscriptions s JOIN billing_plans p ON p.id=s.plan_id WHERE s.organization_id=$1`,[context.organizationId]),
    pool.query(`SELECT metric,SUM(quantity)::int AS quantity FROM billing_usage_ledger WHERE organization_id=$1 GROUP BY metric`,[context.organizationId]),
    pool.query(`SELECT status,currency,total_minor::int AS "totalMinor",hosted_invoice_url AS "hostedInvoiceUrl",issued_at AS "issuedAt" FROM billing_invoices WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 24`,[context.organizationId]),
  ]);
  return {plans:plans.rows,subscription:subscription.rows[0]||null,usage:usage.rows,invoices:invoices.rows};
}

export async function recordUsage(context: AuthContext, raw: unknown) {
  const input=usageCreateSchema.parse(raw); const id=randomUUID();
  const result=await pool.query(
    `INSERT INTO billing_usage_ledger(id,organization_id,metric,quantity,idempotency_key,source_context,source_id)
     VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(organization_id,idempotency_key) DO NOTHING RETURNING id`,
    [id,context.organizationId,input.metric,input.quantity,input.idempotencyKey,input.sourceContext,input.sourceId],
  );
  return {id:result.rows[0]?.id||null,duplicate:!result.rowCount};
}

export async function listJobs(context: AuthContext) {
  return (await pool.query(`SELECT id,queue,job_type AS "jobType",status,priority,attempts,max_attempts AS "maxAttempts",available_at AS "availableAt",created_at AS "createdAt" FROM platform_jobs WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 200`,[context.organizationId])).rows;
}

export async function createJob(context: AuthContext, raw: unknown) {
  const input=jobCreateSchema.parse(raw); const id=randomUUID();
  const result=await pool.query(
    `INSERT INTO platform_jobs(id,organization_id,queue,job_type,priority,payload,idempotency_key,max_attempts,available_at,correlation_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,NOW()),$10)
     ON CONFLICT(organization_id,idempotency_key) DO NOTHING RETURNING id,status`,
    [id,context.organizationId,input.queue,input.jobType,input.priority,JSON.stringify(input.payload),input.idempotencyKey,input.maxAttempts,input.availableAt||null,randomUUID()],
  );
  return result.rows[0]||{id:null,status:"duplicate"};
}

export async function claimJobs(workerId: string, queue: string, limit = 10) {
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const result=await client.query(
      `WITH candidates AS (
         SELECT id FROM platform_jobs
         WHERE queue=$1 AND status IN ('queued','waiting') AND available_at<=NOW()
           AND (lease_expires_at IS NULL OR lease_expires_at<NOW())
         ORDER BY priority,available_at FOR UPDATE SKIP LOCKED LIMIT $2
       )
       UPDATE platform_jobs j SET status='running',locked_at=NOW(),locked_by=$3,
         lease_expires_at=NOW()+INTERVAL '5 minutes',started_at=COALESCE(started_at,NOW()),
         attempts=attempts+1,updated_at=NOW()
       FROM candidates c WHERE j.id=c.id RETURNING j.*`,
      [queue,Math.max(1,Math.min(limit,25)),workerId],
    );
    await client.query("COMMIT");
    return result.rows;
  } catch(error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function finishJob(workerId:string,jobId:string,input:{outcome:"succeeded"|"retry"|"failed";safeErrorCode?:string;safeErrorMessage?:string}) {
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const current=await client.query(`SELECT attempts,max_attempts FROM platform_jobs WHERE id=$1 AND status='running' AND locked_by=$2 AND lease_expires_at>NOW() FOR UPDATE`,[jobId,workerId]);
    if(!current.rowCount)throw new EnterpriseError("Active job lease not found.",409,"job_lease_not_found");
    const exhausted=current.rows[0].attempts>=current.rows[0].max_attempts;
    const status=input.outcome==="succeeded"?"succeeded":input.outcome==="retry"&&!exhausted?"waiting":exhausted?"dead_lettered":"failed";
    await client.query(
      `UPDATE platform_jobs SET status=$1,locked_at=NULL,locked_by=NULL,lease_expires_at=NULL,
       available_at=CASE WHEN $1='waiting' THEN NOW()+(INTERVAL '1 minute'*POWER(2,attempts)) ELSE available_at END,
       last_error_code=$2,last_error_message=$3,completed_at=CASE WHEN $1 IN ('succeeded','failed','dead_lettered') THEN NOW() ELSE NULL END,updated_at=NOW()
       WHERE id=$4`,
      [status,input.safeErrorCode||null,input.safeErrorMessage?.slice(0,1000)||null,jobId],
    );
    await client.query("COMMIT");return {id:jobId,status};
  }catch(error){await client.query("ROLLBACK");throw error;}finally{client.release();}
}
