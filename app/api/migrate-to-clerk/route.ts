import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * PRODUCTION MIGRATION ENDPOINT
 * This applies the Clerk auth migration to add clerk_user_id column
 *
 * IMPORTANT: This is a one-time migration endpoint
 * After migration is complete, you should delete this file for security
 *
 * To run: Visit https://your-domain.vercel.app/api/migrate-to-clerk?secret=MIGRATE_NOW_2024
 */

const MIGRATION_SECRET = 'MIGRATE_NOW_2024'; // Simple secret to prevent accidental runs

export async function GET(request: NextRequest) {
  try {
    // Check secret parameter
    const secret = request.nextUrl.searchParams.get('secret');
    if (secret !== MIGRATION_SECRET) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Missing or invalid secret parameter. Add ?secret=MIGRATE_NOW_2024 to URL'
        },
        { status: 401 }
      );
    }

    console.log('🔄 Starting Clerk migration...');

    // Step 1: Check if migration already applied
    const checkColumn = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name = 'clerk_user_id';
    `;

    if (checkColumn.length > 0) {
      return NextResponse.json({
        success: true,
        message: '✅ Migration already applied! clerk_user_id column exists.',
        alreadyMigrated: true,
        instructions: 'You can now delete app/api/migrate-to-clerk/route.ts for security.',
      });
    }

    console.log('📝 Applying migration...');

    // Step 2: Add clerk_user_id column
    await prisma.$executeRaw`
      ALTER TABLE "users" ADD COLUMN "clerk_user_id" TEXT;
    `;

    // Step 3: Make company_id nullable
    await prisma.$executeRaw`
      ALTER TABLE "users" ALTER COLUMN "company_id" DROP NOT NULL;
    `;

    // Step 4: Make role nullable
    await prisma.$executeRaw`
      ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;
    `;

    // Step 4.5: Make supabase_uid nullable (critical!)
    await prisma.$executeRaw`
      ALTER TABLE "users" ALTER COLUMN "supabase_uid" DROP NOT NULL;
    `;

    // Step 5: Create unique index
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users"("clerk_user_id");
    `;

    // Step 6: Create performance index
    await prisma.$executeRaw`
      CREATE INDEX "users_clerk_user_id_idx" ON "users"("clerk_user_id");
    `;

    // Step 7: Drop old indexes
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "users_supabase_uid_idx";
    `;
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "users_supabase_uid_key";
    `;

    // Verification
    const finalColumns = await prisma.$queryRaw<Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>>`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('clerk_user_id', 'company_id', 'role')
      ORDER BY column_name;
    `;

    console.log('✅ Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: '✅ ✅ ✅ Migration completed successfully! ✅ ✅ ✅',
      columnsCreated: finalColumns,
      nextSteps: [
        '1. Test your app - try signing in and accessing dashboard',
        '2. If everything works, DELETE this file: app/api/migrate-to-clerk/route.ts',
        '3. Commit and push the deletion for security',
      ],
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Migration failed. Check error details above.',
        troubleshooting: [
          '1. Check if database is paused in Supabase Dashboard',
          '2. Verify DATABASE_URL and DIRECT_URL are set in Vercel',
          '3. Check Vercel Function Logs for more details',
        ],
      },
      { status: 500 }
    );
  }
}
