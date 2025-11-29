import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  generateSessionToken,
} from '@/lib/admin-auth';
import {
  adminAuthRateLimiter,
  getClientIp,
  checkRateLimit,
} from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(
      adminAuthRateLimiter,
      ip,
      'admin auth'
    );

    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            ),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password
    if (!verifyAdminPassword(password)) {
      // Log failed attempt
      console.warn(
        `Failed admin login attempt from IP: ${ip} at ${new Date().toISOString()}`
      );

      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = generateSessionToken();

    // Log successful login
    console.log(
      `Successful admin login from IP: ${ip} at ${new Date().toISOString()}`
    );

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
