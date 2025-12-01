import { NextRequest, NextResponse } from 'next/server';
import { joinMatch } from '@/lib/match-db';
import { matchRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';

/**
 * POST /api/match/join - Join a match as an opponent
 *
 * Request body:
 * {
 *   matchCode: string  - The 8-character match code
 *   userId: string     - The opponent's user ID
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   matchId?: string
 *   promptId?: string
 *   position?: PoliticalPosition
 *   alreadyJoined?: boolean
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(matchRateLimiter, clientIp, 'match join');

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

    // Parse request body
    const body = await request.json();
    const { matchCode, userId } = body;

    // Validate required fields
    if (!matchCode || typeof matchCode !== 'string') {
      return NextResponse.json({ success: false, error: 'matchCode is required' }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Attempt to join the match
    const result = await joinMatch(matchCode, userId);

    if (!result.success) {
      // Determine appropriate status code based on error
      let statusCode = 400;
      if (result.error === 'Match not found') {
        statusCode = 404;
      } else if (result.error === 'You cannot join your own match as opponent') {
        statusCode = 403;
      } else if (
        result.error === 'Match has expired' ||
        result.error === 'Match is already completed'
      ) {
        statusCode = 410; // Gone
      }

      return NextResponse.json({ success: false, error: result.error }, { status: statusCode });
    }

    return NextResponse.json({
      success: true,
      matchId: result.matchId,
      promptId: result.promptId,
      position: result.position,
      alreadyJoined: result.alreadyJoined,
    });
  } catch (error) {
    console.error('Error joining match:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
