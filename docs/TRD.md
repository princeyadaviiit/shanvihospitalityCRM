# Technical Requirements Document (TRD)
## Travel CRM Platform

**Document version:** 2.0
**Companion documents:** PRD.md, architecture.md, security.md, auth.md, phases.md

---

## 1. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (React), App Router | Server components for performance; built-in PWA support via a plugin |
| Styling | Tailwind CSS | Fast to build responsive, mobile-first UI |
| Backend | Node.js via Next.js API routes (splitting to a dedicated Nest/Express service is an option once the API surface grows) | Keeps the stack to a single language, which matters for a lean build team and for Claude Code's ability to reason across the codebase |
| Database & Backend Platform | **Supabase** (managed PostgreSQL + Auth + Storage + Realtime + Edge Functions) | Replaces a bare-metal/self-managed PostgreSQL instance. Gives relational integrity for ledgers and multi-tenant data, plus built-in Row Level Security (RLS), authentication, and object storage under one platform |
| ORM | Prisma, pointed at the Supabase Postgres connection string | Type-safe schema and migrations; used for all application-level queries. Supabase's own client SDK is used only where its specific features (RLS-aware queries, Realtime subscriptions, Storage) are needed |
| Auth | **Supabase Auth** | Handles credential storage, password hashing, session/JWT issuance, and refresh tokens out of the box. Email/password at v1, with OTP and SSO available as a config change later. Full design in `auth.md` |
| File storage | **Supabase Storage** | PDFs (invoices, vouchers, itineraries) and call recordings, held in access-controlled buckets with signed URLs. An S3-compatible provider (e.g. Cloudflare R2) remains a valid fallback if storage needs outgrow what Supabase Storage offers, without a schema change |
| PDF generation | Puppeteer or React-PDF | GST invoices, vouchers, itinerary exports |
| Background jobs | BullMQ + Redis (managed Redis, e.g. Upstash) | Supabase does not provide a job queue, so this layer is retained independently for payment reminders, follow-up alerts, and async WhatsApp/email sends |
| Hosting | Vercel (frontend + API) + Supabase (database/auth/storage) | Fast deploy loop, suited to iterative, phase-by-phase development |
| PWA | next-pwa or Workbox | Manifest, service worker, offline app shell |

---

## 2. Third-Party Integrations (API keys required)

| Integration | Purpose | Suggested providers | Phase needed |
|---|---|---|---|
| Payment gateway | Client payments, deposits | Razorpay, Stripe, PayU, Cashfree | Phase 3 (sandbox first) |
| Telephony | Click-to-call, call recording | Twilio, Exotel, Knowlarity | Phase 4 |
| WhatsApp | Send quotes, invoices, vouchers | Meta Cloud API, Gupshup, Interakt | Phase 3 |
| Email | Send quotes, invoices | SendGrid, Resend, AWS SES | Phase 2 |
| Maps (optional) | Itinerary location data | Google Maps API | Phase 5 (optional) |
| Ads lead capture (optional) | Auto-import leads | Google Ads API, Meta Lead Ads API | Phase 5 (optional) |

Every integration is built against sandbox/test credentials first. Live keys are swapped in only after end-to-end testing, and — for the payment gateway specifically — only after business KYC is complete. This is not a suggestion; see `security.md` §7 and `phases.md` Phase 6.

---

## 3. Data Model (High-Level Entities)

- `Company` — the tenant
- `User` — role: `admin` / `staff_agent` / `accounts`; linked to a Supabase Auth user via its UID, and belongs to a `Company`
- `Lead` — status, source, assigned agent, traveller info; belongs to a `Company`
- `Itinerary` — linked to a `Lead`; has many `ItineraryDay` → `ItineraryLineItem`
- `Booking` — created from a confirmed Itinerary/Lead; carries a payment ledger
- `LedgerEntry` — `booking_id`, type (deposit / payment / supplier_cost), currency, amount, recorded_by
- `Invoice` / `Voucher` — generated documents, linked to a `Booking`
- `Call` — `lead_id`, `agent_id`, duration, `recording_url`, timestamp
- `Target` — `agent_id`, month, revenue target, booking target
- `AuditLog` — actor, action, entity, before/after state, timestamp

The full schema is defined in the Prisma schema file during Phase 1. Every tenant-scoped table carries a `company_id` foreign key — see `architecture.md` §3 for how this is enforced at both the application layer and the Supabase RLS layer.

---

## 4. API Design Principles

- RESTful JSON API. (tRPC is an acceptable alternative if the build stays a single-language monorepo — the build agent may choose based on what fits the Next.js setup best, and should log that decision in `memory.md`.)
- Every endpoint is scoped by `company_id`, taken from the authenticated session — never from a client-supplied parameter. There is no code path that can leak data across tenants.
- Tenant isolation is enforced twice, independently: once in a shared application-level query helper (so no individual endpoint author can forget it), and again at the database layer through Supabase Row Level Security policies on every tenant-scoped table. Neither layer is allowed to be the sole safeguard.
- All financial write endpoints require the Accounts or Admin role and are logged to `AuditLog`.
- Webhook handlers (payment gateway, WhatsApp delivery status) are idempotent — a redelivered webhook must never double-apply a ledger entry or a status change.

---

## 5. Security Requirements

Full detail lives in `security.md`. In summary, at the technical level:

- HTTPS everywhere, no exceptions.
- RBAC enforced server-side on every endpoint, never left as a UI-only restriction.
- Secrets and API keys live in environment variables / a secret manager, and are never committed to the repository.
- No raw card data is stored — payment collection goes through the gateway's hosted checkout or tokenized flow only.
- Rate limiting on all authentication endpoints.
- Regular dependency vulnerability checks as part of the phase-end Test & Fix Loop.

---

## 6. Deployment & Environments

| Environment | Database/Auth/Storage | API keys |
|---|---|---|
| `dev` | Local development against a dedicated Supabase project (or local Supabase CLI stack) | Sandbox/test keys |
| `staging` | Dedicated Supabase project, used for UAT before each phase sign-off | Sandbox/test keys |
| `production` | Dedicated Supabase project | Live keys — payment gateway keys activated only after KYC/verification is complete |

Keeping a separate Supabase project per environment (rather than one project with environment flags inside it) avoids any possibility of dev/staging activity touching production data, and keeps RLS policy testing honest.

---

## 7. Future-Proofing for Native Apps

- All business logic stays in the API layer, never embedded directly in frontend components, so a future React Native or Capacitor-wrapped client can reuse the same backend without duplication.
- Browser-only APIs are avoided in core business logic for the same reason.
