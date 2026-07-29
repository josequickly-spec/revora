import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { enterpriseFailure,safeJson } from "@/lib/enterprise/http";
import { EnterpriseError,requirePermission } from "@/lib/enterprise/store";
import { pool } from "@/lib/postgres";

const mutation=z.discriminatedUnion("type",[
  z.object({type:z.literal("workspace"),name:z.string().trim().min(1).max(200),slug:z.string().regex(/^[a-z0-9-]{2,100}$/),timezone:z.string().min(1).max(100)}).strict(),
  z.object({type:z.literal("team"),name:z.string().trim().min(1).max(200),workspaceId:z.string().uuid().nullable()}).strict(),
  z.object({type:z.literal("invite"),email:z.string().email().max(320),displayName:z.string().trim().min(1).max(200),role:z.enum(["admin","manager","sales","marketing","viewer"])}).strict(),
]);

export async function GET(request:Request){
  try{
    const context=await requirePermission(request,"organization.manage");
    const [organization,workspaces,teams,members]=await Promise.all([
      pool.query(`SELECT id,name,slug,status,created_at AS "createdAt" FROM enterprise_organizations WHERE id=$1`,[context.organizationId]),
      pool.query(`SELECT id,name,slug,timezone FROM enterprise_workspaces WHERE organization_id=$1 ORDER BY name`,[context.organizationId]),
      pool.query(`SELECT id,workspace_id AS "workspaceId",name FROM enterprise_teams WHERE organization_id=$1 ORDER BY name`,[context.organizationId]),
      pool.query(`SELECT m.id,u.email,u.display_name AS "displayName",r.code AS role,m.status,m.joined_at AS "joinedAt" FROM enterprise_memberships m JOIN enterprise_users u ON u.id=m.user_id JOIN enterprise_roles r ON r.id=m.role_id WHERE m.organization_id=$1 ORDER BY m.joined_at`,[context.organizationId]),
    ]);
    return NextResponse.json({organization:organization.rows[0],workspaces:workspaces.rows,teams:teams.rows,members:members.rows});
  }catch(error){return enterpriseFailure(error);}
}

export async function POST(request:Request){
  try{
    const context=await requirePermission(request,"organization.manage"),input=mutation.parse(await safeJson(request)),id=randomUUID();
    if(input.type==="workspace"){
      await pool.query(`INSERT INTO enterprise_workspaces(id,organization_id,name,slug,timezone) VALUES($1,$2,$3,$4,$5)`,[id,context.organizationId,input.name,input.slug,input.timezone]);
    }else if(input.type==="team"){
      if(input.workspaceId&&!(await pool.query(`SELECT 1 FROM enterprise_workspaces WHERE id=$1 AND organization_id=$2`,[input.workspaceId,context.organizationId])).rowCount)throw new EnterpriseError("Workspace not found.",404,"workspace_not_found");
      await pool.query(`INSERT INTO enterprise_teams(id,organization_id,workspace_id,name) VALUES($1,$2,$3,$4)`,[id,context.organizationId,input.workspaceId,input.name]);
    }else{
      const normalized=input.email.toLowerCase();
      let user=(await pool.query(`SELECT id FROM enterprise_users WHERE normalized_email=$1`,[normalized])).rows[0];
      if(!user){user={id:randomUUID()};await pool.query(`INSERT INTO enterprise_users(id,email,normalized_email,display_name,status) VALUES($1,$2,$3,$4,'invited')`,[user.id,input.email,normalized,input.displayName]);}
      const role=await pool.query(`SELECT id FROM enterprise_roles WHERE organization_id=$1 AND code=$2`,[context.organizationId,input.role]);
      await pool.query(`INSERT INTO enterprise_memberships(id,organization_id,user_id,role_id,status) VALUES($1,$2,$3,$4,'invited') ON CONFLICT(organization_id,user_id) DO NOTHING`,[id,context.organizationId,user.id,role.rows[0].id]);
    }
    return NextResponse.json({id},{status:201});
  }catch(error){return enterpriseFailure(error);}
}
