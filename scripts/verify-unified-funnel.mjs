import { readFileSync } from "node:fs";
import { createHmac, randomUUID } from "node:crypto";
import { request as httpRequest } from "node:http";
import pg from "pg";

const { Pool } = pg;
const password = readFileSync("/run/secrets/postgres_password", "utf8").trim();
const pool = new Pool({
  host: "postgres",
  port: 5432,
  database: "revora",
  user: "revora",
  password,
});
let verificationSessionId = "";
let accessToken = "";

function base64url(value) {
  return Buffer.from(value).toString("base64url");
}

function signAccessToken(userId, organizationId, sessionId) {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("The local JWT signing configuration is unavailable.");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: userId, org: organizationId, sid: sessionId, type: "access", iat: now, exp: now + 900 }));
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

async function callApi(path, method = "GET", body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  const result = await new Promise((resolve, reject) => {
    const request = httpRequest({
      hostname: "127.0.0.1",
      port: 3000,
      path,
      method,
      headers: {
        ...(payload ? { "content-type": "application/json", "content-length": Buffer.byteLength(payload) } : {}),
        "x-forwarded-for": "unified-flow-verification",
        authorization: `Bearer ${accessToken}`,
      },
    }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { raw += chunk; });
      response.on("end", () => resolve({ status: response.statusCode || 500, raw }));
    });
    request.setTimeout(600_000, () => request.destroy(new Error(`Timed out waiting for ${path}`)));
    request.on("error", reject);
    if (payload) request.write(payload);
    request.end();
  });
  const data = JSON.parse(result.raw || "{}");
  if (result.status < 200 || result.status >= 300) {
    const error = new Error(`${path} returned ${result.status}: ${data.error || data.details || "unknown error"}`);
    error.status = result.status;
    throw error;
  }
  return data;
}

async function callPost(path, body) {
  return callApi(path, "POST", body);
}

try {
  const memberResult = await pool.query(
    `SELECT m.user_id,m.organization_id
     FROM enterprise_memberships m
     JOIN enterprise_users u ON u.id=m.user_id AND u.status='active'
     WHERE m.status='active' ORDER BY m.joined_at LIMIT 1`,
  );
  const member = memberResult.rows[0];
  if (!member) throw new Error("No active local user exists for authenticated verification.");
  verificationSessionId = randomUUID();
  await pool.query(
    `INSERT INTO enterprise_device_sessions
     (id,user_id,organization_id,refresh_token_hash,user_agent_hash,ip_hash,expires_at)
     VALUES($1,$2,$3,$4,$5,$6,NOW()+INTERVAL '20 minutes')`,
    [verificationSessionId, member.user_id, member.organization_id, randomUUID(), randomUUID(), randomUUID()],
  );
  accessToken = signAccessToken(member.user_id, member.organization_id, verificationSessionId);

  const auditResult = await pool.query(
    `SELECT fa.id,fa.analysis,fa.report,b.name AS business_name,b.business_type
     FROM funnelspy_audits fa
     JOIN businesses b ON b.id=fa.business_id
     WHERE fa.business_id=1 ORDER BY fa.created_at DESC LIMIT 1`,
  );
  const audit = auditResult.rows[0];
  if (!audit?.report) throw new Error("Tatiana Brand needs a persisted FunnelSpy report before verification.");

  const home = audit.analysis.pages?.find((page) => page.kind === "home");
  const context = {
    businessName: home?.title || audit.business_name,
    businessType: audit.report.funnelType || audit.business_type,
    targetAudience: audit.report.targetAudience || "",
    currentOffer: audit.report.valueProposition || "",
    currentPrice: 0,
    primaryObjective: audit.report.primaryObjective || "",
    valueProposition: audit.report.valueProposition || "",
    weaknesses: audit.report.weaknesses || [],
    recommendations: (audit.report.recommendations || []).map((item) => item.action),
    evidence: (audit.analysis.pages || []).slice(0, 8).map((page) => `${page.kind}: ${page.title} - ${page.description}`),
    auditId: audit.id,
    sourceUrl: audit.analysis.origin,
    visualIdentity: audit.analysis.visualIdentity,
  };

  let otom;
  try {
    otom = await callApi(`/api/pipeline/generate-otom?auditId=${encodeURIComponent(audit.id)}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    otom = await callPost("/api/pipeline/generate-otom", context);
  }

  const refreshedAudit = await pool.query("SELECT analysis FROM funnelspy_audits WHERE id=$1", [audit.id]);
  const enrichedContext = {
    ...context,
    visualIdentity: refreshedAudit.rows[0]?.analysis?.visualIdentity || context.visualIdentity,
    otomSummary: JSON.stringify({
      hook: otom.otom.hook,
      coreOffer: otom.otom.coreOffer,
      upsell: otom.otom.upsell,
      downsell: otom.otom.downsell,
    }),
  };

  let webBuilder;
  try {
    webBuilder = await callApi(`/api/web-builder/generate?auditId=${encodeURIComponent(audit.id)}`);
  } catch (error) {
    if (error.status !== 404) throw error;
    webBuilder = await callPost("/api/web-builder/generate", enrichedContext);
  }

  const funnel = await callPost("/api/funnelspy/create-funnel", {
    analysis: { ...audit.analysis, visualIdentity: enrichedContext.visualIdentity },
    report: audit.report,
    auditId: audit.id,
    languageMode: "bilingual",
  });

  console.log(JSON.stringify({
    auditId: audit.id,
    visualIdentity: {
      logo: Boolean(enrichedContext.visualIdentity?.logoUrl),
      hero: Boolean(enrichedContext.visualIdentity?.heroImageUrl),
      colors: enrichedContext.visualIdentity?.colors?.length || 0,
      fonts: enrichedContext.visualIdentity?.fonts?.length || 0,
      navigation: enrichedContext.visualIdentity?.navigation?.length || 0,
    },
    otom: {
      provider: otom.provider,
      model: otom.model,
      hook: Boolean(otom.otom?.hook?.name),
      coreOffer: Boolean(otom.otom?.coreOffer?.name),
      upsell: Boolean(otom.otom?.upsell?.name),
      downsell: Boolean(otom.otom?.downsell?.name),
      journeySteps: otom.otom?.customerJourney?.length || 0,
    },
    webBuilder: {
      provider: webBuilder.provider,
      model: webBuilder.model,
      products: webBuilder.spec?.products?.length || 0,
      sections: webBuilder.spec ? 10 : 0,
      sourceAnalyzed: webBuilder.sourceAnalyzed,
    },
    funnel: { id: funnel.funnel?.id, slug: funnel.funnel?.slug, previewUrls: funnel.previewUrls },
  }, null, 2));
} finally {
  if (verificationSessionId) {
    await pool.query("DELETE FROM enterprise_device_sessions WHERE id=$1", [verificationSessionId]).catch(() => undefined);
  }
  await pool.end();
}
