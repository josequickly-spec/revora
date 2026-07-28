import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

export function normalizeBusinessDomain(input: string) {
  const raw = input.trim();
  if (!raw) throw new Error("A public business domain is required");
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error("The business URL is malformed");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only public HTTP or HTTPS websites are supported");
  const domain = url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  if (!domain || domain === "localhost" || domain.endsWith(".local") || domain.endsWith(".internal")) {
    throw new Error("Local or private destinations are not supported");
  }
  return { domain, originalUrl: raw };
}

export function isPrivateAddress(address: string) {
  if (!isIP(address)) return false;
  if (address === "::1" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  const parts = address.split(".").map(Number);
  return parts.length === 4 && (
    parts[0] === 10 || parts[0] === 127 || parts[0] === 0 ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

export async function assertPublicDomain(domain: string) {
  if (isIP(domain)) {
    if (isPrivateAddress(domain)) throw new Error("Private network destinations are not supported");
    return;
  }
  const addresses = await lookup(domain, { all: true });
  if (!addresses.length || addresses.some(entry => isPrivateAddress(entry.address))) {
    throw new Error("The domain resolves to a private or unavailable destination");
  }
}
