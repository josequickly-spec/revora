import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createPublicProposalToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashPublicProposalToken(token), prefix: token.slice(0, 8) };
}

export function hashPublicProposalToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function tokenHashesEqual(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
