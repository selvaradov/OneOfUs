import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { getDistinctPromptIds } from '@/lib/admin-db';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    if (!verifyAdminAuth(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch distinct prompt IDs
    const promptIds = await getDistinctPromptIds();

    return NextResponse.json({
      success: true,
      promptIds,
    });
  } catch (error) {
    console.error('Admin prompt IDs API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
