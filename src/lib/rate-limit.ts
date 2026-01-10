// Simple in-memory rate limiter
// For production, use Redis or a distributed cache

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

// Store rate limit data (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

// Prevent memory leaks in dev mode
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-expect-error - global cleanup
  if (globalThis.__rateLimitCleanup) {
    // @ts-expect-error - global cleanup
    clearInterval(globalThis.__rateLimitCleanup);
  }
  // @ts-expect-error - global cleanup
  globalThis.__rateLimitCleanup = cleanupInterval;
}

// Default rate limit configurations
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  default: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 60,      // 60 requests per minute
  },
  auth: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,      // 10 auth attempts per minute
  },
  upload: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 10,      // 10 uploads per minute
  },
  ai: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 20,      // 20 AI requests per minute
  },
  extract: {
    windowMs: 60 * 1000,  // 1 minute
    maxRequests: 5,       // 5 document extractions per minute
  },
};

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  limitType: keyof typeof RATE_LIMITS = 'default'
): RateLimitResult {
  const config = RATE_LIMITS[limitType] || RATE_LIMITS.default;
  const now = Date.now();
  const key = `${limitType}:${identifier}`;

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
