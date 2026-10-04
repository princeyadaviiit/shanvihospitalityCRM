# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Shanvi Hospitality CRM** — an enterprise-grade B2B/B2C Destination Management & Travel CRM platform built with Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase, and Prisma. The platform handles lead pipeline management, custom tour itineraries, instant quotations, tour departures, HRMS/payroll, and includes an Android mobile app via Capacitor.

## Development Commands

### Local Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# TypeScript type checking
npx tsc --noEmit

# Linting
npm run lint

# Generate Prisma client after schema changes
npx prisma generate
```

### Testing
The project uses phase-based test organization. Always run relevant test suites after making changes:
```bash
# Run all test suites (63 tests across all phases)
npm run test:all

# Run specific phase tests
npm run test:phase1    # RBAC, Leads, Notes, Tenant Isolation (16 tests)
npm run test:phase2    # Itinerary Builder, Markup, PDF Export (18 tests)
npm run test:phase5    # Calendar, Sales Report, Voucher PDF, WhatsApp (14 tests)
npm run test:phase6    # RBAC Audit, Rate Limiting, Security Headers (15 tests)
```

### Android/Capacitor Workflows
```bash
# Sync web assets to Android project (run after build changes)
npm run cap:sync

# Open Android project in Android Studio
npm run cap:open

# Build production release (requires keystore)
cd android && ./gradlew assembleRelease
```

## Architecture & Key Patterns

### Multi-Tenant Architecture
**Critical**: This is a multi-tenant system. Every tenant-scoped database query MUST filter by `companyId`:

```typescript
// Always scope queries to the authenticated user's company
const leads = await prisma.lead.findMany({
  where: { companyId: authContext.companyId },
});
```

Tenant isolation is enforced at two layers:
1. **Application layer**: Use `authenticateRequest()` from `lib/auth/session.ts` in all API routes
2. **Database layer**: Supabase RLS policies on all tenant-scoped tables (see `prisma/supabase_schema.sql`)

### Authentication & RBAC Pattern
All API routes must use the `authenticateRequest()` helper from `lib/auth/session.ts`:

```typescript
import { authenticateRequest } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request, ['admin', 'staff_agent']);
  if (!authResult.success) return authResult.response;
  
  const { companyId, user, role } = authResult.context;
  // ... rest of handler with guaranteed authentication and tenant scope
}
```

Three roles exist: `admin`, `staff_agent`, `accounts`. Always pass the specific roles allowed for each endpoint.

### API Route Conventions
- **Location**: All API routes live in `app/api/`
- **Auth**: Every route must call `authenticateRequest()` first (except public auth routes)
- **Tenant scoping**: All queries must filter by `companyId` from auth context
- **Error responses**: Return `NextResponse.json({ error: '...' }, { status: code })`
- **Rate limiting**: Auth and WhatsApp routes use `lib/rate-limit.ts` sliding-window limiter

### Database Access Pattern
Always use Prisma client from `lib/prisma.ts`:

```typescript
import { prisma } from '@/lib/prisma';

// The Prisma client is a singleton with proper connection pooling
// configured for Supabase serverless environment
```

### Security Headers
The `middleware.ts` applies security headers to all routes:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(self), geolocation=()`

These headers are already configured—don't duplicate them in individual routes.

### PDF Generation Pattern
PDFs use `pdfkit` library. Examples in:
- `app/api/itineraries/[id]/export/route.ts` (tour quotes)
- `app/api/bookings/[id]/voucher/route.ts` (hotel vouchers)
- `app/api/bookings/[id]/invoice/route.ts` (invoices)

PDFs are generated as buffers and returned with proper headers:
```typescript
return new NextResponse(pdfBuffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}.pdf"`,
  },
});
```

### WhatsApp Integration
WhatsApp messages use `wa.me` deep links or Twilio sandbox. The route at `app/api/whatsapp/send/route.ts` handles branded message composition with rate limiting.

## Project-Specific Conventions

### Component Organization
- `components/dashboard/` - Executive KPI widgets, sales reports
- `components/pipeline/` - Kanban board, lead management
- `components/itinerary/` - Multi-day itinerary builder modal
- `components/calendar/` - Tour departures calendar
- `components/employees/` - HRMS directory and payroll views (admin-only)
- `components/packages/` - Tour packages catalog

### Admin-Only Sections
The **Employees & Payroll** section is restricted to users with the `admin` role only:
- API routes: `/api/employees`, `/api/employees/[id]`, `/api/payroll` all enforce `admin` role
- UI: Navigation tabs are hidden for non-admin users
- Non-admins attempting direct access receive 403 Forbidden
- No salary, compensation, or payroll data is exposed through any other endpoint accessible to non-admins

### Mock Data
`lib/mock-db.ts` provides in-memory fixtures for development. This is separate from the real Prisma database and is used for rapid prototyping before persisting to Supabase.

### Package Data
`lib/packages-data.ts` contains official Shanvi tour packages (Haridwar, Jim Corbett, Nainital, etc.) and company coordinates. This is the source of truth for pre-built packages.

## Mobile/Capacitor Notes

The project includes an Android app built with Capacitor:
- **Config**: `capacitor.config.json` (not .ts—TypeScript config excluded from build)
- **Safe areas**: Use Tailwind classes `pt-safe` and `pb-safe` for notch/gesture pill compatibility
- **Sync workflow**: After web build changes, run `npm run cap:sync` before opening in Android Studio
- **Status bar**: Configured for dark theme integration (`#020617` background)

## Environment Variables

Required environment variables (see `.env.example`):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon public key
- `DATABASE_URL` - Supabase connection pooler URL (port 6543) for serverless
- `DIRECT_URL` - Supabase direct connection (port 5432) for migrations
- `NEXT_PUBLIC_APP_URL` - Application URL (for redirects/webhooks)

## Documentation

Comprehensive documentation exists in `docs/`:
- `PRD.md` - Product requirements
- `TRD.md` - Technical requirements
- `architecture.md` - Detailed system architecture (multi-tenant, data flow)
- `auth.md` - Authentication and RBAC specification
- `security.md` - Security hardening measures
- `phases.md` - Implementation phase breakdown

**When making architectural changes**, consult these docs first to understand existing design decisions.

## Company Context

This CRM is purpose-built for **Shanvi Hospitality** (Sector 18, Noida):
- **GSTIN**: `09AEKFS1932F1ZX`
- **Primary destinations**: Haridwar, Jim Corbett, Nainital, Mussoorie, Chardham, International (Phuket, Vietnam, Nepal)
- **Business model**: B2B (travel agents) and B2C (direct customers)
- **24/7 Support**: `+91 9999885087`

Keep this context in mind when working on features—this isn't a generic CRM template.
