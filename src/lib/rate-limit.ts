import { cacheCommand, redisConfigured } from "@/lib/cache";

const local = new Map<string, { count: number; resetAt: number }>();
const MAX_LOCAL_BUCKETS = 10_000;

function localRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Date.now();
  if (local.size >= MAX_LOCAL_BUCKETS) {
    for (const [bucketKey, bucket] of local) if (bucket.resetAt <= now) local.delete(bucketKey);
    if (local.size >= MAX_LOCAL_BUCKETS) local.delete(local.keys().next().value as string);
  }
  const bucket = local.get(key);
  if (!bucket || bucket.resetAt <= now) {
    local.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfter: windowSeconds, distributed: false };
  }
  bucket.count++;
  return {
    allowed: bucket.count <= limit,
    retryAfter: Math.max(Math.ceil((bucket.resetAt - now) / 1000), 1),
    distributed: false,
  };
}

export async function rateLimit(key: string, limit: number, windowSeconds = 60) {
  if (redisConfigured()) {
    try {
      const redisKey = `rate:${key}`;
      const count = Number(await cacheCommand(["INCR", redisKey]));
      if (count === 1) await cacheCommand(["EXPIRE", redisKey, windowSeconds]);
      let ttl = Number(await cacheCommand(["TTL", redisKey]));
      if (ttl < 0) {
        await cacheCommand(["EXPIRE", redisKey, windowSeconds]);
        ttl = windowSeconds;
      }
      return { allowed: count <= limit, retryAfter: Math.max(ttl, 1), distributed: true };
    } catch (error) {
      if (process.env.RATE_LIMIT_ALLOW_LOCAL_FALLBACK !== "true") throw error;
    }
  }
  return localRateLimit(key, limit, windowSeconds);
}
