import pg from "pg";
import { randomUUID } from "node:crypto";

if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  const email = "admin_1786054280400@ecoscale.local";
  const normalized = email.toLowerCase();
  const userId = randomUUID();
  const orgId = randomUUID();
  const wsId = randomUUID();

  // Create user
  await client.query(
    `INSERT INTO enterprise_users(id, email, normalized_email, display_name, password_hash, status, email_verified_at)
     VALUES($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT(normalized_email) DO NOTHING`,
    [userId, email, normalized, "Local Developer", null, "active"]
  );

  // Get or create user (in case it already existed)
  const userResult = await client.query(
    `SELECT id FROM enterprise_users WHERE normalized_email=$1`,
    [normalized]
  );
  const actualUserId = userResult.rows[0].id;

  // Create organization
  const orgResult = await client.query(
    `INSERT INTO enterprise_organizations(id, name, slug, status, created_by)
     VALUES($1, $2, $3, $4, $5)
     ON CONFLICT(slug) DO NOTHING
     RETURNING id`,
    [orgId, "Local Development", "local-dev", "active", actualUserId]
  );

  const actualOrgId = orgResult.rows[0]?.id || orgId;

  // Create workspace
  await client.query(
    `INSERT INTO enterprise_workspaces(id, organization_id, name, slug)
     VALUES($1, $2, $3, $4)
     ON CONFLICT(organization_id, slug) DO NOTHING`,
    [wsId, actualOrgId, "Primary", "primary"]
  );

  // Create roles (owner, admin, user)
  const roleCodes = ["owner", "admin", "user"];
  for (const code of roleCodes) {
    const roleId = randomUUID();
    await client.query(
      `INSERT INTO enterprise_roles(id, organization_id, code, name, is_system)
       VALUES($1, $2, $3, $4, TRUE)
       ON CONFLICT(organization_id, code) DO NOTHING`,
      [roleId, actualOrgId, code, code.charAt(0).toUpperCase() + code.slice(1)]
    );
  }

  // Get owner role
  const roleResult = await client.query(
    `SELECT id FROM enterprise_roles WHERE organization_id=$1 AND code='owner'`,
    [actualOrgId]
  );
  const roleId = roleResult.rows[0].id;

  // Create membership
  const membershipId = randomUUID();
  await client.query(
    `INSERT INTO enterprise_memberships(id, organization_id, user_id, role_id, status)
     VALUES($1, $2, $3, $4, $5)
     ON CONFLICT(organization_id, user_id) DO NOTHING`,
    [membershipId, actualOrgId, actualUserId, roleId, "active"]
  );

  console.log("✅ Local development user created successfully");
  console.log(`   Email: ${email}`);
  console.log(`   Organization: Local Development`);
  console.log(`   Role: Owner`);
} catch (error) {
  console.error("❌ Error creating local dev user:", error.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
