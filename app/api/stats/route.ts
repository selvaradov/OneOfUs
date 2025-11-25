import { NextRequest, NextResponse } from 'next/server';
import { getUserStats, getAllPromptsAnalytics, checkDatabaseConnection } from '@/lib/db';

/**
 * GET /api/stats?userId=xxx - Get user statistics
 * GET /api/stats?type=prompts - Get global prompt analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get user-specific stats
    if (userId) {
      const stats = await getUserStats(userId);
      return NextResponse.json({
        success: true,
        stats,
      });
    }

    // Get global prompt analytics
    if (type === 'prompts') {
      const promptsAnalytics = await getAllPromptsAnalytics();
      return NextResponse.json({
        success: true,
        prompts: promptsAnalytics,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Missing required parameters (userId or type=prompts)' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
