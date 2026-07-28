const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SCRIPT = /<script[\s\S]*?<\/script>/gi;
const EVENT_HANDLER = /\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const UNSAFE = /(?:guaranteed?|will\s+(?:double|produce|generate)|\b\d+(?:\.\d+)?\s?%\s+(?:roi|return|conversion|increase)|pay for itself|\$\s?\d[\d,.]*\s+(?:revenue|profit))/i;
const DECEPTIVE_SUBJECT = /^(?:re|fwd)\s*:/i;

export function sanitizeOutreachText(value: string, max = 10_000) {
  return value.replace(CONTROL, "").replace(SCRIPT, "").replace(EVENT_HANDLER, "").trim().slice(0, max);
}
export function escapeOutreachHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" })[char] || char);
}
export function assertSafeOutreachContent(subject: string, body: string) {
  if (DECEPTIVE_SUBJECT.test(subject)) throw new Error("deceptive_subject");
  if (UNSAFE.test(`${subject}\n${body}`)) throw new Error("unsupported_claim");
  if (/<script|\son\w+=|javascript:/i.test(`${subject}\n${body}`)) throw new Error("unsafe_html");
  if (!body.includes("{{unsubscribe_url}}")) throw new Error("unsubscribe_required");
  if (!body.includes("{{physical_address}}")) throw new Error("physical_address_required");
}
