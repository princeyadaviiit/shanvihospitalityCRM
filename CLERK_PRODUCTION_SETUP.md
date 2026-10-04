# Clerk Production Setup Guide

## Issue: Clerk Login Not Showing in Production

This guide will help you fix Clerk authentication in your production environment.

---

## ✅ Step 1: Configure Your Production Domain in Clerk Dashboard

**CRITICAL:** Clerk live keys only work with registered domains.

1. **Go to Clerk Dashboard:**
   - Visit: https://dashboard.clerk.com
   - Select your project

2. **Add Production Domain:**
   - Navigate to: **Configure → Domains**
   - Click **"Add domain"**
   - Enter your production domain (e.g., `shanvihospitality-crm.vercel.app` or custom domain)
   - Click **"Add"** and follow verification steps
   - **Wait for domain to show "Active" status** ⚠️

3. **Verify Your Domain Settings:**
   - Make sure your production domain is listed and marked as **"Active"**
   - If using a custom domain, ensure DNS records are properly configured

---

## ✅ Step 2: Set Environment Variables in Production

Your `.env.local` file is **NOT deployed** to production. You must configure these variables on your hosting platform.

### For Vercel Deployment:

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: **Settings → Environment Variables**
4. Add the following variables:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxx

# Database (if not already set)
DATABASE_URL=your_supabase_connection_pooler_url
DIRECT_URL=your_supabase_direct_connection_url

# App URL
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

5. **Select environments:** Production, Preview, Development (all three)
6. Click **"Save"**
7. **IMPORTANT:** Trigger a new deployment after adding variables

### For Other Hosting Platforms:

- **Netlify:** Site settings → Environment variables
- **Railway:** Project → Variables
- **AWS/Custom:** Set in your deployment configuration

---

## ✅ Step 3: Verify Clerk Webhook Configuration

If you're using Clerk webhooks for user sync:

1. **In Clerk Dashboard:**
   - Go to: **Configure → Webhooks**
   - Click **"Add Endpoint"**

2. **Add Webhook URL:**
   ```
   https://your-production-domain.com/api/webhooks/clerk
   ```

3. **Select Events:**
   - `user.created`
   - `user.updated`
   - `user.deleted`

4. **Copy the Signing Secret** and add it to your environment variables:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
   ```

---

## ✅ Step 4: Redeploy Your Application

After setting environment variables:

```bash
# If using Vercel CLI
vercel --prod

# Or trigger redeploy in your platform's dashboard
```

**Why redeploy?** Environment variables are only loaded during build time for `NEXT_PUBLIC_*` variables.

---

## ✅ Step 5: Test the Authentication Flow

1. **Open your production URL** in an incognito/private window
2. **Click "Sign In as Admin"** or "Sign In as Staff"
3. **You should see the Clerk login modal**
4. **Complete sign-in** and verify you're redirected to `/dashboard`

---

## 🔍 Common Issues & Solutions

### Issue: "Invalid publishable key" Error

**Solution:**
- Verify the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correctly set in production
- Make sure it starts with `pk_live_` (not `pk_test_`)
- Redeploy after setting the variable

### Issue: Clerk Modal Not Appearing

**Solution:**
- Check browser console for errors (F12 → Console tab)
- Verify your domain is registered and **Active** in Clerk Dashboard
- Clear browser cache and try again
- Make sure you're testing on the registered domain (not localhost)

### Issue: "This domain is not authorized"

**Solution:**
- Your production domain is not registered in Clerk
- Go back to **Step 1** and add your domain
- Wait for it to show "Active" status

### Issue: Sign-in Works But Redirects to Error Page

**Solution:**
- Check that your Clerk middleware is properly configured
- Verify `fallbackRedirectUrl="/dashboard"` is set in sign-in page
- Ensure `/dashboard` route exists and is accessible

### Issue: Server Component Render Error After Sign-In

**Solution:**
- This was fixed in `app/onboarding/page.tsx` with hard reload
- Make sure users complete onboarding before accessing dashboard
- Check that `companyId` is properly set after onboarding

---

## 🧪 Quick Verification Checklist

Before declaring it "fixed", verify all of these:

- [ ] Production domain is registered in Clerk Dashboard and shows "Active"
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set in production environment
- [ ] `CLERK_SECRET_KEY` is set in production environment
- [ ] Application has been redeployed after adding environment variables
- [ ] Can access production URL and see landing page
- [ ] Clicking "Sign In" shows Clerk authentication modal
- [ ] Can successfully sign in and am redirected to dashboard
- [ ] Onboarding flow works for new users
- [ ] Admin analytics dashboard loads without errors

---

## 🆘 Still Not Working?

### Check Clerk Service Status
Visit: https://status.clerk.com

### Check Browser Console Errors
1. Open production site in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Click "Sign In" button
5. Look for red error messages
6. Share the error messages for further debugging

### Verify Network Requests
1. In Developer Tools, go to **Network** tab
2. Filter by "clerk"
3. Click "Sign In" button
4. Check if requests to Clerk API are failing
5. Look at the response codes (should be 200, not 401/403/404)

---

## 📞 Need More Help?

If you're still stuck after following this guide:
1. Check the browser console errors (most important)
2. Verify all environment variables are set correctly
3. Ensure your production domain is registered in Clerk
4. Try signing in with an incognito window (to rule out cache issues)

Share any error messages you see for more specific help!
