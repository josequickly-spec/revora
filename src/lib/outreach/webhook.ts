import { createHmac, timingSafeEqual } from "node:crypto";
export function verifyWebhookSignature(raw:string, signature:string, timestamp:string, secret:string, now=Date.now()) {
  const stamp=Number(timestamp);
  if (!Number.isFinite(stamp) || Math.abs(now-stamp)>5*60_000) return false;
  const expected=createHmac("sha256",secret).update(`${timestamp}.${raw}`).digest("hex");
  const a=Buffer.from(expected), b=Buffer.from(signature);
  return a.length===b.length && timingSafeEqual(a,b);
}
export function classifyProviderEvent(type:string) {
  return ({ delivered:"delivered", bounced:"bounced", complaint:"complaint", replied:"replied", opened:"opened", clicked:"clicked", deferred:"deferred" } as Record<string,string>)[type] || "unknown";
}
