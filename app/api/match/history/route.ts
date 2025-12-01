import { NextRequest, NextResponse } from 'next/server';
import { getMatchHistory } from '@/lib/match-db';
import { matchRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/match/history - Get user's match history
 *
 * Query params:
 *   userId: string    - The user's ID (required)
 *   limit: number     - Results per page (default 20, max 100)
 *   offset: number    - Pagination offset (default 0)
 *
 * Response:
 * {
 *   success: boolean
 *   matches?: MatchHistoryItem[]
 *   total?: number
 *   hasMore?: boolean
 *   error?: string
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(matchRateLimiter, clientIp, 'match history');

    if (rateLimitResult) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    // Validate userId
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Parse and validate pagination params
    let limit = 20;
    let offset = 0;

    if (limitParam) {
      limit = parseInt(limitParam, 10);
      if (isNaN(limit) || limit < 1) {
        limit = 20;
      } else if (limit > 100) {
        limit = 100;
      }
    }

    if (offsetParam) {
      offset = parseInt(offsetParam, 10);
      if (isNaN(offset) || offset < 0) {
        offset = 0;
      }
    }

    // Get match history
    const { matches, total } = await getMatchHistory(userId, limit, offset);

    return NextResponse.json({
      success: true,
      matches,
      total,
      hasMore: offset + matches.length < total,
    });
  } catch (error) {
    console.error('Error fetching match history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
