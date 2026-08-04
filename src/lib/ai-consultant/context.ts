import { pool, businessSelect, ensureTechnologyDataColumn } from "@/lib/postgres";
import { getAudit } from "@/lib/funnelspy-store";
import type { AIConsultantContext, AIConsultantRequest } from "./contracts";
import { assembleConsultantContext, ConsultantAssemblyError } from "./assemble";

export class ConsultantContextError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

function normalizedDomain(value: unknown) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  }
}

export async function buildConsultantContext(request: AIConsultantRequest): Promise<AIConsultantContext> {
  await ensureTechnologyDataColumn();
  const businessResult = await pool.query(`SELECT ${businessSelect} FROM businesses WHERE id = $1 LIMIT 1`, [request.businessId]);
  if (!businessResult.rows[0]) throw new ConsultantContextError("business_not_found", "Business not found.", 404);
  let audit = await getAudit(request.auditId);
  if (!audit) throw new ConsultantContextError("audit_not_found", "Audit not found.", 404);
  if (audit.businessId === null) {
    const businessDomain = normalizedDomain(businessResult.rows[0].domain);
    const auditDomain = normalizedDomain(audit.domain);
    if (!businessDomain || businessDomain !== auditDomain) {
      throw new ConsultantContextError("association_mismatch", "Audit domain does not match this business.", 409);
    }
    const associated = await pool.query(
      "UPDATE funnelspy_audits SET business_id=$1 WHERE id=$2 AND business_id IS NULL RETURNING id",
      [request.businessId, audit.id],
    );
    if (!associated.rows[0]) {
      audit = await getAudit(request.auditId);
      if (!audit) throw new ConsultantContextError("audit_not_found", "Audit not found.", 404);
    } else {
      audit = { ...audit, businessId: request.businessId };
    }
  }
  if (audit.businessId !== request.businessId) {
    throw new ConsultantContextError("association_mismatch", "Audit is not associated with this business.", 409);
  }
  try {
    return assembleConsultantContext(request, businessResult.rows[0] as Record<string, unknown>, audit);
  } catch (error) {
    if (error instanceof ConsultantAssemblyError) throw new ConsultantContextError(error.code, error.message, error.status);
    throw error;
  }
}
