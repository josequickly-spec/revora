import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export function normalizePublicHttpUrl(input: string) {
  const raw = input.trim();
  if (!raw) throw new Error("A public HTTP or HTTPS URL is required.");
  const explicitScheme = raw.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
  if (explicitScheme && !["http", "https"].includes(explicitScheme)) throw new Error("Only HTTP or HTTPS URLs are supported.");
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error("The URL is malformed.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP or HTTPS URLs are supported.");
  url.hash = "";
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || host === "metadata.google.internal") {
    throw new Error("Local or private destinations are not supported.");
  }
  if (isIP(host) && isPrivateOrLocalAddress(host)) throw new Error("Local or private destinations are not supported.");
  return url;
}

export function isPrivateOrLocalAddress(address: string) {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("::ffff:")) return isPrivateOrLocalAddress(normalized.slice(7));
  if (isIP(normalized) !== 4) return false;
  const parts = normalized.split(".").map(Number);
  return parts[0] === 0 || parts[0] === 10 || parts[0] === 127 ||
    (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
    (parts[0] === 169 && parts[1] === 254) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) || parts[0] >= 224;
}

export async function assertPublicHostname(hostname: string) {
  hostname = hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname)) {
    if (isPrivateOrLocalAddress(hostname)) throw new Error("Local or private destinations are not supported.");
    return;
  }
  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await lookup(hostname, { all: true });
  } catch {
    throw new Error("The public hostname could not be resolved.");
  }
  if (!addresses.length || addresses.some(result => isPrivateOrLocalAddress(result.address))) {
    throw new Error("The hostname resolves to a local or private destination.");
  }
}
