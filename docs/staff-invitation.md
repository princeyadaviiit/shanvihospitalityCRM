# Staff Invitation System

## Overview

The Staff Invitation system allows administrators to invite new team members to the Shanvi Hospitality CRM. When invited, staff receive an email with a sign-up link and are pre-registered in the system with their assigned role.

## Features

✅ **Company-scoped invitations** - Same email can exist in different companies  
✅ **Automatic email delivery** - Invitation emails sent via Resend API  
✅ **Fallback mechanism** - Works with or without email configuration  
✅ **Role-based access** - Assign roles during invitation (admin, staff_agent, accounts)  
✅ **Secure authentication** - Uses Clerk for signup and authentication  

---

## How It Works

### 1. Admin Invites Staff
- Admin navigates to **Employees & Payroll** section
- Clicks "Add Employee"
- Enables "Grant System Login Access" checkbox
- Fills in staff details (name, email, role)
- Submits the form

### 2. System Processing
- Creates user record with `clerkUserId: null` (pending signup)
- Sends invitation email via Resend API (if configured)
- Returns success response with invitation status

### 3. Staff Receives Email
Staff receives branded email containing:
- Welcome message
- Their assigned role
- Sign-up button linking to `/sign-up`
- Their pre-registered email address

### 4. Staff Signs Up
- Staff clicks "Sign Up Now" button in email
- Redirected to Clerk sign-up page
- Creates account using the invited email
- Sets their own password

### 5. Account Linking
- Clerk webhook fires on successful signup
- System matches email to pre-created user record
- Updates `clerkUserId` field
- Activates the account (`active: true`)
- Staff can now log in

---

## Configuration

### Required Environment Variables

Add these to your `.env` file:

```bash
# Resend Email Service (for sending invitations)
RESEND_API_KEY=re_your_actual_resend_api_key_here

# App URL (used in email links)
NEXT_PUBLIC_APP_URL=https://shanvihospitality-crm.vercel.app

# Clerk (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
```

### Getting a Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for free account (100 emails/day on free tier)
3. Navigate to **API Keys** section
4. Create new API key
5. Copy key and add to `.env` as `RESEND_API_KEY`

### Email Domain Configuration (Production)

For production, configure your sending domain in Resend:

1. Add your domain in Resend dashboard
2. Add DNS records (SPF, DKIM)
3. Update `from` address in `lib/email.ts`:

```typescript
from: 'Shanvi Hospitality <noreply@yourdomain.com>',
```

---

## API Reference

### POST `/api/staff`

Creates new staff member and sends invitation.

**Authentication**: Requires `admin` role

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "staff_agent"
}
```

**Roles**: `admin` | `staff_agent` | `accounts`

**Response (Email Configured)**:
```json
{
  "success": true,
  "staff": {
    "id": "clxxxxx",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "staff_agent",
    "active": false,
    "invitationSent": true
  },
  "message": "Staff account created and invitation email sent to john@example.com"
}
```

**Response (Email Not Configured)**:
```json
{
  "success": true,
  "staff": { ... },
  "message": "Email not configured. Share this link with John Doe: https://yourdomain.com/sign-up"
}
```

**Error Responses**:

```json
// Duplicate email in same company
{
  "error": "A staff member with this email already exists in your company"
}

// Missing required fields
{
  "error": "Invalid input",
  "details": [...]
}

// Unauthorized
{
  "error": "Admin access required"
}
```

---

## Email Template

The invitation email includes:

**Subject**: `You've been invited to Shanvi CRM`

**Content**:
- Personalized greeting with staff name
- Company name (Shanvi Hospitality CRM)
- Assigned role
- Call-to-action button
- Email address for reference
- Security notice

**HTML Template** (in `lib/email.ts`):
```html
<div style="font-family: Arial, sans-serif; max-width: 600px;">
  <h2>Welcome to Shanvi Hospitality CRM</h2>
  <p>Hi {name},</p>
  <p>You've been invited to join as a <strong>{role}</strong>.</p>
  <a href="{signUpUrl}">Sign Up Now</a>
  <p>Email: {email}<br>Role: {role}</p>
</div>
```

---

## Troubleshooting

### Email Not Sending

**Problem**: Staff not receiving invitation emails

**Solutions**:
1. Check `RESEND_API_KEY` is set in `.env`
2. Verify API key is valid in Resend dashboard
3. Check server logs for email errors
4. Ensure sending domain is verified (production)
5. Check Resend email logs for delivery status

**Fallback**: System provides manual sign-up link in response

### Duplicate Email Error

**Problem**: "A staff member with this email already exists"

**Solutions**:
1. Check if staff already exists in your company
2. Remove duplicate staff member first
3. Use different email address

**Note**: Same email CAN exist in different companies (multi-tenant)

### Staff Can't Sign Up

**Problem**: Staff sees error during signup

**Solutions**:
1. Verify Clerk is properly configured
2. Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
3. Ensure staff uses exact email from invitation
4. Check Clerk dashboard for signup errors

### Account Not Activating

**Problem**: Staff signs up but can't access system

**Solutions**:
1. Verify Clerk webhook is configured and receiving events
2. Check `/api/webhooks/clerk` route logs
3. Ensure `CLERK_WEBHOOK_SIGNING_SECRET` is correct
4. Manually activate user in database if needed:

```sql
UPDATE users 
SET active = true, clerk_user_id = 'user_xxx'
WHERE email = 'staff@example.com';
```

---

## Security Considerations

### Company Isolation
- Duplicate email check is **company-scoped**
- Staff can only access data from their own company
- `companyId` enforced in all database queries

### Role-Based Access Control
- Only `admin` role can invite staff
- Invited staff assigned specific role during creation
- Roles: `admin`, `staff_agent`, `accounts`

### Email Security
- No sensitive data in email (no passwords, no tokens)
- Sign-up link is public but requires Clerk verification
- Staff must verify email ownership during signup

### Webhook Security
- Clerk webhook verifies signature using `CLERK_WEBHOOK_SIGNING_SECRET`
- Only verified webhooks can activate accounts
- Prevents unauthorized account activation

---

## Testing

### Manual Testing Checklist

1. **Invite Staff (Email Configured)**
   - [ ] Admin can access Employees & Payroll
   - [ ] "Grant System Login Access" checkbox visible
   - [ ] Email sent successfully
   - [ ] Staff receives email
   - [ ] Sign-up link works
   - [ ] Account activates after signup

2. **Invite Staff (No Email)**
   - [ ] System returns manual link
   - [ ] Staff can sign up using link
   - [ ] Account activates correctly

3. **Duplicate Detection**
   - [ ] Cannot create duplicate in same company
   - [ ] Can create same email in different company

4. **Role Assignment**
   - [ ] Staff receives correct role
   - [ ] Role permissions apply correctly
   - [ ] Staff can only access allowed features

### Automated Testing

Add test cases to `tests/phase1.test.ts`:

```typescript
describe('Staff Invitation', () => {
  it('should send invitation email when configured', async () => {
    // Test implementation
  });
  
  it('should prevent duplicate email in same company', async () => {
    // Test implementation
  });
  
  it('should allow same email in different companies', async () => {
    // Test implementation
  });
});
```

---

## Code Reference

### Key Files

| File | Purpose |
|------|---------|
| `app/api/staff/route.ts` | Staff invitation API endpoint |
| `lib/email.ts` | Email service (Resend integration) |
| `components/employees/EmployeeManager.tsx` | UI for inviting staff |
| `app/api/webhooks/clerk/route.ts` | Account activation webhook |

### Database Schema

```prisma
model User {
  id          String    @id @default(cuid())
  clerkUserId String?   @unique @map("clerk_user_id")
  companyId   String    @map("company_id")
  name        String
  email       String
  role        UserRole?
  active      Boolean   @default(false)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  
  company     Company   @relation(fields: [companyId], references: [id])
  
  @@unique([companyId, email])
  @@map("users")
}
```

**Key Points**:
- `clerkUserId` is **nullable** (set after signup)
- `active` defaults to `false` (activated by webhook)
- Unique constraint on `[companyId, email]` (company-scoped)

---

## Migration Guide

### From Manual User Creation

If you were creating users manually before:

**Before**:
```typescript
// Manual user creation
await prisma.user.create({
  data: {
    clerkUserId: 'user_xxx', // Required
    email: 'staff@example.com',
    // ...
  }
});
```

**After**:
```typescript
// Use invitation API
await fetch('/api/staff', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Staff Name',
    email: 'staff@example.com',
    role: 'staff_agent',
  }),
});
// Email sent automatically, staff signs up themselves
```

### From Clerk Invitations API

The system previously attempted to use Clerk's invitations API but encountered 403 errors. The new system:

- ✅ No longer requires Clerk invitations API
- ✅ Works with free Clerk tier
- ✅ Uses Resend for email delivery
- ✅ More reliable and configurable

---

## Future Enhancements

Potential improvements for future versions:

1. **Invitation Expiry** - Add expiration date for invitations
2. **Resend Invitation** - Allow admins to resend emails
3. **Bulk Invitations** - Invite multiple staff at once
4. **Custom Email Templates** - Admin-configurable email design
5. **Invitation Tracking** - Dashboard showing pending invitations
6. **Role Templates** - Pre-configured permission sets
7. **SMS Invitations** - Alternative to email via Twilio

---

## Support

For issues or questions:

1. Check this documentation first
2. Review server logs for errors
3. Check Resend dashboard for email delivery
4. Check Clerk dashboard for auth issues
5. Contact technical support

**Company Contact**: Shanvi Hospitality  
**Support**: +91 9999885087  
**Email**: support@shanvihospitality.com
