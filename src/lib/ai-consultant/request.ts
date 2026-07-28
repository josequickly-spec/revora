import { createHash } from "node:crypto";
import type { AIConsultantRequest } from "./contracts.ts";
import { AI_CONSULTANT_CONTEXT_VERSION, AI_CONSULTANT_PROMPT_VERSION } from "./versions.ts";

export function consultantRequestFingerprint(request: AIConsultantRequest, contextHash: string) {
  const normalized = {
    businessId: request.businessId, auditId: request.auditId, objective: request.objective,
    locale: request.locale, reportStyle: request.reportStyle,
    selectedOpportunityIds: [...(request.selectedOpportunityIds || [])].sort(),
    userInstructionsHash: createHash("sha256").update(request.userInstructions || "").digest("hex"),
    requestedSections: [...(request.requestedSections || [])].sort(),
    promptVersion: AI_CONSULTANT_PROMPT_VERSION, contextVersion: AI_CONSULTANT_CONTEXT_VERSION, contextHash,
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}
