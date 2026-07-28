const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const UNSAFE_CLAIM = /(?:(?<!not\s)guaranteed?|will\s+(?:produce|generate|double)|\b\d+(?:\.\d+)?\s?%\s+(?:roi|return|conversion|increase)|pay for itself|\$\s?\d[\d,.]*\s+(?:revenue|profit))/i;

export function sanitizeProposalText(value: string, max = 10_000) {
  return value.replace(CONTROL, "").replace(/<script[\s\S]*?<\/script>/gi, "").trim().slice(0, max);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character);
}

export function assertNoUnsupportedFinancialClaims(value: unknown) {
  const texts: string[] = [];
  const collect = (candidate: unknown) => {
    if (typeof candidate === "string") texts.push(candidate);
    else if (Array.isArray(candidate)) candidate.forEach(collect);
    else if (candidate && typeof candidate === "object") Object.values(candidate).forEach(collect);
  };
  collect(value);
  if (texts.some(text => UNSAFE_CLAIM.test(text))) throw new Error("unsupported_financial_claim");
}
