import type { StoredAudit } from "@/lib/funnelspy-store";

export const AUDIT_FRESHNESS_DAYS = 7;
export const AUDIT_FRESHNESS_MS = AUDIT_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

export function isReusableAudit(audit: StoredAudit, now = Date.now()) {
  const completed = Boolean(audit.analysis?.analyzedAt && audit.analysis.pages?.length);
  const age = now - new Date(audit.createdAt).getTime();
  return completed && age >= 0 && age <= AUDIT_FRESHNESS_MS;
}

export function normalizeAuditDomain(input: string) {
  const url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP or HTTPS URLs are supported.");
  return url.hostname.toLowerCase().replace(/^www\./, "");
}
