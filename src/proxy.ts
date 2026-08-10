import { NextRequest, NextResponse } from "next/server";
import type { Permission } from "@/lib/enterprise/contracts";
import {
  EnterpriseError,
  requireLegacyDatasetAccess,
  requirePermission,
} from "@/lib/enterprise/store";
import { rateLimit } from "@/lib/rate-limit";

const publicApiPrefixes = [
  "/api/auth/",
  "/api/public/",
  "/api/billing/webhook",
  "/api/funnel-leads",
  "/api/health",
  "/api/observability/health",
  "/api/observability/metrics",
  "/api/openapi",
  "/api/outreach/webhooks/",
  "/api/outreach/worker",
  "/api/workflows/worker",
  "/api/webhooks/",
];

const tenantNativePrefixes = [
  "/api/billing",
  "/api/executive",
  "/api/notifications",
  "/api/observability/alerts",
  "/api/organization",
  "/api/security",
  "/api/v1",
  "/api/warehouse",
  "/api/workflows",
];

function isPublicApi(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (request.method === "GET" && pathname === "/api/funnels" && request.nextUrl.searchParams.has("slug")) return true;
  if (request.method === "GET" && pathname === "/api/funnelspy/monitor") return true;
  return publicApiPrefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix));
}

function permissionFor(request: NextRequest): Permission {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/security/")) return "security.manage";
  if (pathname.startsWith("/api/billing/")) return request.method === "GET" ? "billing.read" : "billing.manage";
  if (pathname.startsWith("/api/workflows") || pathname.startsWith("/api/warehouse")) {
    return request.method === "GET" ? "workflow.read" : "workflow.manage";
  }
  return request.method === "GET" ? "crm.read" : "crm.write";
}

function isPublicPage(pathname: string) {
  return pathname === "/" ||
    pathname === "/login" ||
    pathname === "/docs/api" ||
    /^\/(?:en|es)\/funnel\/[^/]+$/.test(pathname) ||
    /^\/funnel\/[^/]+$/.test(pathname) ||
    /^\/proposal\/[^/]+$/.test(pathname) ||
    /^\/shared\/funnelspy\/[^/]+$/.test(pathname) ||
    /^\/unsubscribe\/[^/]+$/.test(pathname);
}

function hasSameOrigin(request: NextRequest, origin: string | null) {
  if (!origin) return false;
  const host = request.headers.get("host");
  if (!host) return origin === request.nextUrl.origin;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = process.env.TRUST_PROXY === "true" && forwardedProtocol
    ? forwardedProtocol
    : new URL(request.url).protocol.replace(":", "");
  return origin === `${protocol}://${host}`;
}

function requestOrigin(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || request.nextUrl.protocol.replace(":", "");
  return host ? `${protocol}://${host}` : request.nextUrl.origin;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""} https://challenges.cloudflare.com`.trim(),
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "frame-src 'self' https://challenges.cloudflare.com",
    "connect-src 'self' https://api.openai.com https://api.stripe.com https://*.upstash.io https://challenges.cloudflare.com",
  ].join("; ");
  const reject = (body: Record<string, string>, status: number, headers?: Record<string, string>) =>
    NextResponse.json(body, {
      status,
      headers: { "Content-Security-Policy": policy, ...headers },
    });
  if (pathname === "/login" && isDev && process.env.LOCAL_AUTH_BYPASS === "true") {
    return NextResponse.redirect(new URL("/crm", requestOrigin(request)), {
      headers: { "Content-Security-Policy": policy },
    });
  }
  if (pathname.startsWith("/api/")) {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 2_000_000) return reject({ error: "Request body is too large.", code: "payload_too_large" }, 413);
    const ip = process.env.TRUST_PROXY === "true"
      ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "proxy-unknown"
      : "direct";
    if (!["/api/health", "/api/observability/health"].includes(pathname)) {
      const apiClass = pathname.startsWith("/api/auth/")
        ? "auth"
        : pathname === "/api/funnel-leads"
          ? "lead-capture"
          : pathname.includes("/ai") || pathname.includes("/generate") || pathname.includes("/analyze")
            ? "expensive"
            : "api";
      const windowMs = 60_000;
      const limit = apiClass === "auth"
        ? 20
        : apiClass === "lead-capture"
          ? 10
          : apiClass === "expensive"
            ? 12
            : process.env.LOCAL_ISOLATED_RUNTIME === "true"
              ? 1_200
              : 300;
      let bucket;
      try {
        bucket = await rateLimit(`${ip}:${apiClass}`, limit, windowMs / 1000);
      } catch {
        return reject(
          { error: "Rate limiting unavailable.", code: "rate_limit_unavailable" },
          503,
        );
      }
      if (!bucket.allowed) return reject(
        { error: "Rate limit exceeded.", code: "rate_limited" },
        429,
        { "Retry-After": String(bucket.retryAfter) },
      );
    }
    const unsafe = !["GET", "HEAD", "OPTIONS"].includes(request.method);
    const hasSessionCookie = request.cookies.has("revora_access") || request.cookies.has("revora_refresh");
    const hasBearer = request.headers.has("authorization");
    if (unsafe && hasSessionCookie && !hasBearer) {
      const origin = request.headers.get("origin");
      if (!hasSameOrigin(request, origin)) return reject({ error: "CSRF validation failed.", code: "csrf_failed" }, 403);
    }
    if (!isPublicApi(request)) {
      try {
        const context = await requirePermission(request, permissionFor(request));
        if (!tenantNativePrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
          await requireLegacyDatasetAccess(context);
        }
      } catch (error) {
        const status = error instanceof EnterpriseError ? error.status : 503;
        const code = error instanceof EnterpriseError ? error.code : "authentication_unavailable";
        const message = error instanceof EnterpriseError ? error.message : "Authentication is temporarily unavailable.";
        return reject({ error: message, code }, status);
      }
    }
  } else if (!isPublicPage(pathname)) {
    try {
      await requirePermission(request, "crm.read");
    } catch {
      if (request.cookies.has("revora_refresh")) {
        const refresh = new URL("/api/auth/refresh", requestOrigin(request));
        refresh.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(refresh, { headers: { "Content-Security-Policy": policy } });
      }
      const login = new URL("/login", requestOrigin(request));
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login, { headers: { "Content-Security-Policy": policy } });
    }
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  response.headers.set("X-Request-Id", request.headers.get("x-request-id") || crypto.randomUUID());
  response.headers.set("X-WAF-Ready", "true");
  return response;
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
