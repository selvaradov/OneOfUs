import { NextRequest, NextResponse } from 'next/server';
import { getUserHistory, checkDatabaseConnection } from '@/lib/db';

/**
 * GET /api/history?userId=xxx&limit=20&offset=0
 * Fetch user's game history from database with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection unavailable',
          fallbackToLocalStorage: true
        },
        { status: 503 }
      );
    }

    // Fetch user history from database
    const sessions = await getUserHistory(userId, limit, offset);

    return NextResponse.json({
      success: true,
      sessions,
      pagination: {
        limit,
        offset,
        hasMore: sessions.length === limit, // Simple check - if we got full limit, there might be more
      },
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fallbackToLocalStorage: true,
      },
      { status: 500 }
    );
  }
}
