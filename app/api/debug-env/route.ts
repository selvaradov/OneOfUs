import { NextResponse } from 'next/server';

/**
 * DEBUG ENDPOINT - Remove after fixing environment variables!
 * Shows which Postgres env vars are available (but not their values)
 */
export async function GET() {
  return NextResponse.json({
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    hasPostgresPrismaUrl: !!process.env.POSTGRES_PRISMA_URL,
    hasPostgresUser: !!process.env.POSTGRES_USER,
    hasPostgresHost: !!process.env.POSTGRES_HOST,
    hasPostgresPassword: !!process.env.POSTGRES_PASSWORD,
    hasPostgresDatabase: !!process.env.POSTGRES_DATABASE,
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    hasInitDbSecret: !!process.env.INIT_DB_SECRET,
    nodeEnv: process.env.NODE_ENV,
  });
}
