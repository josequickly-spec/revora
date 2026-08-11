import { assertPublicHostname, isPrivateOrLocalAddress, normalizePublicHttpUrl } from "@/lib/public-url-security";

export function normalizeBusinessDomain(input: string) {
  const raw = input.trim();
  const url = normalizePublicHttpUrl(raw);
  return {
    domain: url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, ""),
    originalUrl: raw,
  };
}

export function isPrivateAddress(address: string) {
  return isPrivateOrLocalAddress(address);
}

export async function assertPublicDomain(domain: string) {
  await assertPublicHostname(domain);
}
