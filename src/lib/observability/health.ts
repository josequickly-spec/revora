import { pool } from "@/lib/postgres";
import { cacheStatus } from "@/lib/cache";

export async function healthSnapshot() {
  const started = Date.now();
  let database: "up" | "down" = "down";
  try {
    await pool.query("SELECT 1");
    database = "up";
  } catch {}
  const authentication = process.env.AUTH_JWT_SECRET && process.env.AUTH_ENCRYPTION_KEY
    ? "configured"
    : "missing";
  const dependencies = {
    database,
    authentication,
    cache: cacheStatus(),
    openai: process.env.OPENAI_API_KEY ? "configured" : "optional",
    stripe: process.env.STRIPE_SECRET_KEY ? "configured" : "optional",
    otlp: process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? "configured" : "optional",
  };
  const cache = cacheStatus();
  const cacheReady = process.env.NODE_ENV !== "production" || cache === "redis";
  const ok = database === "up" && authentication === "configured" && cacheReady;
  return {
    ok,
    status: ok ? "ready" : "degraded",
    dependencies,
    latencyMs: Date.now() - started,
    timestamp: new Date().toISOString(),
  };
}
