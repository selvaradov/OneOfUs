import { NextRequest, NextResponse } from 'next/server';
import { createMatch, getExistingMatchForSession } from '@/lib/match-db';
import { matchCreateRateLimiter, getClientIp, checkRateLimit } from '@/lib/ratelimit';
import { sql } from '@vercel/postgres';

/**
 * POST /api/match/create - Create a new 1v1 match challenge
 *
 * Request body:
 * {
 *   sessionId: string  - The creator's completed game session ID
 *   userId: string     - The creator's user ID
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   matchId?: string
 *   matchCode?: string
 *   shareUrl?: string
 *   existingMatch?: boolean
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(matchCreateRateLimiter, clientIp, 'match create');

    if (rateLimitResult) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many match creation requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      );
    }

    // Parse request body
    const body = await request.json();
    const { sessionId, userId, forceNew } = body;

    // Validate required fields
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ success: false, error: 'sessionId is required' }, { status: 400 });
    }

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Verify the session exists and belongs to the user
    const sessionResult = await sql`
      SELECT id, user_id, prompt_id FROM game_sessions
      WHERE id = ${sessionId}
    `;

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const session = sessionResult.rows[0];

    if (session.user_id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    // Check if a match already exists for this session (unless forceNew is true)
    if (!forceNew) {
      const existingMatch = await getExistingMatchForSession(sessionId);

      if (existingMatch) {
        // If existing match is pending, return it and indicate it's pending
        // If existing match is completed or expired, we'll create a new one
        if (existingMatch.status === 'pending') {
          return NextResponse.json({
            success: true,
            matchId: existingMatch.matchId,
            matchCode: existingMatch.matchCode,
            existingMatch: true,
            existingMatchStatus: 'pending',
          });
        }
        // If completed/expired, fall through to create a new match
      }
    }

    // Create the match
    const { matchId, matchCode } = await createMatch(userId, sessionId, session.prompt_id);

    return NextResponse.json({
      success: true,
      matchId,
      matchCode,
      existingMatch: false,
    });
  } catch (error) {
    console.error('Error creating match:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
