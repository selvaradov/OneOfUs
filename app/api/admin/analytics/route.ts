import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getAdminAnalytics } from '@/lib/admin-db';
import { adminRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyAdminAuth(request)) {
      console.error('Admin analytics: authentication failed (401)');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(adminRateLimiter, ip, 'admin analytics');

    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // Fetch analytics data
    const analytics = await getAdminAnalytics();

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Admin analytics API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
