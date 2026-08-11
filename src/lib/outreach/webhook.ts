import { createHmac, timingSafeEqual } from "node:crypto";

const eventMap:Record<string,string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complaint",
  "email.opened": "opened",
  "email.clicked": "clicked",
  "email.delivery_delayed": "delivery_delayed",
  "email.failed": "failed",
  "email.suppressed": "suppressed",
};

export function classifyProviderEvent(type:string) {
  return eventMap[type] || ({ delivered:"delivered", bounced:"bounced", complaint:"complaint", replied:"replied", opened:"opened", clicked:"clicked", deferred:"delivery_delayed" } as Record<string,string>)[type] || "unknown";
}

export function verifyWebhookSignature(raw:string, signature:string, timestamp:string, secret:string, now=Date.now()) {
  const stamp=Number(timestamp);
  if(!Number.isFinite(stamp)||Math.abs(now-stamp)>5*60_000) return false;
  const expected=createHmac("sha256",secret).update(`${timestamp}.${raw}`).digest("hex");
  const a=Buffer.from(expected),b=Buffer.from(signature);
  return a.length===b.length&&timingSafeEqual(a,b);
}
