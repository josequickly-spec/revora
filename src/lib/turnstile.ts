type TurnstileResponse = { success?: boolean };

export async function validateTurnstile(token: unknown, remoteIp?: string | null) {
  // Explicit opt-in for the isolated local runtime. Production remains fail-closed.
  if (process.env.LOCAL_ISOLATED_RUNTIME === "true") {
    return { configured: false, valid: true } as const;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  console.log("[Turnstile] Validating token. Secret configured:", !!secret, "SiteKey configured:", !!siteKey);

  // If Turnstile is not configured at all, allow any token (including empty)
  if (!secret || !siteKey) {
    console.log("[Turnstile] Not configured, allowing token");
    return { configured: false, valid: true } as const;
  }

  // If Turnstile IS configured, token must be a non-empty string
  if (typeof token !== "string" || !token.trim()) return { configured: true, valid: false } as const;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    const result = await response.json() as TurnstileResponse;
    return { configured: true, valid: Boolean(response.ok && result.success) } as const;
  } catch {
    return { configured: true, valid: false } as const;
  }
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}
