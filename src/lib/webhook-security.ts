import { createHmac, timingSafeEqual } from "node:crypto";

function equalText(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyHexHmac(raw: string, signature: string, secret: string, prefix = "") {
  const expected = `${prefix}${createHmac("sha256", secret).update(raw).digest("hex")}`;
  return equalText(expected, signature);
}

export function verifyTimestampedHexHmac(
  raw: string,
  signature: string,
  timestamp: string,
  secret: string,
  now = Date.now(),
) {
  const stamp = Number(timestamp);
  if (!Number.isFinite(stamp) || Math.abs(now - stamp) > 5 * 60_000) return false;
  return verifyHexHmac(`${timestamp}.${raw}`, signature, secret);
}

export function verifySvixSignature(
  raw: string,
  messageId: string,
  timestamp: string,
  signatures: string,
  secret: string,
  now = Date.now(),
) {
  const stamp = Number(timestamp);
  if (!messageId || !Number.isFinite(stamp) || Math.abs(now / 1000 - stamp) > 5 * 60) return false;
  const key = secret.startsWith("whsec_")
    ? Buffer.from(secret.slice(6), "base64")
    : Buffer.from(secret);
  const expected = createHmac("sha256", key)
    .update(`${messageId}.${timestamp}.${raw}`)
    .digest("base64");
  return signatures.split(/\s+/).some(value => {
    const [, signature] = value.split(",", 2);
    return signature ? equalText(expected, signature) : false;
  });
}
