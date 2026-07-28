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

export async function buildConsultantContext(request: AIConsultantRequest): Promise<AIConsultantContext> {
  await ensureTechnologyDataColumn();
  const businessResult = await pool.query(`SELECT ${businessSelect} FROM businesses WHERE id = $1 LIMIT 1`, [request.businessId]);
  if (!businessResult.rows[0]) throw new ConsultantContextError("business_not_found", "Business not found.", 404);
  const audit = await getAudit(request.auditId);
  if (!audit) throw new ConsultantContextError("audit_not_found", "Audit not found.", 404);
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
