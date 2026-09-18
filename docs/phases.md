# Implementation Phases
## Travel CRM Platform — Phase-by-Phase Build Plan

**Document version:** 2.0
**Companion documents:** PRD.md, TRD.md, architecture.md, security.md, auth.md, rules.md

---

## Instructions for the Build Agent

1. Read `memory.md` in full, every session, before doing anything else. If it doesn't exist yet, create it using the template in `rules.md` §8.
2. Work strictly phase by phase, in the order below. Do not start a phase until the previous phase's acceptance criteria are fully met and its Test & Fix Loop has passed.
3. Own both the code and the documentation for every phase — write and update README/docs as you build, not afterward.
4. Run the Test & Fix Loop below at the end of every phase, before marking it done.
5. Update `memory.md` after every completed task and every completed phase, following the log format in `rules.md` §8.
6. If blocked or something is ambiguous, log it in `memory.md` under Decisions Log or Active Blockers and make a reasonable, conservative judgment call rather than stalling — note the assumption clearly. See `rules.md` §6 for how to handle this.

---

## Test & Fix Loop
*(Run at the end of every phase, before moving on.)*

1. **Functional check** — manually verify every acceptance criterion listed for the phase actually works, not just that the code compiles.
2. **Security check** (scaled to what's in that phase — see `security.md` §14 for the full per-phase table):
   - Auth/session handling correctly implemented via Supabase Auth (if touched this phase)
   - Role-based access enforced server-side, not just hidden in the UI (if touched this phase)
   - No secrets/API keys hardcoded or committed
   - Input validation on all new endpoints (basic injection/XSS sanity)
   - No raw payment data touching the server (Phase 3 onward)
3. **Bug fixing** — if anything fails the checks above, fix it immediately. Do not move to the next phase with known-broken or known-insecure functionality. Log what was found and fixed in `memory.md`.
4. **Regression sanity check** — quickly re-verify the previous phase's core flows still work; confirm this phase's changes haven't broken them.
5. Only after all of the above pass: mark the phase `DONE` in `memory.md` and summarize what was built, what was tested, and what (if anything) needs a decision, credential, or input before the next phase can start.

---

## Phase 0 — Project Setup (Basic Skeleton)
**Goal:** A bare-bones working skeleton. No business features yet — just infrastructure that works.

- Initialize Next.js (TypeScript) + Tailwind CSS.
- Create a Supabase project for the dev environment; connect Prisma to it and define the initial schema for `Company` and `User` only.
- Basic auth via Supabase Auth: sign-up, login, logout, session handling (see `auth.md`).
- PWA setup: manifest.json, service worker, icons (placeholder branding is fine at this stage).
- Environment configuration for dev/staging/production, using placeholders for any keys not yet obtained.
- `README.md`: how to install, run locally, and what's implemented so far.

**Acceptance:** A user can sign up a company, log in, and log out. The app installs as a PWA. It runs locally without errors.

---

## Phase 1 — Basic Core CRM (Leads Only, No Extras)
**Goal:** The simplest possible working lead pipeline. Deliberately basic — no calling, no payments, no fancy reports yet.

- RBAC structure: `admin`, `staff_agent`, `accounts` roles, with permissions enforced from this phase onward per `auth.md`.
- Admin can create and deactivate staff accounts.
- `Lead` model: name, contact, destination, pax count, status (Enquiry / In Progress / Confirmed / Missed).
- Basic Kanban board with drag-and-drop status changes.
- Lead detail page with manual notes (no automation yet).
- Basic search/filter by status and agent.
- Supabase RLS policies applied to `Lead` and `User` tables, matching the application-level `company_id` scoping.

**Acceptance:** Admin creates staff; any role logs in and sees the correct dashboard shell; a lead can be created and dragged across pipeline stages; RBAC explicitly blocks a Staff Agent from admin-only actions, and cross-tenant access is explicitly tested and blocked.

---

## Phase 2 — Itinerary & Quote Builder (Basic)
**Goal:** Build and export a simple quote — no WhatsApp/email sending automation yet, just PDF export.

- Itinerary model: days → line items (accommodation, transport, activity, meals).
- Simple auto cost total (a flat markup field is sufficient for v1 — no complex margin logic yet).
- PDF export of the itinerary.
- Convert itinerary → Booking (a basic status flag at this stage, not the full ledger).

**Acceptance:** An agent builds a multi-day itinerary, sees a total cost, exports it as a PDF, and converts it to a Booking.

---

## Phase 3 — Payments & Ledger (Basic, Sandbox Only)
**Goal:** Money tracking works in sandbox mode. This is where real security discipline starts to matter — see `security.md` §5 in full before starting this phase.

- Ledger model: deposits, payments, supplier cost, multi-currency (INR/USD).
- Payment gateway integration in **sandbox/test mode only** (Razorpay or Stripe test keys).
- Manual payment entry (Accounts role).
- Basic invoice PDF (GST fields present; doesn't need to be pixel-perfect yet).

**Acceptance:** A booking can receive a test payment via the sandbox gateway; the ledger updates correctly; a basic invoice PDF can be generated. The security check must confirm: no raw card data ever touches the server, and only Accounts/Admin roles can write ledger entries — and every ledger write produces a matching `AuditLog` entry.

---

## Phase 4 — Click-to-Call & Basic Leaderboard
**Goal:** Calling and performance tracking, basic version.

- Telephony integration (sandbox/test credentials — a Twilio trial account is sufficient for this).
- Click-to-call from the lead detail screen, auto-logging call metadata (duration, timestamp).
- `Target` model — Admin sets a basic monthly target per agent.
- Simple leaderboard: bookings vs. target, call count.

**Acceptance:** An agent can trigger a test call and see it logged to the lead's timeline; Admin sees a leaderboard populated with real test data.

---

## Phase 5 — Calendar, Reports & WhatsApp Delivery
**Goal:** Round out the basic feature set — this is where "basic build" becomes "usable build."

- Tour calendar view (confirmed bookings by date).
- Basic sales report (leads, conversions, revenue) — a screen view is sufficient at this stage; export is optional here.
- WhatsApp sandbox integration for sending quotes/invoices.
- Accommodation voucher PDF generation.
- Company profile settings (logo, GST number, default currency) applied to generated documents.

**Acceptance:** The calendar reflects real booking data; a quote/invoice can be sent via the WhatsApp sandbox; company branding shows up correctly on generated PDFs.

---

## Phase 6 — Hardening & Production Readiness
**Goal:** Take the basic-but-complete build and make it genuinely production-safe.

- Full security pass across every phase: RBAC audit, rate limiting on auth endpoints, secrets management review, dependency vulnerability check — see `security.md` §14 for the complete checklist.
- Swap sandbox keys for live keys — the payment gateway's live keys are activated only after business KYC is complete.
- Performance sanity check under realistic data volume (hundreds of leads/bookings).
- Backup/restore verification for the Supabase database.
- Full regression test across every phase's acceptance criteria, end to end.
- Final PWA install test on an actual Android device and an actual iOS device.

**Acceptance:** The system is live-ready; every phase's features still work together; there are no known security gaps; backups are verified.

---

## Phase 7 (Optional, Post-Launch) — App Store / Play Store Wrapping
**Goal:** Native distribution, only after Phase 6 is stable in production.

- Android: wrap the PWA via a Trusted Web Activity (Bubblewrap or PWABuilder), publish to the Play Store.
- iOS: wrap the PWA via Capacitor or PWABuilder, add whatever native polish App Store review requires, publish to the App Store.

**Acceptance:** The app is installable from both stores and functionally equivalent to the PWA.

---

## Notes for the Build Agent

- "Basic" in Phases 0–5 means functionally correct and secure, but not visually polished and not feature-complete on every edge case. Polish and edge cases are swept up in Phase 6 — they are not skipped forever.
- Never skip the Test & Fix Loop to save time. An unfixed bug or security gap compounds in later phases and gets more expensive to find the longer it's left.
- Refer to `PRD.md`, `TRD.md`, `architecture.md`, `security.md`, and `auth.md` for full feature and technical context before implementing anything that isn't fully spelled out here.
