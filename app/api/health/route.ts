import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint to verify database connectivity
 * Use this to diagnose production database connection issues
 */
export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    clerkConfigured: false,
    databaseConnected: false,
    databaseUrl: '',
    error: null as string | null,
  };

  // Check Clerk configuration
  checks.clerkConfigured = !!(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
  );

  // Mask the database URL for security
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl) {
    const masked = dbUrl.replace(/:[^:@]+@/, ':****@');
    checks.databaseUrl = masked;
  }

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.databaseConnected = true;
  } catch (error) {
    checks.databaseConnected = false;
    checks.error = error instanceof Error ? error.message : 'Unknown database error';
  }

  const allHealthy = checks.clerkConfigured && checks.databaseConnected;

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
