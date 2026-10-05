# Production Deployment Troubleshooting Guide

This guide helps diagnose and fix issues in your Vercel production deployment.

---

## Critical: Database Connection Error

**Error**: `Can't reach database server at aws-0-ap-southeast-2.pooler.supabase.com:6543`

This means your Vercel production environment doesn't have the correct database connection strings.

### Step 1: Verify Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select project: **shanvihospitality-crm**
3. Go to: **Settings** → **Environment Variables**
4. You MUST have these 4 variables set with **Production** environment checked:

#### Required Variables:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_live_
Environment: ✅ Production

CLERK_SECRET_KEY
Value: sk_live_
Environment: ✅ Production

DATABASE_URL
Value: postgresql://postgres.
Environment: ✅ Production

DIRECT_URL
Value: postgresql://postgres.
Environment: ✅ Production
```

**IMPORTANT NOTES:**
- The `@` symbol in password `@` is URL-encoded as `%40`
- DATABASE_URL uses **pooler** host (port 6543) with `?pgbouncer=true`
- DIRECT_URL uses **db.xxxxxxxxx.supabase.co** host (port 5432)
- Both must have **Production** environment checked

### Step 2: Delete Old/Wrong Variables

If you see variables with wrong values:
1. Click the **three dots** next to the variable
2. Click **Delete**
3. Add the correct variable with values above

### Step 3: Redeploy

After setting all 4 variables:
1. Go to **Deployments** tab
2. Find your latest deployment
3. Click **three dots (...)** → **Redeploy**
4. Wait 2-3 minutes for deployment to complete

### Step 4: Test Health Endpoint

After redeployment, test the health check:
1. Open: https://shanvihospitality-crm.vercel.app/api/health
2. You should see:
   ```json
   {
     "status": "healthy",
     "checks": {
       "clerkConfigured": true,
       "databaseConnected": true,
       ...
     }
   }
   ```
3. If `databaseConnected: false`, check the error message in the response

---

## Understanding Authentication Flow

**IMPORTANT**: There is NO separate admin/staff login route!

### How Authentication Works:

1. **Both admin and staff use the same sign-in page**: `/sign-in`
2. **Role determination happens AFTER login**, not before
3. **Authentication flow**:
   ```
   Landing Page (/)
     ↓
   Click "Sign In as Admin" OR "Sign In as Staff" (both go to same page)
     ↓
   Clerk Sign-In Page (/sign-in)
     ↓
   Enter email/password
     ↓
   Clerk authenticates
     ↓
   Redirect to /dashboard
     ↓
   Dashboard checks user's role from database
     ↓
   Shows role-appropriate UI
   ```

4. **First-time users**:
   - Sign up → No company/role in database
   - Redirected to `/onboarding`
   - Create company → Assigned as `admin` role
   - Then access dashboard

5. **Staff users**:
   - Admin invites staff (sets companyId + role in Clerk metadata)
   - Staff signs in at same `/sign-in` page
   - Webhook syncs role to database
   - Dashboard shows staff-appropriate UI (no Employees tab, etc.)

### Role-Based Access Control

Access control happens in:
- **Dashboard UI**: `DashboardShell.tsx` shows/hides tabs based on `user.role`
- **API Routes**: Use `requireRole(['admin'])` to restrict endpoints
- **Server Components**: Check `user.role` and render accordingly

---

## Common Issues & Solutions

### Issue 1: "Can't reach database server"
**Cause**: DATABASE_URL not set or incorrect in Vercel
**Fix**: Follow Step 1-3 above to set correct DATABASE_URL

### Issue 2: "Clerk forms not appearing"
**Cause**: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not set or incorrect
**Fix**: Set correct Clerk publishable key in Vercel (see Step 1)

### Issue 3: "Authentication required" error on dashboard
**Cause**: CLERK_SECRET_KEY not set or incorrect
**Fix**: Set correct Clerk secret key in Vercel (see Step 1)

### Issue 4: "User redirected to onboarding repeatedly"
**Cause**: Database not updating user's companyId/role
**Fix**: 
1. Check if onboarding API is working: `/api/onboarding`
2. Verify database connection is working
3. Check browser console for errors

### Issue 5: "Staff can see admin features"
**Cause**: Role not set correctly in database
**Fix**:
1. Check user's role in Supabase: `SELECT * FROM users WHERE email = 'staff@email.com'`
2. Should have `role = 'staff_agent'` and correct `companyId`
3. If wrong, update manually or reinvite the user

---

## Debugging Steps

### 1. Check Health Endpoint
```bash
curl https://shanvihospitality-crm.vercel.app/api/health
```
Should return `"status": "healthy"`

### 2. Check Vercel Deployment Logs
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Go to **Runtime Logs** tab
4. Look for database connection errors or Clerk errors

### 3. Check Clerk Dashboard
1. Go to: https://dashboard.clerk.com
2. Select your application
3. Go to: **Users** tab
4. Verify users are being created
5. Check public_metadata for companyId/role

### 4. Check Supabase Database
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to: **SQL Editor**
4. Run: 
   ```sql
   SELECT id, email, "clerkUserId", "companyId", role, active 
   FROM users 
   ORDER BY "createdAt" DESC 
   LIMIT 10;
   ```
5. Verify users have correct companyId and role

---

## Production Deployment Checklist

Before marking deployment as complete:

- [ ] All 4 environment variables set in Vercel Production
- [ ] Redeployed after setting variables
- [ ] Health check endpoint returns "healthy"
- [ ] Can access landing page: https://shanvihospitality-crm.vercel.app
- [ ] Can click sign-in and see Clerk login form
- [ ] Can sign in and reach dashboard
- [ ] Dashboard loads without database errors
- [ ] Role-based UI works (admin sees all tabs, staff doesn't see Employees)
- [ ] Can create a lead in the pipeline
- [ ] Webhook is configured in Clerk (optional but recommended)

---

## Next Steps After Successful Deployment

1. **Set up Clerk Webhook** (for user sync):
   - Clerk Dashboard → Webhooks → Add Endpoint
   - URL: `https://shanvihospitality-crm.vercel.app/api/webhooks/clerk`
   - Events: Select `user.created`, `user.updated`, `user.deleted`
   - Copy signing secret and add to Vercel as `CLERK_WEBHOOK_SIGNING_SECRET`

2. **Invite Staff Users**:
   - Use Clerk Dashboard → Users → Invite user
   - Set public_metadata: `{"companyId": "your-company-id", "role": "staff_agent"}`

3. **Test Role-Based Access**:
   - Sign in as admin → should see Employees tab
   - Sign in as staff → should NOT see Employees tab

---

## Still Having Issues?

If you've followed all steps and still have errors:

1. **Share the exact error** from:
   - Browser console (F12 → Console tab)
   - Vercel Runtime Logs
   - `/api/health` response

2. **Verify your setup**:
   - Screenshot of Vercel environment variables (hide secret values)
   - Health check response
   - Browser console errors

3. **Check if Supabase is running**:
   - Free tier auto-pauses after 7 days of inactivity
   - Go to Supabase Dashboard and wake it up if paused
