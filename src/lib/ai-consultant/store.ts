import { randomUUID } from "node:crypto";
import { pool } from "@/lib/postgres";
import type { AIConsultantOutput, AIConsultantReportRecord, AIConsultantRequest, AIConsultantStatus } from "./contracts";
import { AI_CONSULTANT_ACTIVE_WINDOW_MINUTES } from "./versions";

let schemaReady = false;
export async function ensureConsultantSchema() {
  if (schemaReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_consultant_reports (
      id UUID PRIMARY KEY,
      business_id BIGINT NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
      audit_id UUID NOT NULL REFERENCES funnelspy_audits(id) ON DELETE RESTRICT,
      status VARCHAR(30) NOT NULL,
      objective VARCHAR(80) NOT NULL,
      locale VARCHAR(10) NOT NULL,
      report_style VARCHAR(30) NOT NULL,
      provider VARCHAR(100),
      model VARCHAR(100),
      prompt_version VARCHAR(100) NOT NULL,
      schema_version VARCHAR(100) NOT NULL,
      context_version VARCHAR(100) NOT NULL,
      opportunity_rules_version VARCHAR(100),
      audit_schema_version VARCHAR(100),
      scoring_version VARCHAR(100),
      request JSONB NOT NULL,
      context_summary JSONB NOT NULL,
      report JSONB,
      warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
      error_code VARCHAR(100),
      error_message TEXT,
      usage_metadata JSONB,
      request_fingerprint VARCHAR(64) NOT NULL,
      context_hash VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ai_consultant_reports_business_created_idx
      ON ai_consultant_reports(business_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS ai_consultant_reports_audit_created_idx
      ON ai_consultant_reports(audit_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS ai_consultant_reports_status_idx
      ON ai_consultant_reports(status);
    CREATE INDEX IF NOT EXISTS ai_consultant_reports_fingerprint_active_idx
      ON ai_consultant_reports(request_fingerprint, created_at DESC);
  `);
  schemaReady = true;
}

function normalizeRow(row: Record<string, unknown>): AIConsultantReportRecord {
  return {
    id: String(row.id), businessId: Number(row.business_id), auditId: String(row.audit_id),
    status: String(row.status) as AIConsultantStatus,
    objective: String(row.objective) as AIConsultantRequest["objective"],
    locale: String(row.locale) as AIConsultantRequest["locale"],
    reportStyle: String(row.report_style) as AIConsultantRequest["reportStyle"],
    provider: row.provider == null ? null : String(row.provider),
    model: row.model == null ? null : String(row.model),
    promptVersion: String(row.prompt_version), schemaVersion: String(row.schema_version),
    contextVersion: String(row.context_version),
    opportunityRulesVersion: row.opportunity_rules_version == null ? null : String(row.opportunity_rules_version),
    auditSchemaVersion: row.audit_schema_version == null ? null : String(row.audit_schema_version),
    scoringVersion: row.scoring_version == null ? null : String(row.scoring_version),
    request: row.request as AIConsultantRequest,
    contextSummary: row.context_summary as Record<string, unknown>,
    report: (row.report as AIConsultantOutput | null) || null,
    warnings: (row.warnings as string[]) || [],
    errorCode: row.error_code == null ? null : String(row.error_code),
    errorMessage: row.error_message == null ? null : String(row.error_message),
    usageMetadata: (row.usage_metadata as Record<string, unknown> | null) || null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    completedAt: row.completed_at == null ? null : new Date(String(row.completed_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function findActiveByFingerprint(fingerprint: string) {
  await ensureConsultantSchema();
  const result = await pool.query(
    `SELECT * FROM ai_consultant_reports
     WHERE request_fingerprint = $1 AND status IN ('pending','generating')
       AND created_at > NOW() - ($2::int * INTERVAL '1 minute')
     ORDER BY created_at DESC LIMIT 1`,
    [fingerprint, AI_CONSULTANT_ACTIVE_WINDOW_MINUTES],
  );
  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function createPendingReport(input: {
  request: AIConsultantRequest; fingerprint: string; contextHash: string;
  contextSummary: Record<string, unknown>; promptVersion: string; schemaVersion: string; contextVersion: string;
  opportunityRulesVersion: string; auditSchemaVersion: string; scoringVersion: string; warnings: string[];
}) {
  await ensureConsultantSchema();
  const id = randomUUID();
  const result = await pool.query(
    `INSERT INTO ai_consultant_reports
     (id,business_id,audit_id,status,objective,locale,report_style,prompt_version,schema_version,context_version,
      opportunity_rules_version,audit_schema_version,scoring_version,request,context_summary,warnings,request_fingerprint,context_hash)
     VALUES ($1,$2,$3,'pending',$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
    [id, input.request.businessId, input.request.auditId, input.request.objective, input.request.locale, input.request.reportStyle,
      input.promptVersion, input.schemaVersion, input.contextVersion, input.opportunityRulesVersion, input.auditSchemaVersion,
      input.scoringVersion, JSON.stringify(input.request), JSON.stringify(input.contextSummary), JSON.stringify(input.warnings),
      input.fingerprint, input.contextHash],
  );
  return normalizeRow(result.rows[0]);
}

export async function markGenerating(id: string) {
  await ensureConsultantSchema();
  await pool.query("UPDATE ai_consultant_reports SET status='generating', updated_at=NOW() WHERE id=$1 AND status='pending'", [id]);
}

export async function completeReport(id: string, input: {
  report: AIConsultantOutput; provider: string; model: string; warnings: string[]; usageMetadata: Record<string, unknown> | null;
}) {
  await ensureConsultantSchema();
  const result = await pool.query(
    `UPDATE ai_consultant_reports SET status='completed',report=$2,provider=$3,model=$4,warnings=$5,
      usage_metadata=$6,completed_at=NOW(),updated_at=NOW(),error_code=NULL,error_message=NULL
     WHERE id=$1 AND status IN ('pending','generating') RETURNING *`,
    [id, JSON.stringify(input.report), input.provider, input.model, JSON.stringify(input.warnings), input.usageMetadata ? JSON.stringify(input.usageMetadata) : null],
  );
  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function failReport(id: string, code: string, message: string) {
  await ensureConsultantSchema();
  const result = await pool.query(
    `UPDATE ai_consultant_reports SET status='failed',error_code=$2,error_message=$3,updated_at=NOW()
     WHERE id=$1 AND status IN ('pending','generating') RETURNING *`,
    [id, code, message],
  );
  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function getConsultantReport(id: string) {
  await ensureConsultantSchema();
  const result = await pool.query("SELECT * FROM ai_consultant_reports WHERE id=$1 LIMIT 1", [id]);
  return result.rows[0] ? normalizeRow(result.rows[0]) : null;
}

export async function listConsultantReports(filters: { businessId?: number; auditId?: string; status?: AIConsultantStatus; limit?: number } = {}) {
  await ensureConsultantSchema();
  const values: unknown[] = [];
  const where: string[] = [];
  if (filters.businessId) { values.push(filters.businessId); where.push(`business_id=$${values.length}`); }
  if (filters.auditId) { values.push(filters.auditId); where.push(`audit_id=$${values.length}`); }
  if (filters.status) { values.push(filters.status); where.push(`status=$${values.length}`); }
  values.push(Math.min(Math.max(filters.limit || 30, 1), 100));
  const result = await pool.query(
    `SELECT * FROM ai_consultant_reports ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY created_at DESC LIMIT $${values.length}`,
    values,
  );
  return result.rows.map(normalizeRow);
}
