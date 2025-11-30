import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getAdminGameSessions, getTotalSessionsCount, AdminSessionsQuery } from '@/lib/admin-db';
import { adminRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';
import { PoliticalPosition } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyAdminAuth(request)) {
      console.error('Admin sessions: authentication failed (401)');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(adminRateLimiter, ip, 'admin sessions');

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

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = (searchParams.get('sortBy') || 'created_at') as
      | 'created_at'
      | 'score'
      | 'detected';
    const sortOrder = (searchParams.get('sortOrder') || 'DESC') as 'ASC' | 'DESC';

    const detectedParam = searchParams.get('detected');
    const filterDetected =
      detectedParam === 'true' ? true : detectedParam === 'false' ? false : null;

    const positionParam = searchParams.get('position');
    const filterPosition = positionParam
      ? (positionParam.split(',').map((p) => p.trim()) as PoliticalPosition[])
      : null;

    const promptIdParam = searchParams.get('promptId');
    const filterPromptId = promptIdParam ? promptIdParam.split(',').map((id) => id.trim()) : null;
    const dateFrom = searchParams.get('dateFrom') || null;
    const dateTo = searchParams.get('dateTo') || null;

    // Validate parameters
    if (!['created_at', 'score', 'detected'].includes(sortBy)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortBy parameter' },
        { status: 400 }
      );
    }

    if (!['ASC', 'DESC'].includes(sortOrder)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sortOrder parameter' },
        { status: 400 }
      );
    }

    // Build query options
    const queryOptions: AdminSessionsQuery = {
      limit,
      offset,
      sortBy,
      sortOrder,
      filterDetected,
      filterPosition,
      filterPromptId,
      dateFrom,
      dateTo,
    };

    // Fetch sessions and total count
    const [sessions, totalCount] = await Promise.all([
      getAdminGameSessions(queryOptions),
      getTotalSessionsCount({
        filterDetected,
        filterPosition,
        filterPromptId,
        dateFrom,
        dateTo,
      }),
    ]);

    return NextResponse.json({
      success: true,
      sessions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + sessions.length < totalCount,
      },
    });
  } catch (error) {
    console.error('Admin sessions API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
