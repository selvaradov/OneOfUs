import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import {
  getAllSessions,
  getAllUsers,
  getAdminAnalytics,
} from '@/lib/admin-db';
import {
  adminRateLimiter,
  getClientIp,
  checkRateLimit,
} from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(
      adminRateLimiter,
      ip,
      'admin export'
    );

    if (rateLimitResult && !rateLimitResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full'; // sessions | users | analytics | full
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    // Validate type
    if (!['sessions', 'users', 'analytics', 'full'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid export type' },
        { status: 400 }
      );
    }

    // Build export data based on type
    let exportData: any = {
      exportMetadata: {
        exportDate: new Date().toISOString(),
        exportType: type,
        version: '1.0',
        note: 'Session exports may be filtered by date range. Analytics are always comprehensive.',
      },
    };

    switch (type) {
      case 'sessions':
        const sessions = await getAllSessions(dateFrom, dateTo);
        exportData.summary = {
          totalSessions: sessions.length,
          dateRange: {
            earliest: sessions[sessions.length - 1]?.created_at || null,
            latest: sessions[0]?.created_at || null,
          },
        };
        exportData.sessions = sessions;
        break;

      case 'users':
        const users = await getAllUsers();
        exportData.summary = {
          totalUsers: users.length,
        };
        exportData.users = users;
        break;

      case 'analytics':
        const analytics = await getAdminAnalytics();
        exportData.analytics = analytics;
        break;

      case 'full':
        const [fullSessions, fullUsers, fullAnalytics] = await Promise.all([
          getAllSessions(dateFrom, dateTo),
          getAllUsers(),
          getAdminAnalytics(),
        ]);

        exportData.summary = {
          totalUsers: fullUsers.length,
          totalSessions: fullSessions.length,
          dateRange: {
            earliest: fullSessions[fullSessions.length - 1]?.created_at || null,
            latest: fullSessions[0]?.created_at || null,
          },
        };

        exportData.data = {
          users: fullUsers,
          sessions: fullSessions,
          analytics: fullAnalytics,
        };
        break;
    }

    // Log export action
    console.log(
      `Admin export: type=${type}, dateFrom=${dateFrom}, dateTo=${dateTo}, IP=${ip}, timestamp=${new Date().toISOString()}`
    );

    // Return JSON with download headers
    const filename = `oneofus-export-${type}-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Admin export API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
