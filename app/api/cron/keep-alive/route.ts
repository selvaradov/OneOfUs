import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

/**
 * Combined cron job to keep both Redis and Postgres databases alive
 * Runs once daily at 2:00 AM UTC to prevent inactivity archiving
 *
 * This single endpoint keeps both databases active, staying within
 * Vercel's free tier limit of 2 cron jobs per account.
 */
export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    redis: { success: false, error: null as string | null },
    postgres: { success: false, error: null as string | null },
  };

  // Ping Redis (Upstash)
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const key = 'keepalive:last_ping';
    await redis.set(key, timestamp, { ex: 60 * 60 * 48 }); // Expire after 48 hours
    await redis.get(key);

    results.redis.success = true;
    console.log(`[Keep-Alive] Redis ping successful at ${timestamp}`);
  } catch (error) {
    results.redis.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Keep-Alive] Redis error:', error);
  }

  // Ping Postgres (Vercel/Neon)
  try {
    await sql`
      INSERT INTO keepalive (id, last_ping)
      VALUES (1, NOW())
      ON CONFLICT (id)
      DO UPDATE SET last_ping = NOW()
    `;

    results.postgres.success = true;
    console.log(`[Keep-Alive] Postgres ping successful at ${timestamp}`);
  } catch (error) {
    results.postgres.error = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Keep-Alive] Postgres error:', error);
  }

  // Return status
  const allSuccessful = results.redis.success && results.postgres.success;
  const statusCode = allSuccessful ? 200 : 207; // 207 = Multi-Status (partial success)

  return NextResponse.json(
    {
      success: allSuccessful,
      message: allSuccessful ? 'All databases pinged successfully' : 'Some database pings failed',
      results,
      environment: process.env.VERCEL_ENV || 'development',
    },
    { status: statusCode }
  );
}
