import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * One-time fix endpoint to make supabase_uid nullable
 * This fixes the "Null constraint violation" error in onboarding
 *
 * Visit: /api/fix-supabase-uid?secret=FIX_NOW
 */

export async function GET(request: Request) {
  try {
    // Simple secret check
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    if (secret !== 'FIX_NOW') {
      return NextResponse.json(
        { error: 'Invalid secret. Use ?secret=FIX_NOW' },
        { status: 401 }
      );
    }

    console.log('🔧 Fixing supabase_uid column...');

    // Make supabase_uid nullable
    await prisma.$executeRaw`
      ALTER TABLE "users" ALTER COLUMN "supabase_uid" DROP NOT NULL;
    `;

    // Verify it worked
    const result = await prisma.$queryRaw<Array<{
      column_name: string;
      is_nullable: string;
    }>>`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name = 'supabase_uid';
    `;

    const isNullable = result[0]?.is_nullable === 'YES';

    return NextResponse.json({
      success: true,
      message: '✅ Fixed! supabase_uid is now nullable.',
      verified: isNullable,
      details: result[0],
      nextStep: 'Test onboarding - it should work now!',
    });

  } catch (error) {
    console.error('❌ Fix failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
