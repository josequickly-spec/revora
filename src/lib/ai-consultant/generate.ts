import type { AIConsultantProvider } from "./provider";
import { OpenAIConsultantProvider } from "./provider";
import type { AIConsultantRequest } from "./contracts";
import { buildConsultantContext } from "./context";
import { buildConsultantPrompt } from "./prompt";
import { safeProviderError } from "./sanitization";
import { validateConsultantOutput } from "./validation";
import { consultantRequestFingerprint } from "./request";
import {
  createPendingReport, completeReport, failReport, findActiveByFingerprint, markGenerating,
} from "./store";
import {
  AI_CONSULTANT_CONTEXT_VERSION, AI_CONSULTANT_PROMPT_VERSION, AI_CONSULTANT_SCHEMA_VERSION,
} from "./versions";

export async function generateConsultantReport(
  request: AIConsultantRequest,
  provider: AIConsultantProvider = new OpenAIConsultantProvider(),
) {
  const context = await buildConsultantContext(request);
  const fingerprint = consultantRequestFingerprint(request, context.contextHash);
  if (!request.regenerate) {
    const active = await findActiveByFingerprint(fingerprint);
    if (active) return { report: active, reused: true };
  }
  const pending = await createPendingReport({
    request, fingerprint, contextHash: context.contextHash,
    contextSummary: {
      evidenceReferences: context.evidenceCatalog,
      opportunityIds: context.opportunities.map(item => item.id),
      unavailableFacts: context.unavailableFacts,
    },
    promptVersion: AI_CONSULTANT_PROMPT_VERSION, schemaVersion: AI_CONSULTANT_SCHEMA_VERSION,
    contextVersion: AI_CONSULTANT_CONTEXT_VERSION,
    opportunityRulesVersion: context.sourceVersions.opportunityRules,
    auditSchemaVersion: context.sourceVersions.audit,
    scoringVersion: context.sourceVersions.scoring,
    warnings: context.knownLimitations,
  });
  try {
    await markGenerating(pending.id);
    const generated = await provider.generateStructuredReport(buildConsultantPrompt(request, context));
    const validated = validateConsultantOutput(generated.output, context);
    const completed = await completeReport(pending.id, {
      report: validated, provider: generated.provider, model: generated.model,
      warnings: [...context.knownLimitations, ...generated.warnings],
      usageMetadata: generated.usage ? { ...generated.usage, latencyMs: generated.latencyMs, requestId: generated.requestId, finishReason: generated.finishReason } : { latencyMs: generated.latencyMs },
    });
    if (!completed) throw new Error("report_state_conflict");
    return { report: completed, reused: false };
  } catch (error) {
    const providerError = error as { name?: string; code?: string; status?: number; message?: string };
    console.error("AI consultant generation failed", {
      name: providerError?.name,
      code: providerError?.code,
      status: providerError?.status,
      message: providerError?.message,
      attempts: Array.isArray((error as { attempts?: unknown }).attempts)
        ? (error as { attempts: unknown[] }).attempts.slice(0, 4)
        : undefined,
    });
    const failure = (error as { code?: string })?.code === "missing_api_key"
      ? { code: "missing_api_key", message: "AI Consultant is not configured." }
      : error instanceof Error && /unknown_evidence|altered_evidence|unsupported_numeric_claim|recommendation_without_evidence|malformed|validation/i.test(error.message)
        ? { code: "invalid_provider_output", message: "The AI response failed evidence or factuality validation." }
        : safeProviderError(error);
    await failReport(pending.id, failure.code, failure.message);
    const safeError = new Error(failure.message) as Error & { code: string; reportId: string };
    safeError.code = failure.code;
    safeError.reportId = pending.id;
    throw safeError;
  }
}
