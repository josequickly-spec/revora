import pg from "pg";

const targetEmail = process.argv[2]?.trim().toLowerCase();
if (!targetEmail) throw new Error("Target account email is required.");

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/revora";
const databaseUrl = new URL(connectionString);
if (!["localhost", "127.0.0.1"].includes(databaseUrl.hostname)) {
  throw new Error("Refusing to reassign dataset ownership outside a local database.");
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("BEGIN");
  const target = await client.query(
    `SELECT u.id AS user_id,m.organization_id,o.name
     FROM enterprise_users u
     JOIN enterprise_memberships m ON m.user_id=u.id AND m.status='active'
     JOIN enterprise_organizations o ON o.id=m.organization_id
     WHERE u.normalized_email=$1
     ORDER BY m.joined_at
     LIMIT 1
     FOR UPDATE`,
    [targetEmail],
  );
  if (!target.rowCount) throw new Error("The target account has no active organization.");
  const { user_id: userId, organization_id: organizationId, name } = target.rows[0];
  await client.query(
    `UPDATE platform_legacy_dataset_owner
     SET organization_id=$1,claimed_by=$2,claimed_at=NOW()
     WHERE singleton=TRUE`,
    [organizationId, userId],
  );
  await client.query("COMMIT");
  console.log(JSON.stringify({ organizationId, organizationName: name, reassigned: true }));
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
