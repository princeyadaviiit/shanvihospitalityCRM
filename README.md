# Shanvi Hospitality CRM

**Enterprise-grade B2B/B2C Destination Management & Travel CRM Platform**

A complete Customer Relationship Management system built specifically for Shanvi Hospitality (Sector 18, Noida) to manage travel leads, custom tour itineraries, bookings, HRMS/payroll, and client communications.

---

## 📋 Table of Contents

1. [Architecture & System Design](#architecture--system-design)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Key Features](#key-features)
6. [API Documentation](#api-documentation)
7. [Setup & Installation](#setup--installation)
8. [Deployment](#deployment)
9. [Security Considerations](#security-considerations)
10. [Feature Matrix](#feature-matrix)

---

## 🏗️ Architecture & System Design

### Multi-Tenant Architecture

The CRM implements a **hard multi-tenancy** model where:

- Each organization (company) has complete data isolation
- All database queries are scoped by `companyId`
- Tenant isolation enforced at both application and database layers
- Same email can exist across different companies

**Data Isolation Strategy:**
```typescript
// Application Layer
const leads = await prisma.lead.findMany({
  where: { companyId: authContext.companyId }, // Tenant scope
});

// Database Layer (Prisma Schema)
@@unique([companyId, email]) // Company-scoped uniqueness
```

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│  Next.js 15 App (React 19) + Capacitor Android App     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Authentication Layer                    │
│         Clerk Auth (Admin-Controlled Credentials)       │
│    Admin sets email + password → Staff can login        │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│   Next.js 15 API Routes (TypeScript + Zod Validation)  │
│         authenticateRequest() → RBAC + Tenant Scope     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                          │
│   Prisma ORM → PostgreSQL (Supabase)                   │
│   Row-Level Security (RLS) + Cascade Deletes           │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Request
    ↓
Clerk Authentication (Middleware)
    ↓
API Route Handler
    ↓
authenticateRequest(request, allowedRoles)
    ├─ Verify Clerk session
    ├─ Check user role (admin/staff_agent/accounts)
    ├─ Get user's companyId
    └─ Return auth context
    ↓
Business Logic (Tenant-scoped)
    ↓
Prisma Database Queries (companyId filter)
    ↓
PostgreSQL (with RLS policies)
    ↓
JSON Response
```

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI Library:** React 19
- **Styling:** Tailwind CSS 3.4
- **Mobile:** Capacitor 8.5 (Android)

### Backend
- **Runtime:** Node.js (Next.js API Routes)
- **Language:** TypeScript 5
- **Validation:** Zod 3.23
- **ORM:** Prisma 5.22

### Database
- **Primary:** PostgreSQL (Supabase)
- **Connection:** Pooled (port 6543) for serverless
- **Direct:** Port 5432 for migrations

### Authentication
- **Provider:** Clerk (Admin-controlled credentials)
- **Strategy:** Email + Password (set by admin)
- **Session:** JWT with secure cookies

### Integrations
- **Payment:** Razorpay (booking payments only)
- **Telephony:** Twilio (call tracking)
- **Messaging:** WhatsApp (quote/voucher delivery)
- **PDF:** PDFKit (invoices, vouchers, itineraries)

---

## 🗄️ Database Schema

### Core Models

#### User (Staff/Admin Authentication)
```prisma
model User {
  id              String    @id @default(cuid())
  clerkUserId     String?   @unique       // Clerk Auth ID
  companyId       String                  // Tenant scope
  name            String
  email           String
  role            UserRole? // admin | staff_agent | accounts
  active          Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([companyId, email])  // Company-scoped email uniqueness
  @@map("users")
}
```

**Key Points:**
- `clerkUserId` links to Clerk authentication
- Admin sets email + password via Clerk Admin API
- `active: true` when admin creates account
- Same email can exist in different companies

#### Lead (Sales Pipeline)
```prisma
model Lead {
  id              String      @id
  companyId       String      // Tenant scope
  name            String      // Customer name
  email           String?
  phone           String
  destination     String
  paxCount        Int
  status          LeadStatus  @default(ENQUIRY)
  quotedPrice     Float
  assignedAgentId String?     // Staff assignment
  
  @@index([companyId, status])
  @@index([companyId, assignedAgentId])
}

enum LeadStatus {
  ENQUIRY       // Initial contact
  IN_PROGRESS   // Quote sent/negotiating
  CONFIRMED     // Booking confirmed
  MISSED        // Lost opportunity
}
```

#### Employee (HRMS)
```prisma
model Employee {
  id              String      @id
  companyId       String      // Tenant scope
  name            String
  email           String
  phone           String
  department      String
  designation     String
  baseSalary      Float
  allowances      Float
  deductions      Float
  netSalary       Float
  bankName        String?
  accountNumber   String?
  status          String      @default("ACTIVE")
  
  @@map("employees")
}
```

#### SalaryPayment (Payroll)
```prisma
model SalaryPayment {
  id              String      @id
  employeeId      String
  companyId       String
  month           String
  baseAmount      Float
  bonusAmount     Float
  deductions      Float
  netPaid         Float
  paymentDate     DateTime
  paymentMode     String      @map("payment_mode")
  paymentStatus   String      @map("payment_status")
  
  @@map("salary_payments")
}
```

---

## 🔐 Authentication & Authorization

### Authentication System

**Admin-Controlled Credentials** (No Email Invitations)

1. **Staff Creation (Admin Only)**
   ```typescript
   POST /api/staff
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "SecurePass123", // Set by admin
     "role": "staff_agent"
   }
   ```
   - Admin creates Clerk user directly with password
   - Staff immediately receives login credentials
   - No email invitations required

2. **Staff Login**
   - Staff uses email + password at `/sign-in`
   - Clerk authenticates and creates session

3. **Password Management**
   ```typescript
   PATCH /api/staff/:id
   {
     "email": "newemail@example.com",  // Optional
     "password": "NewPassword123"      // Optional
   }
   ```
   - Admin can reset staff passwords anytime
   - Admin can change staff email addresses

### Role-Based Access Control (RBAC)

**Three Roles:**

1. **admin**
   - Full system access
   - Staff management (create, edit, delete, reset passwords)
   - Lead assignment and reassignment
   - HRMS and payroll access
   - Financial data access

2. **staff_agent**
   - View and manage own assigned leads
   - Create and edit own leads
   - Add notes and itineraries
   - Cannot access HRMS/payroll
   - Cannot reassign leads

3. **accounts**
   - Read-only access to leads
   - Full access to bookings, invoices, ledgers
   - No lead editing or pipeline management
   - No HRMS access

---

## ✨ Key Features

### 1. Staff Management (Admin Only)
- ✅ Create staff accounts with email + password
- ✅ Password management (admin resets passwords)
- ✅ Email updates (change staff email addresses)
- ✅ Role assignment (admin, staff_agent, accounts)
- ✅ Activate/deactivate accounts
- ✅ Delete staff (soft/hard delete based on data)

### 2. Lead Management
- ✅ Create leads from multiple sources
- ✅ Edit lead details (admin: all, staff: own only)
- ✅ Delete leads (admin only, prevents if booking exists)
- ✅ Assign leads to staff members
- ✅ Change lead assignment (admin only)
- ✅ Pipeline stages: ENQUIRY → IN_PROGRESS → CONFIRMED/MISSED
- ✅ Activity timeline (notes, calls, WhatsApp)
- ✅ Lead filtering by status and assigned agent

### 3. Custom Tour Itineraries
- ✅ Multi-day tour builder
- ✅ Day-by-day activities and accommodation
- ✅ Automatic costing (base + markup = final)
- ✅ PDF quote generation
- ✅ WhatsApp quote delivery

### 4. Booking Management
- ✅ Convert leads to bookings
- ✅ Hotel voucher PDFs
- ✅ GST-compliant invoice generation
- ✅ Payment tracking (advance, balance)
- ✅ WhatsApp voucher delivery

### 5. HRMS (Admin Only)
- ✅ Employee directory
- ✅ Add/edit/delete employees
- ✅ Salary structure (base + allowances - deductions)
- ✅ Bank account details (A/C, IFSC, PAN)
- ✅ Commission rate tracking
- ✅ Department and designation management

### 6. Payroll (Admin Only)
- ✅ Monthly salary payment recording
- ✅ Multiple payment modes (NEFT, IMPS, UPI, CHEQUE, CASH)
- ✅ Transaction reference tracking
- ✅ Payroll summary (total payroll, headcount, average)
- ✅ Payment history per employee

### 7. Dashboard & Analytics
- ✅ Executive dashboard (revenue, pipeline, conversions)
- ✅ Sales leaderboard with staff rankings
- ✅ Monthly targets and progress
- ✅ Admin analytics (payroll summaries, headcount)

### 8. Communication
- ✅ WhatsApp integration (quotes, vouchers)
- ✅ Twilio call tracking
- ✅ Activity timeline

### 9. Security
- ✅ Multi-tenant data isolation
- ✅ Company-scoped database queries
- ✅ Audit logging
- ✅ Rate limiting
- ✅ Security headers (OWASP)

---

## 🔌 API Documentation

### Base URL
```
Production: https://shanvihospitality-crm.vercel.app
Development: http://localhost:3000
```

### Staff Management APIs

#### Create Staff
```http
POST /api/staff
Authorization: Required (admin only)

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123",
  "role": "staff_agent"
}
```

#### Update Staff
```http
PATCH /api/staff/:id
Authorization: Required (admin only)

{
  "email": "newemail@example.com",
  "password": "NewPassword123",
  "role": "admin",
  "active": false
}
```

#### Delete Staff
```http
DELETE /api/staff/:id
Authorization: Required (admin only)
```

### Lead Management APIs

#### Create Lead
```http
POST /api/leads
Authorization: Required (admin, staff_agent)

{
  "name": "Rajesh Kumar",
  "phone": "+919999885087",
  "destination": "Haridwar",
  "paxCount": 4,
  "quotedPrice": 45000
}
```

#### Update Lead
```http
PATCH /api/leads/:id
Authorization: Required (admin, staff_agent)

{
  "status": "IN_PROGRESS",
  "assignedAgentId": "clxxxxx"
}
```

#### Delete Lead
```http
DELETE /api/leads/:id
Authorization: Required (admin only)
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Clerk account (for authentication)

### Environment Variables

Create `.env` file:

```bash
# Database (Supabase)
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Installation Steps

```bash
# 1. Clone repository
git clone <repo-url>
cd CRM

# 2. Install dependencies
npm install

# 3. Setup database
npx prisma generate
npx prisma db push

# 4. Run development server
npm run dev

# 5. Open browser
http://localhost:3000
```

---

## 🌐 Deployment

### Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Set environment variables in Vercel dashboard
```

### Clerk Webhook Configuration

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SIGNING_SECRET`

---

## 🔒 Security Considerations

### Multi-Tenant Isolation
- All queries filtered by `companyId`
- Database RLS policies enforce tenant boundaries
- No cross-tenant data leakage possible

### Authentication Security
- Admin controls all staff credentials (no self-signup)
- Passwords minimum 8 characters
- Clerk handles password hashing and session management
- JWT tokens with secure httpOnly cookies

### API Security
- All routes authenticated via Clerk middleware
- Role-based access control (RBAC) enforced
- Rate limiting on auth and WhatsApp routes
- Input validation via Zod schemas

---

## 📊 Feature Matrix

| Feature | Admin | Staff Agent | Accounts |
|---------|-------|-------------|----------|
| **Staff Management** |
| Create staff with password | ✅ | ❌ | ❌ |
| Reset staff passwords | ✅ | ❌ | ❌ |
| Edit staff details | ✅ | ❌ | ❌ |
| Delete staff | ✅ | ❌ | ❌ |
| **Lead Management** |
| Create leads | ✅ | ✅ | ❌ |
| Edit any lead | ✅ | Own only | ❌ |
| Delete leads | ✅ | ❌ | ❌ |
| Assign leads to staff | ✅ | ❌ | ❌ |
| View all leads | ✅ | Own only | ✅ (read) |
| **HRMS & Payroll** |
| View employees | ✅ | ❌ | ❌ |
| Add employees | ✅ | ❌ | ❌ |
| Delete employees | ✅ | ❌ | ❌ |
| Record salary payments | ✅ | ❌ | ❌ |
| View payroll | ✅ | ❌ | ❌ |

---

## 🏢 Company Information

**Shanvi Hospitality**  
Sector 18, Noida, Uttar Pradesh  
GSTIN: `09AEKFS1932F1ZX`  
24/7 Support: `+91 9999885087`

---

## 📄 License

Proprietary - All Rights Reserved  
© 2026 Shanvi Hospitality

---

**Built with ❤️ for Shanvi Hospitality**
