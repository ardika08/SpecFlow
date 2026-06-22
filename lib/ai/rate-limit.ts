/**
 * Rate limiting and usage tracking for AI endpoints
 * Supports Redis for production with in-memory fallback for development
 */

import { headers } from "next/headers";

// Rate limit configuration per tier
export const RATE_LIMITS = {
  Freemium: {
    requestsPerMinute: 3,
    requestsPerDay: 5,
  },
  Starter: {
    requestsPerMinute: 10,
    requestsPerDay: 100,
  },
  Pro: {
    requestsPerMinute: 60,
    requestsPerDay: Infinity,
  },
} as const;

// Redis client (lazy loaded)
let redisClient: import("ioredis").Redis | null = null;
let redisAvailable = false;

// In-memory rate limit tracking (fallback for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Initialize Redis client if REDIS_URL is configured
 */
async function getRedisClient(): Promise<import("ioredis").Redis | null> {
  if (redisAvailable && redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null; // Fallback to in-memory
  }

  try {
    // Dynamic import to avoid loading ioredis when not needed
    const Redis = (await import("ioredis")).default;
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    // Test connection
    await redisClient.ping();
    redisAvailable = true;
    console.log("Redis rate limiting enabled");
    return redisClient;
  } catch (error) {
    console.error("Failed to connect to Redis, falling back to in-memory:", error);
    redisAvailable = false;
    redisClient = null;
    return null;
  }
}

/**
 * Check if a request is within rate limits (Redis or in-memory)
 */
export async function checkRateLimit(
  userId: string,
  tier: "Freemium" | "Starter" | "Pro" = "Freemium"
): Promise<{ allowed: boolean; remaining?: number; resetAt?: Date }> {
  const limits = RATE_LIMITS[tier];
  const now = Date.now();
  const minuteWindow = 60 * 1000;
  const key = `ratelimit:${userId}`;
  const resetTime = now + minuteWindow;

  // Try Redis first
  const redis = await getRedisClient();
  if (redis) {
    try {
      // Use Redis INCR with EXPIRE for atomic rate limiting
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, 60); // Expire after 60 seconds

      const results = (await pipeline.exec()) as [Error | null, number][];
      const currentCount = results[0][1];

      if (currentCount > limits.requestsPerMinute) {
        // Get TTL for accurate reset time
        const ttl = await redis.ttl(key);
        return {
          allowed: false,
          resetAt: new Date(now + ttl * 1000),
        };
      }

      return {
        allowed: true,
        remaining: limits.requestsPerMinute - currentCount,
        resetAt: new Date(resetTime),
      };
    } catch (error) {
      console.error("Redis rate limit error, falling back to in-memory:", error);
      // Fall through to in-memory below
    }
  }

  // Fallback: In-memory rate limit tracking
  let entry = rateLimitStore.get(userId);

  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime: now + minuteWindow };
    rateLimitStore.set(userId, entry);
  }

  // Check if over limit
  if (entry.count >= limits.requestsPerMinute) {
    return {
      allowed: false,
      resetAt: new Date(entry.resetTime),
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(userId, entry);

  return {
    allowed: true,
    remaining: limits.requestsPerMinute - entry.count,
    resetAt: new Date(entry.resetTime),
  };
}

/**
 * Get client IP address from headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers();

  // Check various headers for IP
  const forwardedFor = headersList.get("x-forwarded-for");
  const realIP = headersList.get("x-real-ip");
  const cfConnectingIP = headersList.get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return "unknown";
}

/**
 * Rate limit error response headers
 */
export function getRateLimitHeaders(
  remaining: number,
  resetAt: Date
): Record<string, string> {
  return {
    "X-RateLimit-Limit": "60",
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(resetAt.getTime() / 1000).toString(),
    "Retry-After": Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString(),
  };
}
