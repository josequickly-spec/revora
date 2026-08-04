import { randomBytes, randomUUID, scrypt as nodeScrypt } from "node:crypto";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import pg from "pg";

const scrypt = promisify(nodeScrypt);
const email = "admin@ecoscale.local";
const displayName = "EcoScale Admin";
const password = `${randomBytes(18).toString("base64url")}Aa1!`;
const pool = new pg.Pool({
  host: "postgres",
  port: 5432,
  database: "revora",
  user: "revora",
  password: readFileSync("/run/secrets/postgres_password", "utf8").trim(),
});
const client = await pool.connect();

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

try {
  await client.query("BEGIN");
  const existing = await client.query("SELECT 1 FROM enterprise_users WHERE normalized_email=$1", [email]);
  if (existing.rowCount) throw new Error("The local admin account already exists.");
  const owner = await client.query(
    `SELECT o.id AS organization_id,r.id AS role_id
     FROM enterprise_organizations o
     JOIN enterprise_roles r ON r.organization_id=o.id AND r.code='owner'
     ORDER BY o.created_at LIMIT 1`,
  );
  if (!owner.rowCount) throw new Error("No existing workspace owner role is available.");
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  const passwordHash = `scrypt-v1.${base64url(salt)}.${base64url(derived)}`;
  const userId = randomUUID();
  await client.query(
    `INSERT INTO enterprise_users(id,email,normalized_email,display_name,password_hash,email_verified_at)
     VALUES($1,$2,$3,$4,$5,NOW())`,
    [userId, email, email, displayName, passwordHash],
  );
  await client.query(
    `INSERT INTO enterprise_memberships(id,organization_id,user_id,role_id,status)
     VALUES($1,$2,$3,$4,'active')`,
    [randomUUID(), owner.rows[0].organization_id, userId, owner.rows[0].role_id],
  );
  await client.query("COMMIT");
  console.log(JSON.stringify({ email, password, role: "owner", displayName }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
