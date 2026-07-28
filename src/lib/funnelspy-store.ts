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
};

const memory = new Map<string, StoredAudit>();
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
    CREATE INDEX IF NOT EXISTS funnelspy_audits_domain_created_idx
      ON funnelspy_audits(domain, created_at DESC);
    CREATE TABLE IF NOT EXISTS funnelspy_monitors (
      id UUID PRIMARY KEY,
      domain TEXT UNIQUE NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'weekly',
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      last_audit_id UUID,
      last_checked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
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
  };
}

export async function saveAudit(analysis: FunnelSpyAnalysis, report: FunnelAIReport | null = null) {
  const audit: StoredAudit = {
    id: randomUUID(),
    domain: analysis.domain,
    analysis,
    report,
    createdAt: new Date().toISOString(),
    shareToken: randomUUID(),
  };
  memory.set(audit.id, audit);
  try {
    await ensureSchema();
    const result = await pool.query(
      `INSERT INTO funnelspy_audits (id, domain, analysis, report, share_token, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [audit.id, audit.domain, JSON.stringify(analysis), report ? JSON.stringify(report) : null, audit.shareToken, audit.createdAt],
    );
    return normalizeRow(result.rows[0]);
  } catch (error) {
    console.warn("FunnelSpy persistence unavailable; using memory store.", error);
    return audit;
  }
}

export async function attachReport(id: string, report: FunnelAIReport) {
  const cached = memory.get(id);
  if (cached) memory.set(id, { ...cached, report });
  try {
    await ensureSchema();
    await pool.query("UPDATE funnelspy_audits SET report = $1 WHERE id = $2", [JSON.stringify(report), id]);
  } catch {
    // Memory remains the graceful local fallback.
  }
}

export async function listAudits(domain?: string, limit = 30) {
  try {
    await ensureSchema();
    const result = domain
      ? await pool.query("SELECT * FROM funnelspy_audits WHERE domain = $1 ORDER BY created_at DESC LIMIT $2", [domain, limit])
      : await pool.query("SELECT * FROM funnelspy_audits ORDER BY created_at DESC LIMIT $1", [limit]);
    return result.rows.map(normalizeRow);
  } catch {
    return [...memory.values()]
      .filter((item) => !domain || item.domain === domain)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

export async function getAudit(idOrShareToken: string) {
  const cached = [...memory.values()].find((item) => item.id === idOrShareToken || item.shareToken === idOrShareToken);
  try {
    await ensureSchema();
    const result = await pool.query("SELECT * FROM funnelspy_audits WHERE id::text = $1 OR share_token::text = $1 LIMIT 1", [idOrShareToken]);
    return result.rows[0] ? normalizeRow(result.rows[0]) : cached || null;
  } catch {
    return cached || null;
  }
}

export async function upsertMonitor(domain: string, frequency = "weekly") {
  const id = randomUUID();
  try {
    await ensureSchema();
    const result = await pool.query(
      `INSERT INTO funnelspy_monitors (id, domain, frequency) VALUES ($1, $2, $3)
       ON CONFLICT (domain) DO UPDATE SET frequency = EXCLUDED.frequency, enabled = TRUE
       RETURNING *`,
      [id, domain, frequency],
    );
    return result.rows[0];
  } catch {
    return { id, domain, frequency, enabled: true, created_at: new Date().toISOString() };
  }
}

export async function listDueMonitors() {
  try {
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
    return result.rows as Array<{ id: string; domain: string; frequency: string }>;
  } catch {
    return [];
  }
}

export async function markMonitorChecked(id: string, auditId: string) {
  try {
    await ensureSchema();
    await pool.query(
      "UPDATE funnelspy_monitors SET last_audit_id = $1, last_checked_at = NOW() WHERE id = $2",
      [auditId, id],
    );
  } catch {
    // Optional persistence.
  }
}
