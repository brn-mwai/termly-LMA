import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from '@/lib/rate-limit';

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitOptions {
  type?: RateLimitType;
  identifier?: string;
}

/**
 * Rate limit middleware for API routes
 *
 * Usage:
 * ```
 * export async function POST(request: Request) {
 *   const rateLimitResult = await withRateLimit(request, { type: 'upload' });
 *   if (rateLimitResult) return rateLimitResult;
 *
 *   // ... rest of the handler
 * }
 * ```
 */
export async function withRateLimit(
  request: Request,
  options: RateLimitOptions = {}
): Promise<NextResponse | null> {
  const { type = 'default' } = options;

  // Get identifier: prefer authenticated user ID, fall back to IP
  let identifier = options.identifier;

  if (!identifier) {
    try {
      const { userId } = await auth();
      identifier = userId || getClientIP(request) || 'anonymous';
    } catch {
      identifier = getClientIP(request) || 'anonymous';
    }
  }

  const result = checkRateLimit(identifier, type);

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: result.retryAfter,
        },
      },
      {
        status: 429,
        headers: getRateLimitHeaders(result),
      }
    );
  }

  return null;
}

/**
 * Get client IP from request headers
 */
function getClientIP(request: Request): string | undefined {
  // Check common headers for client IP
  const headers = request.headers;

  // Cloudflare
  const cfIP = headers.get('cf-connecting-ip');
  if (cfIP) return cfIP;

  // Standard proxy headers
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) return realIP;

  return undefined;
}

/**
 * Create rate limit info response headers
 */
export function addRateLimitHeaders(
  response: NextResponse,
  identifier: string,
  type: RateLimitType = 'default'
): NextResponse {
  const result = checkRateLimit(identifier, type);
  const headers = getRateLimitHeaders(result);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}
