const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function sanitizeText(value: string, maxLength = 2_000) {
  return value.replace(CONTROL_CHARACTERS, "").trim().slice(0, maxLength);
}

export function safeProviderError(error: unknown) {
  const candidate = error as { status?: number; code?: string; name?: string };
  if (candidate?.status === 429 || candidate?.code === "provider_rate_limited") return { code: "provider_rate_limited", message: "The AI provider is temporarily rate limited." };
  if (candidate?.name === "AbortError" || candidate?.code === "ETIMEDOUT" || candidate?.code === "provider_timeout") return { code: "provider_timeout", message: "The AI provider timed out." };
  if (candidate?.status === 404 || candidate?.code === "model_not_found" || candidate?.code === "provider_model_unavailable") return { code: "provider_model_unavailable", message: "The configured AI model is unavailable for this account." };
  return { code: "provider_error", message: "The AI provider could not generate the strategy." };
}
