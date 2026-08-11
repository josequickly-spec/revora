import { randomUUID } from "node:crypto";
import { pool } from "@/lib/postgres";
import type { FunnelSpyAnalysis } from "@/lib/funnelspy";
import type { FunnelAIReport } from "@/lib/funnelspy-ai";

export type StoredAudit = {
  id: string;
  domain: string;
  analysis: FunnelSpyAnalysis;
  report: FunnelAIReport | null;
  createdAt: string;
  shareToken: string;
  businessId: number | null;
  otom: Record<string, unknown> | null;
  webBuilder: Record<string, unknown> | null;
  storageMode: "postgres";
  businessName: string | null;
};

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS funnelspy_audits (
      id UUID PRIMARY KEY,
      domain TEXT NOT NULL,
      analysis JSONB NOT NULL,
      report JSONB,
      share_token UUID UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE funnelspy_audits
      ADD COLUMN IF NOT EXISTS business_id BIGINT REFERENCES businesses(id) ON DELETE SET NULL;
    ALTER TABLE funnelspy_audits ADD COLUMN IF NOT EXISTS otom JSONB;
    ALTER TABLE funnelspy_audits ADD COLUMN IF NOT EXISTS web_builder JSONB;
    CREATE INDEX IF NOT EXISTS funnelspy_audits_domain_created_idx
      ON funnelspy_audits(domain, created_at DESC);
    CREATE INDEX IF NOT EXISTS funnelspy_audits_business_created_idx
      ON funnelspy_audits(business_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS funnelspy_monitors (
      id UUID PRIMARY KEY,
      domain TEXT UNIQUE NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'weekly',
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      last_audit_id UUID,
      last_checked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE funnelspy_monitors
      ADD COLUMN IF NOT EXISTS business_id BIGINT REFERENCES businesses(id) ON DELETE SET NULL;
  `);
  schemaReady = true;
}

function normalizeRow(row: Record<string, unknown>): StoredAudit {
  return {
    id: String(row.id),
    domain: String(row.domain),
    analysis: row.analysis as FunnelSpyAnalysis,
    report: (row.report as FunnelAIReport | null) || null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    shareToken: String(row.share_token),
    businessId: row.business_id == null ? null : Number(row.business_id),
    otom: (row.otom as Record<string, unknown> | null) || null,
    webBuilder: (row.web_builder as Record<string, unknown> | null) || null,
    storageMode: "postgres",
    businessName: row.business_name == null ? null : String(row.business_name),
  };
}

export async function saveAudit(
  analysis: FunnelSpyAnalysis,
  report: FunnelAIReport | null = null,
  options: { businessId?: number | null } = {},
) {
  await ensureSchema();
  const result = await pool.query(
    `INSERT INTO funnelspy_audits (id, domain, analysis, report, share_token, created_at, business_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [randomUUID(), analysis.domain, JSON.stringify(analysis), report ? JSON.stringify(report) : null, randomUUID(), new Date().toISOString(), options.businessId || null],
  );
  return normalizeRow(result.rows[0]);
}

export async function attachReport(id: string, report: FunnelAIReport) {
  await ensureSchema();
  await pool.query("UPDATE funnelspy_audits SET report = $1 WHERE id = $2", [JSON.stringify(report), id]);
}

export async function attachOtom(id: string, otom: Record<string, unknown>) {
  await ensureSchema();
  await pool.query("UPDATE funnelspy_audits SET otom = $1 WHERE id = $2", [JSON.stringify(otom), id]);
}

export async function attachWebBuilder(id: string, webBuilder: Record<string, unknown>) {
  await ensureSchema();
  await pool.query("UPDATE funnelspy_audits SET web_builder = $1 WHERE id = $2", [JSON.stringify(webBuilder), id]);
}

export async function attachVisualIdentity(id: string, visualIdentity: FunnelSpyAnalysis["visualIdentity"]) {
  if (!visualIdentity) return;
  await ensureSchema();
  await pool.query(
    "UPDATE funnelspy_audits SET analysis = jsonb_set(analysis, '{visualIdentity}', $1::jsonb, true) WHERE id = $2",
    [JSON.stringify(visualIdentity), id],
  );
}

export async function listAudits(domain?: string, limit = 30, businessId?: number) {
  await ensureSchema();
  const result = businessId
    ? await pool.query("SELECT fa.*, b.name AS business_name FROM funnelspy_audits fa LEFT JOIN businesses b ON b.id=fa.business_id WHERE fa.business_id = $1 ORDER BY fa.created_at DESC LIMIT $2", [businessId, limit])
    : domain
      ? await pool.query("SELECT fa.*, b.name AS business_name FROM funnelspy_audits fa LEFT JOIN businesses b ON b.id=fa.business_id WHERE lower(regexp_replace(fa.domain, '^www\\.', '')) = lower(regexp_replace($1, '^www\\.', '')) ORDER BY fa.created_at DESC LIMIT $2", [domain, limit])
      : await pool.query("SELECT fa.*, b.name AS business_name FROM funnelspy_audits fa LEFT JOIN businesses b ON b.id=fa.business_id ORDER BY fa.created_at DESC LIMIT $1", [limit]);
  return result.rows.map(normalizeRow);
}

export async function findLatestAudit(domain: string, businessId?: number) {
  const audits = await listAudits(domain, 10, businessId);
  return audits[0] || null;
}

export function storageWarning(audit: StoredAudit) {
  void audit;
  return null;
}

export async function getAudit(idOrShareToken: string) {
  await ensureSchema();
  const result = await pool.query("SELECT fa.*, b.name AS business_name FROM funnelspy_audits fa LEFT JOIN businesses b ON b.id=fa.business_id WHERE fa.id::text = $1 OR fa.share_token::text = $1 LIMIT 1", [idOrShareToken]);
  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function upsertMonitor(domain: string, frequency = "weekly", businessId?: number | null) {
  const id = randomUUID();
  await ensureSchema();
  const result = await pool.query(
    `INSERT INTO funnelspy_monitors (id, domain, frequency, business_id) VALUES ($1, $2, $3, $4)
     ON CONFLICT (domain) DO UPDATE SET frequency = EXCLUDED.frequency, enabled = TRUE,
       business_id = COALESCE(EXCLUDED.business_id, funnelspy_monitors.business_id)
     RETURNING *`,
    [id, domain, frequency, businessId || null],
  );
  return result.rows[0];
}

export async function listDueMonitors() {
  await ensureSchema();
  const result = await pool.query(`
      SELECT * FROM funnelspy_monitors
      WHERE enabled = TRUE AND (
        last_checked_at IS NULL OR
        (frequency = 'daily' AND last_checked_at < NOW() - INTERVAL '1 day') OR
        (frequency = 'weekly' AND last_checked_at < NOW() - INTERVAL '7 days') OR
        (frequency = 'monthly' AND last_checked_at < NOW() - INTERVAL '30 days')
      )
      ORDER BY last_checked_at NULLS FIRST
      LIMIT 5
    `);
  return result.rows as Array<{ id: string; domain: string; frequency: string; business_id: number | null }>;
}

export async function markMonitorChecked(id: string, auditId: string) {
  await ensureSchema();
  await pool.query(
    "UPDATE funnelspy_monitors SET last_audit_id = $1, last_checked_at = NOW() WHERE id = $2",
    [auditId, id],
  );
}
