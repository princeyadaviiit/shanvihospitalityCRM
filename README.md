# Shanvi Hospitality — Next-Gen Tour Operations & CRM Platform

An enterprise-grade B2B/B2C Destination Management & Travel CRM engineered for **Shanvi Hospitality** (Sector 18, Noida, Uttar Pradesh). Built with Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase, and Prisma.

---

## 🌟 Key Platform Features

### 1. 📊 Executive Dashboard & Sales Engine (Phase 5)
- **Real-Time KPIs**: Track New Enquiries, Active Proposals, Confirmed Bookings, and Conversion Rate.
- **Sales Target Meter**: Visual progress tracking against monthly agency revenue quotas.
- **Detailed Sales Report**: Interactive modal displaying stage-by-stage pipeline funnels, agent conversion leaderboards, and printable executive summaries (`/api/reports/sales`).

### 2. 🗂️ Lead Pipeline & Instant Quotations
- **HTML5 Drag-and-Drop Kanban Board**: 4 pipeline stages (`Enquiry`, `In Progress`, `Confirmed`, `Missed`).
- **Instant WhatsApp Proposal Dispatch**: 1-click WhatsApp quote generator pre-composed with Shanvi branding via `wa.me` deep links or Twilio sandbox, auto-logging timeline notes.
- **Custom Itinerary & Quote Builder**: Multi-day itinerary creator with line items (Hotels, Transport, Meals, Activities), auto-calculated markup, and instant PDF quote export.

### 3. 🗺️ Tour Packages & Custom Package Builder
- **Pre-Built Packages Ingested**: Haridwar, Jim Corbett, Nainital, Mussoorie, Chardham Yatra, Mukteshwar, Golden Triangle, Phuket, Krabi, Pattaya, Vietnam, and Nepal.
- **Custom Package Builder**: Create tailor-made packages with day-by-day itineraries, custom inclusions/exclusions, pricing tiers, and instant lead quotation.

### 4. 📅 Tour Departures Calendar & Accommodation Vouchers (Phase 5)
- **Live Departure Tracking**: Filter confirmed guest departures and check-in logistics by month.
- **Accommodation Voucher PDF Generation**: Generates official hotel vouchers with hotel details, room categories, meal plans (MAP), guest IDs, and Shanvi 24/7 emergency support (`+91 9999885087`).
- **Voucher WhatsApp Dispatch**: Dispatch hotel vouchers directly to guests via WhatsApp.

### 5. 👥 HRMS & Employee Payroll Management
- **Staff Directory**: Track employee designations, departments, contact info, sales commission rates, and status (`ACTIVE`, `ON_LEAVE`, `RESIGNED`).
- **Compensation Breakdown**: Track Base Salary, Allowances/HRA, Statutory Deductions, and Net Take-Home Pay.
- **Bank Remittance Credentials**: Store Bank Name, Account Number, IFSC Code, and PAN for HDFC, SBI, ICICI, PNB.
- **Disbursement Ledger**: Record monthly salary payments with payment modes (`NEFT`, `IMPS`, `UPI`, `CHEQUE`, `CASH`) and transaction UTR references.

### 6. 🏢 Company Hub & Interactive Office Map
- **Corporate Credentials**: Official GSTIN (`09AEKFS1932F1ZX`) and HDFC Bank remittance details.
- **Interactive OpenStreetMap**: Visual map centered on Sector 18 Noida (`28.5708° N, 77.3271° E`) with 1-click GPS copy and transit cards (Noida Sector 18 Metro Station Blue Line, IGI Airport, New Delhi Railway Station).

### 7. 🛡️ Enterprise Security Hardening (Phase 6)
- **RBAC Audit**: Role checks server-enforced on every route (`admin`, `staff_agent`, `accounts`).
- **Sliding-Window Rate Limiting**: In-memory rate limiting on authentication and WhatsApp routes.
- **HTTP Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Cross-Tenant Data Isolation**: Strict tenant scoping on all database queries.

---

## 🚀 Cloud Deployment Guides

### Option A: Vercel Deployment (Recommended for Next.js)

Vercel provides native, zero-configuration hosting for Next.js 15. The repository includes [`vercel.json`](./vercel.json) and `"postinstall": "prisma generate"`.

#### 1. Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." → "Project"**.
2. Select **GitHub** and choose `princeyadaviiit/shanvihospitalityCRM`.
3. Vercel automatically detects Next.js framework settings.

#### 2. Configure Environment Variables
Under **Environment Variables**, add:
| Variable | Value / Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | `https://xyzcompany.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Public Key | `eyJhbGciOi...` |
| `DATABASE_URL` | Supabase Transaction Pooler URL (port 6543) | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Supabase Direct DB URL (port 5432) | `postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel production domain | `https://your-crm.vercel.app` |
| `NODE_ENV` | Environment mode | `production` |

> [!TIP]
> **Serverless Connection Pooling**: For Vercel serverless functions, use the Supabase **Connection Pooler URL** (port 6543 with `?pgbouncer=true`) for `DATABASE_URL` to avoid exhausting database connections.

#### 3. Click "Deploy"
Vercel will install dependencies, automatically execute `prisma generate` via `postinstall`, run `next build`, and deploy globally with edge caching.

---

### Option B: Netlify Deployment

The repository includes a pre-configured [`netlify.toml`](./netlify.toml) designed specifically for Next.js 15 App Router and Prisma.

#### Step 1: Import Project into Netlify
1. Go to your [Netlify Dashboard](https://app.netlify.com/).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Choose **GitHub** and select the repository: `princeyadaviiit/shanvihospitalityCRM`.

#### Step 2: Build Configuration
Netlify will automatically detect [`netlify.toml`](./netlify.toml) settings:
- **Build command:** `prisma generate && npm run build`
- **Node version:** `20`

#### Step 3: Configure Environment Variables in Netlify
Go to **Site configuration → Environment variables** in Netlify, and add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV` = `production`

#### Step 4: Execute Database SQL in Supabase
Ensure all database tables are created in your Supabase project:
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Copy and run the contents of [`prisma/supabase_schema.sql`](./prisma/supabase_schema.sql).

#### Step 5: Deploy
Click **"Deploy site"**. Netlify will run the build, generate Prisma client bindings, and publish the application.

---

## 💻 Local Development

### 1. Prerequisites
- **Node.js**: `20.x` or later
- **npm**: `10.x` or later

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/princeyadaviiit/shanvihospitalityCRM.git
cd shanvihospitalityCRM

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Generate Prisma Client bindings
npx prisma generate

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Verification

The CRM includes automated test suites covering all implementation phases:

```bash
# Run all automated test suites (63 tests)
npm run test:all

# Run specific phase test suites
npm run test:phase1    # RBAC, Leads, Notes, Tenant Isolation (16 tests)
npm run test:phase2    # Itinerary Builder, Markup, PDF Export (18 tests)
npm run test:phase5    # Calendar, Sales Report, Voucher PDF, WhatsApp (14 tests)
npm run test:phase6    # RBAC Audit, Rate Limiting, Security Headers (15 tests)

# TypeScript type check
npx tsc --noEmit

# ESLint check
npm run lint

# Production build verification
npm run build
```

---

## 📁 Repository Architecture

```
CRM/
├── app/
│   ├── (auth)/              # Login & Signup pages
│   ├── api/
│   │   ├── auth/            # Rate-limited auth endpoints
│   │   ├── bookings/        # Invoices, vouchers, ledger mutations
│   │   ├── calendar/        # Tour departures calendar
│   │   ├── employees/       # HRMS staff directory
│   │   ├── itineraries/     # Itinerary builder & PDF generator
│   │   ├── leads/           # Pipeline & manual notes
│   │   ├── packages/        # Custom package builder
│   │   ├── payroll/         # Salary disbursement ledger
│   │   ├── reports/sales/   # Executive sales & conversion metrics
│   │   ├── staff/           # Admin staff management
│   │   └── whatsapp/send/   # Branded WhatsApp delivery
│   └── dashboard/           # Main CRM operational shell
├── components/
│   ├── calendar/            # Tour departures calendar UI
│   ├── company/             # Office location map & HDFC remittance
│   ├── dashboard/           # Executive KPI overview & sales report modal
│   ├── employees/           # HRMS employee directory & salary modal
│   ├── itinerary/           # Itinerary builder modal
│   ├── packages/            # Packages catalog & custom builder modal
│   └── pipeline/            # Kanban board, lead modal, detail drawer
├── content/                 # Official Shanvi tour packages & brand guides
├── docs/                    # PRD, TRD, architecture, security, memory logs
├── lib/
│   ├── auth/session.ts      # Multi-tenant RBAC enforcement helper
│   ├── mock-db.ts           # In-memory database with Shanvi fixtures
│   ├── packages-data.ts     # Tour packages catalog & office coordinates
│   └── rate-limit.ts        # Sliding-window rate limiter
├── prisma/
│   ├── schema.prisma        # Prisma relational schema
│   └── supabase_schema.sql  # Complete PostgreSQL DDL for Supabase
├── netlify.toml             # Netlify deployment configuration
└── middleware.ts            # Security headers & session route protection
```

---

## 📱 Android Mobile Application (Capacitor)

The CRM is bundled as an Android mobile app using **Capacitor**, complete with:
- **Native Safe-Area Margins (`pt-safe`, `pb-safe`)**: Prevents UI clipping behind camera notches, status bars, and home gesture pill.
- **Custom CRM App Icon & Splash Screen**: Generated luxury gold/amber and dark obsidian emblem across all Android screen densities (`mdpi`, `hdpi`, `xhdpi`, `xxhdpi`, `xxxhdpi`).
- **Dark Status Bar Integration**: Seamless `#020617` background integration matching native Android themes.

### How to Run on Android

1. **Sync Assets to Android Project**:
   ```bash
   npm run cap:sync
   ```

2. **Open in Android Studio**:
   ```bash
   npm run cap:open
   ```
   *(Or open the `android/` directory in Android Studio).*

3. **Run on Device or Emulator**:
   - In Android Studio, connect your Android device (with USB Debugging enabled) or start an emulator.
   - Click the green **"Run"** button (`Shift + F10`) to build and launch the APK.

4. **Connecting to Production or Local Server**:
   - In [`capacitor.config.ts`](./capacitor.config.ts), set `server.url` to your live Vercel/Netlify URL (e.g. `https://your-crm.vercel.app`) or your local Wi-Fi IP (e.g. `http://192.168.1.X:3000`) for development.

---

## 🏢 Company Information

- **Company**: Shanvi Hospitality
- **Corporate Office**: Sector 18, Noida, Uttar Pradesh 201301
- **GSTIN**: `09AEKFS1932F1ZX`
- **24/7 Helpline**: `+91 9999885087`
- **Email**: `info@shanvihospitality.in`
