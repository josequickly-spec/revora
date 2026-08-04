import { readFileSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({
  host: "postgres",
  port: 5432,
  database: "revora",
  user: "revora",
  password: readFileSync("/run/secrets/postgres_password", "utf8").trim(),
});
let sessionId = "";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signToken(userId, organizationId) {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT signing is unavailable.");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: userId, org: organizationId, sid: sessionId, type: "access", iat: now, exp: now + 900 }));
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function post(path, token, body) {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const request = httpRequest({
      hostname: "127.0.0.1",
      port: 3000,
      path,
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload),
        "x-forwarded-for": "outreach-verification",
      },
    }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { raw += chunk; });
      response.on("end", () => {
        const data = JSON.parse(raw || "{}");
        if ((response.statusCode || 500) >= 300) reject(new Error(data.error || `HTTP ${response.statusCode}`));
        else resolve(data);
      });
    });
    request.setTimeout(600_000, () => request.destroy(new Error("Outreach generation timed out.")));
    request.on("error", reject);
    request.write(payload);
    request.end();
  });
}

try {
  const memberResult = await pool.query(
    `SELECT m.user_id,m.organization_id FROM enterprise_memberships m
     JOIN enterprise_users u ON u.id=m.user_id AND u.status='active'
     WHERE m.status='active' ORDER BY m.joined_at LIMIT 1`,
  );
  const member = memberResult.rows[0];
  if (!member) throw new Error("No active user exists for verification.");
  sessionId = randomUUID();
  await pool.query(
    `INSERT INTO enterprise_device_sessions
     (id,user_id,organization_id,refresh_token_hash,user_agent_hash,ip_hash,expires_at)
     VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '20 minutes')`,
    [sessionId, member.user_id, member.organization_id, randomUUID(), randomUUID(), randomUUID()],
  );
  const result = await post("/api/outreach/generate", signToken(member.user_id, member.organization_id), {
    businessId: 1,
    senderName: "Equipo de estrategia",
    senderCompany: "EcoScale Partner",
  });
  const previewSlug = "tatianabrand-com-864534";
  console.log(JSON.stringify({
    draftId: result.outreach?.id,
    status: result.outreach?.status,
    emailCount: result.emailSequence?.length || 0,
    emails: (result.emailSequence || []).map((email) => ({
      sequence: email.index,
      purpose: email.purpose,
      subject: email.subject,
      words: String(email.body || "").trim().split(/\s+/).filter(Boolean).length,
      containsLatestPreview: String(email.body || "").includes(previewSlug),
    })),
    personalizationUsed: result.personalizationUsed || [],
    claimsToVerify: result.claimsToVerify || [],
  }, null, 2));
} finally {
  if (sessionId) await pool.query("DELETE FROM enterprise_device_sessions WHERE id=$1", [sessionId]).catch(() => undefined);
  await pool.end();
}
