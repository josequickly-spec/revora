import { NextRequest, NextResponse } from "next/server";

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/")) {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 2_000_000) return NextResponse.json({ error: "Request body is too large.", code: "payload_too_large" }, { status: 413 });
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
    const windowMs = 60_000, limit = pathname.startsWith("/api/auth/") ? 20 : 300;
    const bucketKey = `${ip}:${pathname.startsWith("/api/auth/") ? "auth" : "api"}`, now = Date.now();
    const bucket = rateBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) rateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
    else {
      bucket.count++;
      if (bucket.count > limit) return NextResponse.json({ error: "Rate limit exceeded.", code: "rate_limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) } });
    }
    const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const hasSessionCookie = request.cookies.has("revora_access") || request.cookies.has("revora_refresh");
    const hasBearer = request.headers.has("authorization");
    if (unsafe && hasSessionCookie && !hasBearer) {
      const origin = request.headers.get("origin");
      if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: "CSRF validation failed.", code: "csrf_failed" }, { status: 403 });
    }
  }
  const response = NextResponse.next();
  response.headers.set("X-Request-Id", request.headers.get("x-request-id") || crypto.randomUUID());
  response.headers.set("X-WAF-Ready", "true");
  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
