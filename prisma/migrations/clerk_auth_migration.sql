-- CreateIndex for clerkUserId and drop old supabaseUid index
-- Migration: clerk_auth_migration

-- Step 1: Add new clerkUserId column
ALTER TABLE "users" ADD COLUMN "clerk_user_id" TEXT;

-- Step 2: Make companyId and role nullable for onboarding state
ALTER TABLE "users" ALTER COLUMN "company_id" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;

-- Step 3: Create unique index on clerkUserId
CREATE UNIQUE INDEX "users_clerk_user_id_key" ON "users"("clerk_user_id");

-- Step 4: Create index on clerkUserId for performance
CREATE INDEX "users_clerk_user_id_idx" ON "users"("clerk_user_id");

-- Step 5: Drop old supabaseUid index
DROP INDEX IF EXISTS "users_supabase_uid_idx";

-- Step 6: Drop old supabaseUid unique constraint
DROP INDEX IF EXISTS "users_supabase_uid_key";

-- Note: The supabase_uid column is kept for now to allow manual data migration if needed.
-- After migrating existing users to Clerk, you can manually drop it with:
-- ALTER TABLE "users" DROP COLUMN "supabase_uid";
