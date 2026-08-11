import { randomUUID } from "node:crypto";
import { pool } from "@/lib/postgres";
import type { ProposalContent, ProposalCreateRequest, ProposalPricing, ProposalRecord, ProposalStatus, ProposalTerms, ProposalUpdateRequest } from "./contracts";
import { calculateProposalPricing } from "./pricing";
import { assertProposalTransition } from "./lifecycle";
import { createPublicProposalToken, hashPublicProposalToken } from "./public-token";
import { validateProposalForReady } from "./validation";
import { PROPOSAL_SCHEMA_VERSION, PROPOSAL_TEMPLATE_VERSION } from "./versions";

let schemaReady = false;
export async function ensureProposalSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS proposal_documents (
      id UUID PRIMARY KEY,
      business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
      audit_id UUID NOT NULL REFERENCES funnelspy_audits(id) ON DELETE RESTRICT,
      consultant_report_id UUID REFERENCES ai_consultant_reports(id) ON DELETE RESTRICT,
      title VARCHAR(240) NOT NULL,
      proposal_type VARCHAR(80) NOT NULL,
      status VARCHAR(30) NOT NULL,
      currency VARCHAR(10) NOT NULL,
      locale VARCHAR(10) NOT NULL,
      current_version INTEGER NOT NULL,
      published_version INTEGER,
      public_token_hash VARCHAR(64),
      public_token_prefix VARCHAR(12),
      public_token_created_at TIMESTAMPTZ,
      public_expires_at TIMESTAMPTZ,
      first_viewed_at TIMESTAMPTZ,
      last_viewed_at TIMESTAMPTZ,
      view_count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      published_at TIMESTAMPTZ,
      archived_at TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS proposal_versions (
      id UUID PRIMARY KEY,
      proposal_id UUID NOT NULL REFERENCES proposal_documents(id) ON DELETE RESTRICT,
      version INTEGER NOT NULL,
      content_schema_version VARCHAR(100) NOT NULL,
      template_version VARCHAR(100) NOT NULL,
      evidence_snapshot JSONB NOT NULL,
      content JSONB NOT NULL,
      pricing JSONB NOT NULL,
      terms JSONB NOT NULL,
      internal_notes TEXT NOT NULL DEFAULT '',
      warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(proposal_id, version)
    );
    CREATE TABLE IF NOT EXISTS proposal_events (
      id UUID PRIMARY KEY,
      proposal_id UUID NOT NULL REFERENCES proposal_documents(id) ON DELETE RESTRICT,
      event_type VARCHAR(50) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS proposal_documents_business_updated_idx ON proposal_documents(business_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS proposal_documents_audit_updated_idx ON proposal_documents(audit_id, updated_at DESC);
    CREATE INDEX IF NOT EXISTS proposal_documents_status_updated_idx ON proposal_documents(status, updated_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS proposal_documents_public_token_hash_idx ON proposal_documents(public_token_hash) WHERE public_token_hash IS NOT NULL;
    CREATE INDEX IF NOT EXISTS proposal_versions_proposal_version_idx ON proposal_versions(proposal_id, version DESC);
    CREATE INDEX IF NOT EXISTS proposal_events_proposal_created_idx ON proposal_events(proposal_id, created_at DESC);
  `);
  schemaReady = true;
}

const selectRecord = `pd.*, pv.content_schema_version, pv.template_version, pv.evidence_snapshot,
  pv.content, pv.pricing, pv.terms, pv.internal_notes, pv.warnings`;

function normalize(row: Record<string, unknown>): ProposalRecord {
  return {
    id: String(row.id), businessId: Number(row.business_id), auditId: String(row.audit_id),
    consultantReportId: row.consultant_report_id == null ? null : String(row.consultant_report_id),
    title: String(row.title), proposalType: String(row.proposal_type) as ProposalRecord["proposalType"],
    status: String(row.status) as ProposalStatus, currency: String(row.currency) as ProposalRecord["currency"],
    locale: String(row.locale) as "en" | "es", currentVersion: Number(row.current_version),
    publishedVersion: row.published_version == null ? null : Number(row.published_version),
    templateVersion: String(row.template_version), contentSchemaVersion: String(row.content_schema_version),
    publicTokenPrefix: row.public_token_prefix == null ? null : String(row.public_token_prefix),
    publicTokenCreatedAt: row.public_token_created_at == null ? null : new Date(String(row.public_token_created_at)).toISOString(),
    publicExpiresAt: row.public_expires_at == null ? null : new Date(String(row.public_expires_at)).toISOString(),
    firstViewedAt: row.first_viewed_at == null ? null : new Date(String(row.first_viewed_at)).toISOString(),
    lastViewedAt: row.last_viewed_at == null ? null : new Date(String(row.last_viewed_at)).toISOString(),
    viewCount: Number(row.view_count), createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    publishedAt: row.published_at == null ? null : new Date(String(row.published_at)).toISOString(),
    archivedAt: row.archived_at == null ? null : new Date(String(row.archived_at)).toISOString(),
    content: row.content as ProposalContent, pricing: row.pricing as ProposalPricing,
    terms: row.terms as ProposalTerms, evidenceSnapshot: row.evidence_snapshot as ProposalContent["evidenceReferences"],
    internalNotes: String(row.internal_notes || ""), warnings: (row.warnings as string[]) || [],
  };
}

async function event(client: { query: typeof pool.query }, proposalId: string, eventType: string, metadata: Record<string, unknown> = {}) {
  await client.query("INSERT INTO proposal_events(id,proposal_id,event_type,metadata) VALUES($1,$2,$3,$4)", [randomUUID(), proposalId, eventType, JSON.stringify(metadata)]);
}

export async function createProposalDocument(request: ProposalCreateRequest, draft: {
  title: string; content: ProposalContent; pricing: ProposalPricing; terms: ProposalTerms;
  internalNotes: string; evidenceSnapshot: ProposalContent["evidenceReferences"]; warnings: string[];
}) {
  await ensureProposalSchema();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const id = randomUUID();
    await client.query(
      `INSERT INTO proposal_documents(id,business_id,audit_id,consultant_report_id,title,proposal_type,status,currency,locale,current_version)
       VALUES($1,$2,$3,$4,$5,$6,'draft',$7,$8,1)`,
      [id, request.businessId, request.auditId, request.consultantReportId || null, draft.title, request.proposalType, request.currency, request.locale],
    );
    await client.query(
      `INSERT INTO proposal_versions(id,proposal_id,version,content_schema_version,template_version,evidence_snapshot,content,pricing,terms,internal_notes,warnings)
       VALUES($1,$2,1,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [randomUUID(), id, PROPOSAL_SCHEMA_VERSION, PROPOSAL_TEMPLATE_VERSION, JSON.stringify(draft.evidenceSnapshot),
        JSON.stringify(draft.content), JSON.stringify(draft.pricing), JSON.stringify(draft.terms), draft.internalNotes, JSON.stringify(draft.warnings)],
    );
    await event(client, id, "created", { creationMode: request.creationMode });
    await client.query("COMMIT");
    return getProposalDocument(id);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function getProposalDocument(id: string, version?: number) {
  await ensureProposalSchema();
  const result = await pool.query(
    `SELECT ${selectRecord} FROM proposal_documents pd
     JOIN proposal_versions pv ON pv.proposal_id=pd.id AND pv.version=COALESCE($2,pd.current_version)
     WHERE pd.id=$1 LIMIT 1`, [id, version || null],
  );
  return result.rows[0] ? normalize(result.rows[0]) : null;
}

export async function listProposalDocuments(filters: { businessId?: number; auditId?: string; status?: string; proposalType?: string; limit?: number } = {}) {
  await ensureProposalSchema();
  const values: unknown[] = []; const where: string[] = [];
  for (const [column, value] of [["business_id", filters.businessId], ["audit_id", filters.auditId], ["status", filters.status], ["proposal_type", filters.proposalType]] as const) {
    if (value != null) { values.push(value); where.push(`pd.${column}=$${values.length}`); }
  }
  values.push(Math.min(Math.max(filters.limit || 50, 1), 100));
  const result = await pool.query(
    `SELECT ${selectRecord} FROM proposal_documents pd JOIN proposal_versions pv ON pv.proposal_id=pd.id AND pv.version=pd.current_version
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY pd.updated_at DESC LIMIT $${values.length}`, values,
  );
  return result.rows.map(normalize);
}

export async function updateProposalDocument(id: string, input: ProposalUpdateRequest) {
  await ensureProposalSchema();
  const pricing = calculateProposalPricing(input.pricingInput);
  const current = await getProposalDocument(id);
  if (!current) return null;
  if (current.status === "archived") throw new Error("archived_proposal");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const nextVersion = input.expectedVersion + 1;
    const updated = await client.query(
      `UPDATE proposal_documents SET title=$3,current_version=$4,status='draft',updated_at=NOW()
       WHERE id=$1 AND current_version=$2 RETURNING id`,
      [id, input.expectedVersion, input.title, nextVersion],
    );
    if (!updated.rowCount) throw new Error("optimistic_conflict");
    await client.query(
      `INSERT INTO proposal_versions(id,proposal_id,version,content_schema_version,template_version,evidence_snapshot,content,pricing,terms,internal_notes,warnings)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [randomUUID(), id, nextVersion, PROPOSAL_SCHEMA_VERSION, current.templateVersion, JSON.stringify(current.evidenceSnapshot),
        JSON.stringify(input.content), JSON.stringify(pricing), JSON.stringify(input.terms), input.internalNotes, JSON.stringify(current.warnings)],
    );
    await event(client, id, "edited", { version: nextVersion });
    await client.query("COMMIT");
    return getProposalDocument(id);
  } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export async function transitionProposal(id: string, to: ProposalStatus) {
  const current = await getProposalDocument(id);
  if (!current) return null;
  assertProposalTransition(current.status, to);
  if (to === "ready") validateProposalForReady(current);
  await pool.query(
    `UPDATE proposal_documents SET status=$2,updated_at=NOW(),
      archived_at=CASE WHEN $2='archived' THEN NOW() ELSE archived_at END,
      public_token_hash=CASE WHEN $2='archived' THEN NULL ELSE public_token_hash END,
      public_token_prefix=CASE WHEN $2='archived' THEN NULL ELSE public_token_prefix END
     WHERE id=$1`, [id, to],
  );
  await event(pool, id, to === "ready" ? "marked_ready" : to);
  return getProposalDocument(id);
}

export async function publishProposal(id: string, expiresAt?: string | null) {
  const current = await getProposalDocument(id);
  if (!current) return null;
  assertProposalTransition(current.status, "published");
  validateProposalForReady(current);
  const publicToken = createPublicProposalToken();
  await pool.query(
    `UPDATE proposal_documents SET status='published',published_version=current_version,public_token_hash=$2,
      public_token_prefix=$3,public_token_created_at=NOW(),public_expires_at=$4,published_at=NOW(),updated_at=NOW()
     WHERE id=$1`, [id, publicToken.hash, publicToken.prefix, expiresAt || null],
  );
  await event(pool, id, "published", { version: current.currentVersion });
  return { proposal: await getProposalDocument(id), token: publicToken.token };
}

export async function rotateProposalToken(id: string) {
  const current = await getProposalDocument(id);
  if (!current || !["published", "viewed"].includes(current.status)) throw new Error("proposal_not_published");
  const publicToken = createPublicProposalToken();
  await pool.query("UPDATE proposal_documents SET public_token_hash=$2,public_token_prefix=$3,public_token_created_at=NOW(),updated_at=NOW() WHERE id=$1", [id, publicToken.hash, publicToken.prefix]);
  await event(pool, id, "token_rotated");
  return { proposal: await getProposalDocument(id), token: publicToken.token };
}

export async function getPublicProposal(token: string, countView = true) {
  await ensureProposalSchema();
  const hash = hashPublicProposalToken(token);
  const result = await pool.query(
    `SELECT ${selectRecord} FROM proposal_documents pd JOIN proposal_versions pv
       ON pv.proposal_id=pd.id AND pv.version=pd.published_version
     WHERE pd.public_token_hash=$1 AND pd.status IN ('published','viewed')
       AND (pd.public_expires_at IS NULL OR pd.public_expires_at > NOW()) LIMIT 1`, [hash],
  );
  if (!result.rows[0]) return null;
  const proposal = normalize(result.rows[0]);
  if (countView) {
    await pool.query(`UPDATE proposal_documents SET first_viewed_at=COALESCE(first_viewed_at,NOW()),last_viewed_at=NOW(),view_count=view_count+1 WHERE id=$1`, [proposal.id]);
    await event(pool, proposal.id, "viewed", { meaning: "public_route_requested" });
  }
  return proposal;
}

export async function listProposalVersions(id: string) {
  await ensureProposalSchema();
  const result = await pool.query("SELECT version,content_schema_version,template_version,created_at FROM proposal_versions WHERE proposal_id=$1 ORDER BY version DESC", [id]);
  return result.rows.map(row => ({ version: Number(row.version), contentSchemaVersion: row.content_schema_version, templateVersion: row.template_version, createdAt: new Date(row.created_at).toISOString() }));
}

export async function duplicateProposal(id: string) {
  const current = await getProposalDocument(id);
  if (!current) return null;
  return createProposalDocument({
    businessId: current.businessId, auditId: current.auditId,
    consultantReportId: current.consultantReportId || undefined,
    proposalType: current.proposalType, creationMode: "blank",
    locale: current.locale, currency: current.currency,
  }, {
    title: `${current.title} (Copy)`, content: current.content, pricing: current.pricing,
    terms: current.terms, internalNotes: current.internalNotes,
    evidenceSnapshot: current.evidenceSnapshot, warnings: current.warnings,
  });
}
