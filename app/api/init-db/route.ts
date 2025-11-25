import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

/**
 * POST /api/init-db - Initialize database schema
 * This should be called once to set up the database tables and indexes
 *
 * SECURITY: Protected by INIT_DB_SECRET environment variable in production
 * Usage: curl -X POST http://localhost:3000/api/init-db -H "Authorization: Bearer YOUR_SECRET"
 */
export async function POST(request: NextRequest) {
  // Check if we're in production and require auth
  const isProduction = process.env.NODE_ENV === 'production';
  const initSecret = process.env.INIT_DB_SECRET;

  if (isProduction && initSecret) {
    // Require authorization header in production
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (providedSecret !== initSecret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. This endpoint requires authorization in production.',
        },
        { status: 401 }
      );
    }
  }

  try {
    await initializeDatabase();

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
