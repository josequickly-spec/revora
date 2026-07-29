import { cacheCommand, redisConfigured } from "@/lib/cache";

const local = new Map<string, { count: number; resetAt: number }>();
const MAX_LOCAL_BUCKETS = 10_000;

export async function rateLimit(key: string, limit: number, windowSeconds = 60) {
  if (redisConfigured()) {
    const redisKey = `rate:${key}`;
    const count = Number(await cacheCommand(["INCR", redisKey]));
    if (count === 1) await cacheCommand(["EXPIRE", redisKey, windowSeconds]);
    const ttl = Number(await cacheCommand(["TTL", redisKey]));
    return { allowed: count <= limit, retryAfter: Math.max(ttl, 1), distributed: true };
  }
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
