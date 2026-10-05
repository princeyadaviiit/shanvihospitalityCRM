/**
 * Direct migration script to apply Clerk schema changes to production database
 * This adds clerk_user_id column and makes company_id/role nullable
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

// Use DIRECT_URL for migrations (not pooler)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function applyClerkMigration() {
  console.log('🔄 Starting Clerk migration...');
  console.log('📍 Database:', process.env.DIRECT_URL?.split('@')[1]?.split('/')[0] || 'unknown');

  try {
    // Step 1: Check if clerk_user_id column already exists
    console.log('\n📋 Step 1: Checking current schema...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('supabase_uid', 'clerk_user_id', 'company_id', 'role')
      ORDER BY column_name;
    `;
    console.log('Current columns:', columns);

    const hasClerkUserId = columns.some(col => col.column_name === 'clerk_user_id');

    if (hasClerkUserId) {
      console.log('✅ Migration already applied! clerk_user_id column exists.');
      return;
    }

    // Step 2: Add clerk_user_id column
    console.log('\n📝 Step 2: Adding clerk_user_id column...');
    await prisma.$executeRaw`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_id" TEXT;
    `;
    console.log('✅ clerk_user_id column added');

    // Step 3: Make company_id nullable
    console.log('\n📝 Step 3: Making company_id nullable...');
    await prisma.$executeRaw`
      ALTER TABLE "users" ALTER COLUMN "company_id" DROP NOT NULL;
    `;
    console.log('✅ company_id is now nullable');

    // Step 4: Make role nullable
    console.log('\n📝 Step 4: Making role nullable...');
    await prisma.$executeRaw`
      ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;
    `;
    console.log('✅ role is now nullable');

    // Step 5: Create unique index on clerk_user_id
    console.log('\n📝 Step 5: Creating unique index on clerk_user_id...');
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_id_key" ON "users"("clerk_user_id");
    `;
    console.log('✅ Unique index created');

    // Step 6: Create performance index on clerk_user_id
    console.log('\n📝 Step 6: Creating performance index...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "users_clerk_user_id_idx" ON "users"("clerk_user_id");
    `;
    console.log('✅ Performance index created');

    // Step 7: Drop old supabase_uid indexes
    console.log('\n📝 Step 7: Dropping old supabase_uid indexes...');
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "users_supabase_uid_idx";
    `;
    await prisma.$executeRaw`
      DROP INDEX IF EXISTS "users_supabase_uid_key";
    `;
    console.log('✅ Old indexes dropped');

    // Verification
    console.log('\n✨ Verification: Checking final schema...');
    const finalColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
        AND column_name IN ('supabase_uid', 'clerk_user_id', 'company_id', 'role')
      ORDER BY column_name;
    `;
    console.log('Final columns:', finalColumns);

    console.log('\n✅ ✅ ✅ Migration completed successfully! ✅ ✅ ✅');
    console.log('\nNext steps:');
    console.log('1. Set Vercel environment variables (use VERCEL_DEPLOYMENT_CHECKLIST.md)');
    console.log('2. Push code to trigger deployment');
    console.log('3. Test: https://shanvihospitality-crm.vercel.app/api/health');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
applyClerkMigration()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
