import { NextRequest, NextResponse } from 'next/server';
import { getMatchByCode, getMatchResults, checkAndUpdateMatchExpiry } from '@/lib/match-db';
import { matchRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';

/**
 * GET /api/match/[code] - Get match details by code
 *
 * Returns match status and details for the lobby page.
 * If match is completed, includes full session data for results display.
 *
 * Response:
 * {
 *   success: boolean
 *   match?: MatchWithParticipants | MatchResults
 *   error?: string
 * }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(matchRateLimiter, clientIp, 'match details');

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

    const { code } = await params;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Match code is required' },
        { status: 400 }
      );
    }

    // Get the match
    const match = await getMatchByCode(code);

    if (!match) {
      return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
    }

    // Check and update expiry if needed
    const wasExpired = await checkAndUpdateMatchExpiry(match.id);
    if (wasExpired) {
      match.status = 'expired';
    }

    // If match is completed, return full results with session data
    if (match.status === 'completed') {
      const results = await getMatchResults(match.id);
      return NextResponse.json({
        success: true,
        match: results,
        isCompleted: true,
      });
    }

    // For pending/expired matches, return basic match info
    return NextResponse.json({
      success: true,
      match,
      isCompleted: false,
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
