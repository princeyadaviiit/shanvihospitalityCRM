# Project Memory

## Project State
Phase 2 (Itinerary & Quote Builder) is functionally complete and fully verified via automated tests. All three phases (0, 1, 2) build with zero errors. Itinerary builder, auto-costing, PDF export, booking conversion, RBAC enforcement, and cross-tenant isolation are implemented and passing 18 automated tests. The project is ready for Phase 3 (Payments & Ledger — Sandbox Only).

## Phase Log
### Phase 0 — COMPLETE (2026-09-18)

**What was built:**
- Next.js 15 project initialized with TypeScript and Tailwind CSS
- Prisma schema defined for Company and User tables with proper multi-tenant structure
- Supabase Auth integration with httpOnly cookie session handling
- Sign-up API route creates company and admin user in one transaction
- Login/logout API routes with proper session management
- Middleware for protected routes (dashboard requires auth, redirects unauthenticated users)
- PWA manifest.json with app metadata and icons
- Service worker for offline caching
- Environment configuration with .env.example template
- README.md documentation with installation and usage instructions

**What was tested:**
- TypeScript compilation: ✅ Passes
- Build process: ✅ Succeeds with no errors
- Code structure: ✅ Follows specifications (business logic in API layer, RBAC enforcement pattern ready)
- Security check (partial):
  - ✅ No secrets committed to repository
  - ✅ Environment variables properly configured
  - ✅ Session tokens use httpOnly cookies (not localStorage)
  - ✅ Input validation with Zod on all API endpoints
  - ✅ Auth/session handling via Supabase Auth (no custom password hashing)
  - ⚠️ PostCSS dev dependency vulnerabilities noted (dev-time only, acceptable for Phase 0)

### Phase 1 — COMPLETE (2026-09-18)

**What was built:**
- Extended Prisma schema with `Lead`, `LeadNote` models and `LeadStatus` enum (`ENQUIRY`, `IN_PROGRESS`, `CONFIRMED`, `MISSED`)
- Supabase Row Level Security (RLS) policies SQL script (`prisma/rls_policies.sql`) for defense in depth
- Shared auth and RBAC enforcement helper (`lib/auth/session.ts`) adhering strictly to `auth.md` §6 sequence (session verification → user lookup → active check → role check → tenant scope)
- Staff management API routes (`GET, POST /api/staff`, `PATCH /api/staff/[id]`) with Admin-only access, tenant isolation, and self-deactivation prevention
- Lead pipeline API routes (`GET, POST /api/leads`, `GET, PATCH /api/leads/[id]`, `POST /api/leads/[id]/notes`) with Zod input validation, tenant isolation, and agent lead scoping
- Interactive Kanban board UI (`components/pipeline/KanbanBoard.tsx`) with HTML5 drag-and-drop, quick status change, search, and agent filter
- Lead creation modal (`components/pipeline/LeadModal.tsx`) with real-time validation
- Lead detail drawer (`components/pipeline/LeadDetailDrawer.tsx`) with stage controller and chronological communication/manual notes timeline
- Staff management UI (`components/staff/StaffManagement.tsx`) for Admin to create staff and toggle account deactivation
- Role-aware dashboard shell (`components/dashboard/DashboardShell.tsx`) with tailored views for Admin, Staff Agent, and Accounts
- In-memory database fallback (`lib/mock-db.ts`, `lib/prisma.ts`) for local test environments without requiring external cloud connection
- Automated Phase 1 test suite (`tests/phase1.test.ts`, `scripts/run-phase1-tests.ts`, `npm run test:phase1`) verifying 16 test cases across all acceptance criteria

**What was tested (Test & Fix Loop):**
- Functional checks: ✅ All 16 automated tests pass with 0 failures (`npm run test:phase1`)
- TypeScript & build: ✅ `npm run build` succeeds with zero errors and zero lint warnings
- RBAC enforcement: ✅ Server-side verified (Staff Agent / Accounts blocked from Admin actions with 403)
- Cross-tenant isolation: ✅ Verified (Company A blocked from Company B leads with 404/403)
- Account deactivation: ✅ Verified (Deactivated users immediately blocked with 401)
- Input validation: ✅ Verified (Zod validates payloads, rejects malformed input with 400)
- Lead lifecycle & notes: ✅ Verified (Creation, status transitions, manual notes)
- Security checklist: ✅ Verified per `security.md` §14 Phase 1 requirements

**What needs product owner input:**
- Live Supabase project credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`) to perform live cloud browser testing whenever desired. All core CRM logic, RBAC, tenant isolation, and UI are fully functioning and verified.

### Phase 2 — COMPLETE (2026-09-18)

**What was built:**
- Itinerary & Quote Builder API routes (`GET, POST /api/leads/[id]/itinerary`) with Zod validation, auto cost totaling (totalCost = sum of all line items), and flat markup producing `finalPrice`
- Automatic `lead.quotedPrice` sync on every itinerary save — lead always reflects the current quoted price
- PDF export API route (`GET /api/itineraries/[id]/export`) generating valid PDFs using PDFKit with company branding, traveller details, day-by-day schedule, and cost summary
- Booking conversion API route (`POST /api/itineraries/[id]/convert-booking`) creating a unique `BK-YYYY-XXXXX` booking number, locking the itinerary price, and transitioning the lead to `CONFIRMED`
- Itinerary & Quote Builder UI (`components/itinerary/ItineraryBuilderModal.tsx`) with multi-day drag-add/remove, category line items (Accommodation, Transport, Activity, Meals, Other), real-time costing panel, PDF export button, and "Convert to Booking" CTA
- Extended Prisma schema (`Itinerary`, `ItineraryDay`, `ItineraryLineItem`, `Booking`, `BookingStatus` enum) with correct multi-tenant and relational structure
- Mock-db extended with `lead.findUnique` and full itinerary/booking CRUD for test-mode operation
- Automated Phase 2 test suite (`tests/phase2.test.ts`, `scripts/run-phase2-tests.ts`, `npm run test:phase2`) verifying 18 test cases across all acceptance criteria

**What was tested (Test & Fix Loop):**
- Functional checks: ✅ All 18 automated tests pass with 0 failures (`npm run test:phase2`)
- TypeScript & build: ✅ `npm run build` succeeds with zero errors and zero lint warnings
- RBAC enforcement: ✅ Accounts role blocked from itinerary writes (403); Staff Agent 2 blocked from Agent 1's itinerary (403)
- Cross-tenant isolation: ✅ Company B cannot read or export Company A's itinerary (404)
- Auto-costing: ✅ totalCost and finalPrice computed correctly from line items + markup
- Lead sync: ✅ lead.quotedPrice updated atomically with itinerary save
- PDF export: ✅ Returns valid `application/pdf` stream starting with `%PDF-` header
- Booking conversion: ✅ Creates booking with `BK-` prefixed number, sets lead to CONFIRMED
- Input validation: ✅ Rejects 0-day itineraries (400) and negative markup (400)

**What needs product owner input:**
- Live Supabase project credentials for cloud deployment testing (same as Phase 1 blocker).

## Decisions Log
- **[2026-09-18]** Used Prisma 5.22.0 instead of 8.x RC: The 8.x release candidate has a completely different CLI structure that broke `prisma generate`. Downgraded to stable 5.22.0 for reliability.
- **[2026-09-18]** Used Zod 3.23.8 instead of 4.x: Zod 4.x has breaking changes (no `.errors` property). Pinned to stable 3.23.8 to avoid compatibility issues.
- **[2026-09-18]** Simplified PWA setup: Removed next-pwa plugin due to TypeScript compatibility issues with Next.js 15. Implemented basic service worker and manifest directly, which is sufficient for Phase 0 acceptance criteria (app can be installed as PWA).
- **[2026-09-18]** PostCSS vulnerabilities: npm audit reports dev dependency vulnerabilities in PostCSS (bundled with Next.js). These are build-time issues, not runtime security risks. Acceptable for Phase 0; will monitor for updates in later phases.
- **[2026-09-18]** Company creation on sign-up: First user to sign up creates a company and becomes admin role automatically, per auth.md §4. This is the only self-service path to admin role.
- **[2026-09-18]** Lead Pipeline Stages: Defaulted to the 4 stages defined in PRD.md §4.1: `ENQUIRY`, `IN_PROGRESS`, `CONFIRMED`, `MISSED`.
- **[2026-09-18]** In-Memory DB Mock for Testing: Added `lib/mock-db.ts` fallback in `lib/prisma.ts` when running in test mode or placeholder database URLs, enabling full adversarial RBAC and isolation testing without stalling on cloud credentials (per rules.md §6).
- **[2026-09-18]** Staff Agent Lead Scoping: Staff agents are restricted to viewing and modifying only leads where `assignedAgentId` equals their user ID. Unassigned leads or leads assigned to other agents are protected with 403 Forbidden.
- **[2026-09-18]** Flat Markup for Phase 2: Implemented a simple flat monetary markup field (not percentage) for itinerary pricing, as specified in phases.md. Percentage-based margin logic deferred to a later phase.
- **[2026-09-18]** PDF generation via PDFKit: Used PDFKit (already a project dependency) for itinerary PDF export. No React-PDF or Puppeteer was needed for Phase 2's scope. React-PDF remains an option for more complex invoice layouts in Phase 3.
- **[2026-09-18]** Booking number format: `BK-YYYY-XXXXX` (e.g., `BK-2026-N54YC`). Year prefix allows future sharding/reporting. 5-character random alphanumeric suffix provides sufficient uniqueness for the expected booking volume.

## Active Blockers
- **[2026-09-18]** Waiting on: Supabase live project credentials (URL, anon key, database URL) for cloud deployment testing. (Local automated verification passes 100% across all 3 phases).



