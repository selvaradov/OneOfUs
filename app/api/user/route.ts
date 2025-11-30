import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUser, updateUser, getUserStats, checkDatabaseConnection } from '@/lib/db';

/**
 * POST /api/user - Create a new user
 * Body: { politicalAlignment?: number, ageRange?: string, country?: string }
 * Returns: { success: boolean, userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { politicalAlignment, ageRange, country } = body;

    // Create user in database
    const userId = await createUser(politicalAlignment, ageRange, country);

    return NextResponse.json({
      success: true,
      userId,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user?userId=xxx - Get user information and stats
 * Query params: userId
 * Returns: { success: boolean, user: object, stats: object }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Get user data
    const user = await getUser(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get user stats
    const stats = await getUserStats(userId);

    return NextResponse.json({
      success: true,
      user,
      stats,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user - Update user information
 * Body: { userId: string, politicalAlignment?: number, ageRange?: string, country?: string }
 * Returns: { success: boolean }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, politicalAlignment, ageRange, country } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      return NextResponse.json(
        { success: false, error: 'Database connection unavailable' },
        { status: 503 }
      );
    }

    // Update user
    await updateUser(userId, politicalAlignment, ageRange, country);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
