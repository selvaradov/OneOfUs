import { NextRequest, NextResponse } from 'next/server';
import { linkSessionToMatch, getMatchById } from '@/lib/match-db';
import { matchRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';

/**
 * POST /api/match/link-session - Link a completed game session to a match
 *
 * Called after grading to associate the session with the match and
 * check if the match is now complete.
 *
 * Request body:
 * {
 *   sessionId: string  - The completed game session ID
 *   matchId: string    - The match ID to link to
 *   userId: string     - The user's ID (for participant lookup)
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   matchCompleted?: boolean
 *   matchCode?: string
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(matchRateLimiter, clientIp, 'match link-session');

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
    const { sessionId, matchId, userId } = body;

    // Validate required fields
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    if (!matchId || typeof matchId !== 'string') {
      return NextResponse.json({ success: false, error: 'matchId is required' }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Link the session to the match
    const result = await linkSessionToMatch(sessionId, matchId, userId);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    // Get match code for redirect
    const match = await getMatchById(matchId);

    return NextResponse.json({
      success: true,
      matchCompleted: result.matchCompleted,
      matchCode: match?.matchCode,
    });
  } catch (error) {
    console.error('Error linking session to match:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
