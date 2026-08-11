import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
process.env.AUTH_JWT_SECRET="phase7-test-jwt-secret-value-at-least-32-characters";
process.env.AUTH_ENCRYPTION_KEY="phase7-test-encryption-key-at-least-32-characters";
const contracts=await import("../src/lib/enterprise/contracts.ts");
const permissions=await import("../src/lib/enterprise/permissions.ts");
const security=await import("../src/lib/enterprise/security.ts");
let assertions=0;
function check(value,message){assert.ok(value,message);assertions++;}

check(contracts.systemRoles.length===6,"six system roles");
for(const role of contracts.systemRoles)check(Array.isArray(permissions.rolePermissions[role]),`${role} permissions exist`);
for(const permission of contracts.permissions)check(permissions.roleAllows("owner",permission),`owner has ${permission}`);
check(!permissions.roleAllows("viewer","crm.write"),"viewer cannot write CRM");
check(!permissions.roleAllows("sales","billing.manage"),"sales cannot manage billing");
check(permissions.roleAllows("manager","crm.stage.change"),"manager can explicitly change stage");

check(contracts.registrationSchema.safeParse({email:"owner@example.com",password:"a-secure-password",displayName:"Owner",organizationName:"Acme"}).success,"registration contract");
check(!contracts.registrationSchema.safeParse({email:"bad",password:"short",displayName:"",organizationName:"A"}).success,"registration rejects unsafe input");
check(contracts.opportunityCreateSchema.safeParse({workspaceId:crypto.randomUUID(),accountId:crypto.randomUUID(),pipelineId:crypto.randomUUID(),stageId:crypto.randomUUID(),title:"Expansion",amountMinor:1000,currency:"usd"}).success,"opportunity contract");
check(!contracts.opportunityCreateSchema.safeParse({workspaceId:crypto.randomUUID(),accountId:crypto.randomUUID(),pipelineId:crypto.randomUUID(),stageId:crypto.randomUUID(),title:"Expansion",amountMinor:1000}).success,"money requires currency");
check(contracts.taskCreateSchema.safeParse({workspaceId:crypto.randomUUID(),title:"Follow up"}).success,"task contract");
check(!contracts.jobCreateSchema.safeParse({queue:"unknown",jobType:"x",idempotencyKey:"short"}).success,"job contract rejects unknown queue");

const passwordHash=await security.hashPassword("correct horse battery staple");
check(passwordHash.startsWith("scrypt-v1."),"scrypt version recorded");
check(await security.verifyPassword("correct horse battery staple",passwordHash),"password verifies");
check(!(await security.verifyPassword("wrong password",passwordHash)),"wrong password rejected");
const jwt=security.signJwt({sub:crypto.randomUUID(),org:crypto.randomUUID(),sid:crypto.randomUUID(),type:"access"},60);
check(jwt.split(".").length===3,"JWT structure");
check(security.verifyJwt(jwt).type==="access","JWT verification");
check(security.sha256("token")===security.sha256("token"),"stable token hash");
check(security.sha256("token")!==security.sha256("other"),"distinct token hashes");
const encrypted=security.encryptSecret("sensitive-factor");
check(!encrypted.includes("sensitive-factor"),"MFA secret encrypted");
check(security.decryptSecret(encrypted)==="sensitive-factor","MFA secret decrypts");
const totpSecret=security.createTotpSecret(),code=security.totp(totpSecret,1_800_000);
check(/^[A-Z2-7]{32}$/.test(totpSecret),"TOTP secret is base32");
check(/^\d{6}$/.test(code),"TOTP has six digits");
check(security.verifyTotp(totpSecret,code,1_800_000),"TOTP verifies");
check(!security.verifyTotp(totpSecret,code==="000000"?"000001":"000000",1_800_000),"wrong TOTP rejected");

const migration=await readFile(new URL("./migrate-phase7-enterprise.sql",import.meta.url),"utf8");
for(const table of ["enterprise_users","enterprise_organizations","enterprise_memberships","enterprise_device_sessions","enterprise_api_keys","enterprise_audit_logs","crm_accounts","crm_opportunities","crm_tasks","crm_events","crm_forecast_snapshots","billing_plans","billing_subscriptions","billing_usage_ledger","billing_webhook_events","platform_jobs","platform_schedules","platform_notifications","platform_outbox","platform_inbox"])check(migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`),`${table} migration exists`);
for(const invariant of ["ON DELETE RESTRICT","dead_lettered","UNIQUE(organization_id,idempotency_key)","crm_opportunity_stage_history","lease_expires_at"])check(migration.includes(invariant),`migration invariant ${invariant}`);

const store=await readFile(new URL("../src/lib/enterprise/store.ts",import.meta.url),"utf8");
check(store.includes("crm.stage-changed.v1"),"explicit stage event");
check(!store.includes("funnelspy_audits SET"),"CRM does not write FunnelSpy");
check(!store.includes("proposal_documents SET"),"CRM does not write Proposal Builder");
check(!store.includes("outreach_campaigns SET"),"CRM does not write Outreach");
check(store.includes("platform_outbox"),"CRM writes transactional outbox");
check(store.includes("expectedVersion"),"stage changes use optimistic concurrency");
check(store.includes("FOR UPDATE SKIP LOCKED"),"worker claims jobs with row skipping");

const openapi=await readFile(new URL("../src/lib/enterprise/openapi.ts",import.meta.url),"utf8");
check(openapi.includes('openapi:"3.1.0"'),"OpenAPI 3.1");
check(openapi.includes("/api/v1/opportunities/{id}/stage"),"stage API documented");
const proxy=await readFile(new URL("../src/proxy.ts",import.meta.url),"utf8");
check(!proxy.includes("enterprise_"),"legacy proxy remains unmodified by test boundary");

console.log(`Phase 7 characterization: ${assertions} assertions passed; local cryptographic and static validation only, no network, database mutation, OAuth, Stripe, email, or upstream module mutation used.`);
