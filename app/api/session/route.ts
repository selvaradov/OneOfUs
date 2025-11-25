import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { GameSession, GradingResult } from '@/lib/types';
import { getPromptById } from '@/lib/prompts';

/**
 * GET /api/session?sessionId=xxx
 * Fetch a single game session by ID from the database
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId parameter is required' },
        { status: 400 }
      );
    }

    // Query database for the session
    const result = await sql`
      SELECT * FROM game_sessions WHERE id = ${sessionId}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];

    // Reconstruct the Prompt object using the prompt_id
    const prompt = getPromptById(row.prompt_id);

    if (!prompt) {
      // If prompt not found in scenarios.json, create a minimal version from stored data
      console.warn(`Prompt ${row.prompt_id} not found in scenarios.json, using stored data`);
    }

    // Transform database row to GameSession format
    const session: GameSession = {
      id: row.id,
      userId: row.user_id || undefined,
      promptId: row.prompt_id,
      prompt: prompt || {
        id: row.prompt_id,
        category: row.prompt_category,
        scenario: row.prompt_scenario,
        positions: [],
        charLimit: 500, // Default fallback
      },
      positionChosen: row.position_assigned,
      userResponse: row.user_response,
      gradingResult: row.score !== null ? {
        detected: row.detected,
        score: row.score,
        feedback: row.feedback || '',
        rubricScores: (row.rubric_understanding !== null && row.rubric_authenticity !== null && row.rubric_execution !== null) ? {
          understanding: row.rubric_understanding,
          authenticity: row.rubric_authenticity,
          execution: row.rubric_execution,
        } : undefined,
        timestamp: row.completed_at || row.created_at,
      } as GradingResult : undefined,
      aiResponse: row.ai_comparison_response || undefined,
      createdAt: row.created_at,
      completedAt: row.completed_at || undefined,
    };

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}
