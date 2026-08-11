type TurnstileResponse = {
  success?: boolean;
  challenge_ts?: string;
  hostname?: string;
  error_codes?: string[];
};

export async function validateTurnstile(token: unknown, remoteIp?: string | null) {
  const isDev = process.env.NODE_ENV === "development";
  const isLocalhost = typeof window === "undefined"; // SSR

  // Allow in development/localhost without validation
  if (isDev || process.env.TURNSTILE_SKIP_VALIDATION === "true") {
    return { configured: true, valid: true, skipped: true } as const;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // If Turnstile is not configured, fail-open (allow)
  if (!secret || !siteKey) {
    console.warn("[Turnstile] ⚠️ Not configured - configure TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    return { configured: false, valid: true } as const;
  }

  // Token must be a non-empty string
  if (typeof token !== "string" || !token.trim()) {
    console.warn("[Turnstile] ❌ Invalid token format");
    return { configured: true, valid: false, error: "missing_token" } as const;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const result = (await response.json()) as TurnstileResponse;

    if (!response.ok) {
      console.error("[Turnstile] ❌ API error:", response.status, result.error_codes);
      return { configured: true, valid: false, error: `api_error_${response.status}` } as const;
    }

    const isValid = Boolean(result.success);
    console.log(`[Turnstile] ${isValid ? "✅" : "❌"} Validation ${isValid ? "passed" : "failed"}`, {
      hostname: result.hostname,
      timestamp: result.challenge_ts,
      errors: result.error_codes,
    });

    return { configured: true, valid: isValid, errors: result.error_codes } as const;
  } catch (error) {
    console.error("[Turnstile] ❌ Validation error:", error instanceof Error ? error.message : String(error));
    return { configured: true, valid: false, error: "validation_exception" } as const;
  }
}

export function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}
