import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter for /api/grade endpoint
// 20 requests per hour + 50 requests per day (dual limits)
export const gradeRateLimiter = {
  hourly: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    analytics: true,
    prefix: 'ratelimit:grade:hourly',
  }),
  daily: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '24 h'),
    analytics: true,
    prefix: 'ratelimit:grade:daily',
  }),
};

// Rate limiter for /api/history endpoint
// 30 requests per minute
export const historyRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: 'ratelimit:history',
});

// Rate limiter for /api/session endpoint
// 100 requests per day
export const sessionRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '24 h'),
  analytics: true,
  prefix: 'ratelimit:session',
});

// Rate limiter for /api/admin/auth endpoint (login attempts)
// 10 attempts per minute per IP
export const adminAuthRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:admin:auth',
});

// Rate limiter for /api/admin/* endpoints (general admin operations)
// 100 requests per minute (relaxed for admin use)
export const adminRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:admin',
});

// Rate limiter for /api/match/create endpoint
// 10 matches per hour per user
export const matchCreateRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  analytics: true,
  prefix: 'ratelimit:match:create',
});

// Rate limiter for /api/match/* endpoints (general match operations)
// 60 requests per minute
export const matchRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
  prefix: 'ratelimit:match',
});

// Helper to extract IP address from request
export function getClientIp(request: Request): string {
  // Try x-forwarded-for first (Vercel sets this)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Last resort (should rarely happen on Vercel)
  return 'unknown';
}

// Helper to check rate limit and return appropriate response
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string,
  limitName: string = 'rate limit'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number } | null> {
  try {
    const result = await limiter.limit(identifier);

    if (!result.success) {
      return {
        success: false,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }

    return null; // No rate limit hit
  } catch (error) {
    console.error(`Rate limit check error (${limitName}):`, error);
    // On error, allow the request through (fail open)
    return null;
  }
}
