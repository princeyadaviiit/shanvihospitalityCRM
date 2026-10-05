# 🚨 CRITICAL: Complete Production Fix Guide

## Problem Summary

1. ✅ **Code is fixed** - Clerk schema restored, Prisma client regenerated
2. ❌ **Database is unreachable** - Supabase is likely paused (free tier auto-pauses after 7 days)
3. ❌ **Migration not applied** - Need to add `clerk_user_id` column
4. ❌ **Vercel env vars not set** - Need to configure production environment

---

## 🔴 STEP 1: Wake Up Supabase Database (5 minutes)

### Check if Database is Paused:

1. **Go to**: https://supabase.com/dashboard
2. **Select your project**: `kfjaziakfrassvzxrxck`
3. **Look for**: Yellow banner saying "Project is paused" or "Database is paused"

### Wake Up the Database:

If you see the paused message:
1. Click **"Resume Project"** or **"Restore"** button
2. Wait 30-60 seconds for database to wake up
3. You'll see "Project is active" confirmation

**Why this happened**: Free tier pauses after 7 days of no activity. This is normal.

---

## 🔴 STEP 2: Apply Clerk Migration via SQL Editor (5 minutes)

### Once database is awake:

1. **Go to**: Supabase Dashboard → **SQL Editor** (left sidebar)
2. **Click**: "New query"
3. **Copy and paste this ENTIRE script**:

```sql
-- Clerk Auth Migration
-- Adds clerk_user_id column and makes company_id/role nullable

BEGIN;

-- Step 1: Add clerk_user_id column
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_id" TEXT;

-- Step 2: Make company_id nullable (for onboarding)
ALTER TABLE "users" ALTER COLUMN "company_id" DROP NOT NULL;

-- Step 3: Make role nullable (for onboarding)
ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL;

-- Step 4: Create unique index on clerk_user_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_id_key" ON "users"("clerk_user_id");

-- Step 5: Create performance index
CREATE INDEX IF NOT EXISTS "users_clerk_user_id_idx" ON "users"("clerk_user_id");

-- Step 6: Drop old supabase_uid indexes
DROP INDEX IF EXISTS "users_supabase_uid_idx";
DROP INDEX IF EXISTS "users_supabase_uid_key";

-- Verification
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('clerk_user_id', 'company_id', 'role')
ORDER BY column_name;

COMMIT;
```

4. **Click**: "Run" button (or press Ctrl+Enter)
5. **Verify**: Bottom panel shows 3 rows with `clerk_user_id`, `company_id`, `role`

✅ **Success indicator**: You should see:
- `clerk_user_id | text | YES`
- `company_id | text | YES`
- `role | USER-DEFINED | YES`

---

## 🔴 STEP 3: Set Vercel Environment Variables (10 minutes)

### Go to Vercel Dashboard:

1. **Open**: https://vercel.com/dashboard
2. **Select**: Your project `shanvihospitality-crm`
3. **Go to**: Settings → Environment Variables

### Add These 4 Variables:

For each variable:
- Click **"Add New"**
- Enter Key and Value (copy exactly as shown below)
- Check ✅ **Production** environment ONLY
- Click **"Save"**

---

### Variable 1: Clerk Publishable Key
```
Key: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

Value: pk_live_

Environment: ✅ Production
```

---

### Variable 2: Clerk Secret Key
```
Key: CLERK_SECRET_KEY

Value: sk_live_

Environment: ✅ Production
```

---

### Variable 3: Database URL (Pooler)
```
Key: DATABASE_URL

Value: postgresql://postgres.

Environment: ✅ Production
```

---

### Variable 4: Direct Database URL
```
Key: DIRECT_URL

Value: postgresql://
Environment: ✅ Production
```

---

### ⚠️ Important Notes:

- **Delete old variables first** if they exist with wrong values
- **Must check "Production"** for each variable (not Preview or Development)
- **Password encoding**: `` becomes ``
- **Two different hosts**: DATABASE_URL uses `pooler`, DIRECT_URL uses `db.xxx`

---

## 🔴 STEP 4: Commit and Push Code (2 minutes)

Open terminal in project folder and run:

```bash
git add .
git commit -m "fix: restore Clerk schema and apply production fixes"
git push origin main
```

This triggers automatic Vercel deployment with the fixed code.

---

## 🔴 STEP 5: Wait for Vercel Deployment (2-3 minutes)

1. **Go to**: Vercel Dashboard → Deployments tab
2. **Watch**: New deployment appear and build
3. **Wait**: For "Ready" status (usually 2-3 minutes)

**OR manually redeploy**:
1. Go to: Deployments tab
2. Find latest deployment
3. Click three dots → "Redeploy"

---

## 🔴 STEP 6: Test Production (5 minutes)

### Test 1: Health Check
Open in browser:
```
https://shanvihospitality-crm.vercel.app/api/health
```

**Expected response**:
```json
{
  "status": "healthy",
  "checks": {
    "clerkConfigured": true,
    "databaseConnected": true
  }
}
```

❌ If unhealthy: Check the `error` field and go back to fix that step

---

### Test 2: Landing Page
```
https://shanvihospitality-crm.vercel.app
```
✅ Should see "Shanvi Hospitality" landing page

---

### Test 3: Sign In
1. Click **"Sign In as Admin"**
2. ✅ Should see Clerk sign-in form with email/password fields
3. Enter your credentials and sign in
4. ✅ Should redirect to `/dashboard`
5. ✅ Dashboard should load completely (no errors)

---

### Test 4: Role-Based Access
**As Admin**:
- ✅ Should see "Employees & Payroll" tab
- ✅ Should see "Staff Analytics" link

**As Staff** (if you have a staff account):
- ✅ Should NOT see "Employees & Payroll" tab
- ✅ Should see: Dashboard, Leads, Tours, Calendar, Company tabs

---

## 🎯 Success Criteria Checklist

Before marking this as complete, verify:

- [ ] Supabase database is active (not paused)
- [ ] Migration SQL ran successfully in Supabase SQL Editor
- [ ] Verification query shows `clerk_user_id` column exists
- [ ] All 4 Vercel environment variables are set with "Production" checked
- [ ] Code is committed and pushed to GitHub
- [ ] Vercel deployment completed successfully
- [ ] `/api/health` returns `"status": "healthy"`
- [ ] Landing page loads
- [ ] Clerk sign-in form appears
- [ ] Can sign in and reach dashboard
- [ ] Dashboard loads without errors
- [ ] Navigation tabs work
- [ ] Role-based access works correctly

---

## 🐛 Troubleshooting

### Issue: "Can't reach database server"
**Cause**: Database is still paused
**Fix**: Go to Supabase Dashboard → Resume project → Wait 60 seconds

### Issue: Migration SQL fails with "column already exists"
**Cause**: Migration was partially applied before
**Fix**: It's safe - the `IF NOT EXISTS` clauses prevent errors. Just continue.

### Issue: Health check shows `databaseConnected: false`
**Causes**:
1. DATABASE_URL not set in Vercel → Go back to Step 3
2. Wrong password encoding → Use `%40` not `@` in password
3. Database paused again → Wake it up

### Issue: Clerk forms not appearing
**Cause**: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set
**Fix**: 
1. Check Vercel env vars
2. Must start with `pk_live_`
3. Must have "Production" checked
4. Redeploy after fixing

### Issue: "Authentication required" on dashboard
**Cause**: CLERK_SECRET_KEY not set
**Fix**: Same as above, but check `sk_live_` key

---

## 📞 If You're Still Stuck

Share these with me:

1. **Health check response**: Copy output from `/api/health`
2. **Supabase status**: Is database paused or active?
3. **Migration result**: Did the SQL query succeed? What did verification show?
4. **Vercel env vars**: Screenshot (blur out secret values)
5. **Browser console**: Any errors when accessing site? (F12 → Console)
6. **Vercel logs**: Runtime Logs from deployment

---

## 🎉 After Everything Works

### Optional: Set Up Webhook (Recommended)

This keeps your database in sync with Clerk automatically:

1. **Clerk Dashboard** → Webhooks → Add Endpoint
2. **URL**: `https://shanvihospitality-crm.vercel.app/api/webhooks/clerk`
3. **Events**: Select `user.created`, `user.updated`, `user.deleted`
4. **Copy**: Signing secret
5. **Vercel**: Add variable `CLERK_WEBHOOK_SIGNING_SECRET` with that secret
6. **Redeploy**

### Next Steps:

1. Create your first lead
2. Build an itinerary
3. Generate a PDF quote
4. Invite team members via Clerk Dashboard
5. Test all features thoroughly

---

## 📝 Summary

This fix requires 3 systems to be configured correctly:

1. **Supabase**: Database must be active + migration applied
2. **Vercel**: 4 environment variables set correctly
3. **Code**: Correct Clerk schema (already done)

The order matters: Database first, then Vercel, then deploy.

Total time: ~25-30 minutes if everything goes smoothly.
