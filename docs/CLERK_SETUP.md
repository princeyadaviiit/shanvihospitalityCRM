# Clerk Authentication Setup Guide

## Overview
The Shanvi Hospitality CRM has been migrated from Supabase Auth to Clerk for authentication. Supabase is now used **only** as the managed PostgreSQL database, accessed through Prisma.

## Architecture
- **Clerk handles**: Sign-up, login, logout, sessions, password management, MFA
- **Our database stores**: `companyId` and `role` (admin | staff_agent | accounts)
- **Tenant isolation**: Enforced server-side via `companyId` in all database queries
- **RBAC**: Enforced server-side in API routes using `requireRole()` and `requireAuth()` helpers

---

## Required Clerk Dashboard Configuration

### 1. Create a Clerk Application
1. Go to [https://clerk.com](https://clerk.com) and sign up/sign in
2. Click "Add Application"
3. Name: "Shanvi Hospitality CRM"
4. Choose authentication methods:
   - ✅ Email & Password (required)
   - ⚠️ Do NOT enable social logins unless specifically needed
5. Click "Create Application"

### 2. Get Your API Keys
After creating the application, you'll see your API keys. Add them to your `.env` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. Configure Webhook
The application uses webhooks to sync Clerk users with your database.

**Webhook URL**: `https://your-domain.com/api/webhooks/clerk`

**Steps:**
1. In Clerk Dashboard → Webhooks → Add Endpoint
2. **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
3. **Events to subscribe to**:
   - ✅ `user.created`
   - ✅ `user.updated`  
   - ✅ `user.deleted`
4. Click "Create"
5. Copy the **Signing Secret** and add to `.env`:

```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**For local development**, use a tunnel service:
```bash
# Option 1: ngrok
ngrok http 3000
# Use the ngrok URL as your webhook endpoint: https://abc123.ngrok.io/api/webhooks/clerk

# Option 2: Clerk's built-in tunnel (if available)
# Follow Clerk's documentation for local webhook testing
```

### 4. Configure Redirect URLs
In Clerk Dashboard → Paths:

**Sign-in page**: `/sign-in`
**Sign-up page**: `/sign-up`
**After sign-in redirect**: `/dashboard`
**After sign-up redirect**: `/onboarding`

### 5. Customize User Profile Fields (Optional)
In Clerk Dashboard → User & Authentication → Email, Phone, Username:
- ✅ Email address: Required
- Name fields: Optional but recommended

---

## Environment Variables Checklist

Your `.env` file should contain:

```bash
# Database (Supabase Postgres - connection pooler for serverless)
DATABASE_URL=postgresql://postgres:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

---

## Database Migration

Run the Prisma migration to update the User table schema:

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or create and run a migration
npx prisma migrate dev --name clerk_auth_integration
```

**Schema changes made:**
- Added `clerkUserId` field (unique)
- Made `companyId` nullable (for onboarding state)
- Made `role` nullable (for onboarding state)
- Removed `supabaseUid` references

---

## User Flows

### New Admin Sign-Up
1. User visits landing page at `/`
2. Clicks "Create Company Account" under Admin Portal
3. Signs up via Clerk at `/sign-up`
4. Clerk webhook creates user record in database
5. User is redirected to `/onboarding`
6. User fills in company details (name, GST, currency)
7. Backend creates Company and assigns user as `admin`
8. User is redirected to `/dashboard`

### Staff Sign-In
1. Admin invites staff via the Staff Management page
2. Clerk sends invitation email with magic link
3. Staff clicks link and completes sign-up at `/sign-up`
4. Webhook updates user record with `companyId` and `role` from invitation metadata
5. User is redirected to `/dashboard`

### Existing User Sign-In
1. User visits landing page at `/`
2. Clicks "Sign In as Admin" or "Sign In as Staff"
3. Signs in via Clerk at `/sign-in`
4. Clerk redirects to `/dashboard`
5. Dashboard page checks onboarding status and redirects if incomplete

---

## Staff Invitation System

Admins invite staff members using Clerk's Invitations API:

```typescript
// Backend automatically handles this when admin creates a staff member
await clerk.invitations.createInvitation({
  emailAddress: 'staff@example.com',
  publicMetadata: {
    companyId: 'company_123',
    role: 'staff_agent',
    invitedBy: 'admin_user_id',
  },
  redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/sign-up`,
});
```

The webhook automatically assigns the `companyId` and `role` when the invited user completes sign-up.

---

## Testing Checklist

### Authentication Flow
- [ ] New user can sign up and create a company
- [ ] User is redirected to onboarding after sign-up
- [ ] Company creation works and assigns admin role
- [ ] User can log out and log back in
- [ ] Unauthenticated users are redirected to landing page

### Staff Management
- [ ] Admin can invite staff members
- [ ] Staff receives invitation email
- [ ] Staff can sign up via invitation link
- [ ] Staff is assigned correct companyId and role
- [ ] Admin can deactivate staff
- [ ] Deactivated staff cannot log in (401 error)

### RBAC & Tenant Isolation
- [ ] Admin-only routes reject staff_agent with 403
- [ ] Staff agent only sees their own leads
- [ ] Users from Company A cannot access Company B's data (test explicitly)
- [ ] Webhook signature validation works

### Security
- [ ] No secrets in repository (check with `git log --all -p | grep -i "sk_test"`)
- [ ] Webhook endpoint validates signatures
- [ ] All API routes use `requireRole()` or `requireAuth()`
- [ ] No `companyId` or `role` accepted from client requests

---

## Troubleshooting

### Webhook not firing
- Check webhook URL is publicly accessible
- Verify signing secret is correct in `.env`
- Check Clerk Dashboard → Webhooks → Attempts for errors
- For local dev, ensure tunnel (ngrok) is running

### User not found after sign-up
- Check webhook is properly configured
- Verify webhook logs in Clerk Dashboard
- Check database for user record with correct `clerkUserId`
- User might exist but webhook failed - try manual sync

### 403 Forbidden errors
- User might not have completed onboarding (`companyId` or `role` is null)
- Check user's role matches required roles in `requireRole()` call
- Verify `active` flag is true in database

### Build errors
- Run `npx tsc --noEmit` to check TypeScript errors
- Run `npm run lint` to check ESLint warnings
- Ensure all old Supabase Auth imports are removed

---

## Migration from Existing Supabase Auth Users

If you have existing users in Supabase Auth that need to be migrated to Clerk:

1. **Export users** from Supabase (email, metadata)
2. **Bulk invite** via Clerk API with correct metadata
3. **Map `clerkUserId`** to existing database records when they accept invitations
4. Or: **Manual migration script** that creates Clerk accounts and updates database

Contact Clerk support for bulk migration assistance if needed.

---

## Production Deployment Checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Update Clerk webhook URL to production endpoint
- [ ] Update Clerk redirect URLs to production paths
- [ ] Configure Clerk production keys (not test keys)
- [ ] Test webhook with production URL
- [ ] Run database migration on production database
- [ ] Test complete authentication flow in production
- [ ] Monitor Clerk webhook logs for first 24 hours

---

## Support

- **Clerk Documentation**: https://clerk.com/docs
- **Clerk Support**: https://clerk.com/support
- **Application Issues**: Check application logs and webhook attempts in Clerk Dashboard
