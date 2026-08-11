import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
export function createUnsubscribeToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashUnsubscribeToken(token), prefix: token.slice(0,8) };
}
export function hashUnsubscribeToken(token: string) { return createHash("sha256").update(token).digest("hex"); }
export function tokenHashEqual(left: string, right: string) {
  const a=Buffer.from(left,"hex"), b=Buffer.from(right,"hex");
  return a.length === b.length && timingSafeEqual(a,b);
}
