import { ApiError } from "@/lib/errors";

/**
 * Rate limiting with an optional Redis backend.
 *
 * When REDIS_URL is configured the limiter shares state across instances.
 * Otherwise an in-process sliding window is used, which is correct for a
 * single Node server (the default deployment) but not for multiple replicas.
 */
type Bucket = { count: number; resetAt: number };

const globalForLimiter = globalThis as unknown as {
  __cnRateBuckets?: Map<string, Bucket>;
  __cnRedis?: import("ioredis").Redis | null;
};

const buckets = (globalForLimiter.__cnRateBuckets ??= new Map<string, Bucket>());

async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (globalForLimiter.__cnRedis === undefined) {
    try {
      const { Redis } = await import("ioredis");
      globalForLimiter.__cnRedis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 2,
        lazyConnect: false,
      });
    } catch {
      globalForLimiter.__cnRedis = null;
    }
  }
  return globalForLimiter.__cnRedis ?? null;
}

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const redis = await getRedis();
  const now = Date.now();

  if (redis) {
    try {
      const redisKey = `rl:${key}`;
      const results = await redis
        .multi()
        .incr(redisKey)
        .pttl(redisKey)
        .exec();
      const count = Number(results?.[0]?.[1] ?? 1);
      let ttl = Number(results?.[1]?.[1] ?? -1);
      if (ttl < 0) {
        await redis.pexpire(redisKey, windowSeconds * 1000);
        ttl = windowSeconds * 1000;
      }
      return {
        success: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt: now + ttl,
        limit,
      };
    } catch {
      // fall through to the in-process limiter when Redis is unreachable
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { success: true, remaining: limit - 1, resetAt: now + windowSeconds * 1000, limit };
  }
  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    limit,
  };
}

export async function enforceRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  message?: string
) {
  const result = await rateLimit(key, limit, windowSeconds);
  if (!result.success) {
    throw ApiError.tooMany(message);
  }
  return result;
}

/** Periodically drop expired buckets so the map cannot grow unbounded. */
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, 60_000);
  // Do not keep the process alive solely for cleanup.
  if (typeof interval === "object" && "unref" in interval) interval.unref();
}
