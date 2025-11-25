import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/db';

/**
 * POST /api/init-db - Initialize database schema
 * This should be called once to set up the database tables and indexes
 * In production, you might want to protect this endpoint or use a migration tool
 */
export async function POST(request: NextRequest) {
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
