# Apply Clerk Migration to Production Database

## Current Issue

Your production database still has the OLD Supabase schema with `supabase_uid`, but your code expects the NEW Clerk schema with `clerk_user_id` (mapped to `clerkUserId` in Prisma).

**Error**: `The column users.clerk_user_id does not exist in the current database`

## Solution: Apply Migration via Supabase Dashboard

Follow these steps to apply the Clerk migration:

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

---

## Step 2: Run the Clerk Migration SQL

Copy and paste this entire SQL script into the editor:

```sql
-- Clerk Auth Migration
-- This migrates from Supabase Auth (supabase_uid) to Clerk Auth (clerk_user_id)

-- Step 1: Add new clerk_user_id column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_id" TEXT;

-- Step 2: Make company_id and role nullable for onboarding state
ALTER TABLE "users" ALTER COLUMN "company_id" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;

-- Step 3: Create unique index on clerk_user_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_id_key" ON "users"("clerk_user_id");

-- Step 4: Create index on clerk_user_id for performance
CREATE INDEX IF NOT EXISTS "users_clerk_user_id_idx" ON "users"("clerk_user_id");

-- Step 5: Drop old supabase_uid index
DROP INDEX IF EXISTS "users_supabase_uid_idx";

-- Step 6: Drop old supabase_uid unique constraint
DROP INDEX IF EXISTS "users_supabase_uid_key";

-- Verification: Check the new schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('supabase_uid', 'clerk_user_id', 'company_id', 'role')
ORDER BY column_name;
```

---

## Step 3: Click "Run" Button

Click the **Run** button (or press Ctrl+Enter) to execute the migration.

**Expected output:**
- Migration statements will execute
- At the end, you'll see a table showing:
  - `clerk_user_id` column (TEXT, YES nullable)
  - `company_id` column (nullable)
  - `role` column (nullable)
  - `supabase_uid` column (still exists, can be dropped later)

---

## Step 4: Verify Migration Success

Run this verification query:

```sql
-- Check if clerk_user_id column exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.columns 
  WHERE table_name = 'users' 
    AND column_name = 'clerk_user_id'
) AS clerk_column_exists;
```

**Expected**: `clerk_column_exists: true`

---

## Step 5: Clean Up Old Data (Optional)

If you want to remove the old `supabase_uid` column after confirming everything works:

⚠️ **ONLY DO THIS AFTER TESTING YOUR APP WORKS**

```sql
-- Drop the old supabase_uid column (irreversible!)
ALTER TABLE "users" DROP COLUMN IF EXISTS "supabase_uid";
```

---

## Step 6: Deploy Updated Code

After applying the migration to your production database:

1. **Commit the restored schema**:
   ```bash
   git add prisma/schema.prisma
   git commit -m "fix: restore Clerk schema after accidental prisma db pull"
   git push
   ```

2. **Vercel will auto-deploy** with the correct schema

3. **Test your production site**:
   - Visit: https://shanvihospitality-crm.vercel.app/api/health
   - Should show: `"status": "healthy"`
   - Try signing in - should work now!

---

## What Happened?

1. **Original issue**: When I ran `prisma db pull` to test the database connection, it **overwrote** your correct Clerk schema with the OLD Supabase schema from the database
2. **The fix**: I restored the correct schema from your git commit `95981c7`
3. **Now**: You need to apply the migration SQL to your production database so it matches the code

---

## Troubleshooting

### If migration fails with "column already exists"
This means the migration was partially applied. Run this to check:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### If you see both supabase_uid AND clerk_user_id
This is fine! The migration keeps both columns. After confirming everything works, you can drop `supabase_uid` with Step 5.

### If you have existing users with supabase_uid
Those users won't be able to sign in with Clerk. They need to:
1. Sign up again with Clerk
2. Or you manually migrate their data (copy supabase_uid to a notes field, create new Clerk accounts)

---

## Summary

1. ✅ Open Supabase Dashboard → SQL Editor
2. ✅ Copy and paste the migration SQL from Step 2
3. ✅ Click "Run"
4. ✅ Verify with the verification query
5. ✅ Commit and push the restored schema
6. ✅ Test production site

After this, your production app should work! Let me know once you've run the migration.
