# System Architecture Document
## Travel CRM Platform

**Document version:** 2.0
**Companion documents:** PRD.md, TRD.md, security.md, auth.md

---

## 1. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │        Client (Browser)      │
                        │  Desktop / Laptop / Mobile   │
                        │   Next.js PWA (installable)  │
                        └───────────────┬──────────────┘
                                        │ HTTPS
                        ┌───────────────▼──────────────┐
                        │        Next.js App Layer      │
                        │  - Server Components (UI)     │
                        │  - API Routes (business logic)│
                        │  - Session handling + RBAC    │
                        └───────────────┬──────────────┘
                                        │
        ┌───────────────┬───────────────┼───────────────┬────────────────┐
        │               │               │               │                │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌───────▼──────┐ ┌──────▼───────┐
│   Supabase    │ │ Redis Queue │ │  Supabase    │ │ Payment GW    │ │ Telephony /  │
│  Postgres +   │ │ (BullMQ)    │ │  Storage     │ │ (Razorpay/   │ │ WhatsApp /   │
│  Auth + RLS   │ │ Reminders,  │ │  PDFs, call  │ │  Stripe etc.)│ │ Email APIs   │
│  Multi-tenant │ │ async jobs  │ │  recordings  │ │               │ │              │
│  core data    │ │             │ │              │ │               │ │              │
└───────────────┘ └─────────────┘ └──────────────┘ └───────────────┘ └──────────────┘
```

---

## 2. Layer Breakdown

### 2.1 Client Layer
- Next.js frontend, responsive, with a PWA manifest and service worker.
- Role-aware UI: Admin, Staff Agent, and Accounts see different dashboards, but all three share one codebase and one route structure, gated by permission checks — there is no separate frontend per role.
- Installed as a PWA on a phone or laptop home screen at v1; wrapped later (Trusted Web Activity / Capacitor) for the app stores without any architectural change.

### 2.2 Application Layer
- Next.js API routes (or a dedicated Node service if split out later) handle:
  - Authentication handoff and session management (via Supabase Auth)
  - Lead/pipeline CRUD and status transitions
  - Itinerary/quote calculation logic
  - Ledger mutations, with audit logging on every write
  - Webhook receivers (payment gateway, WhatsApp delivery status)
  - Report aggregation queries

### 2.3 Data Layer
- **Supabase** (managed PostgreSQL) is the single source of truth, multi-tenant via a `company_id` scope on every core table.
- Prisma ORM handles schema management and type-safe application queries against the Supabase Postgres connection.
- Tenant isolation is enforced in two independent places: a shared application-level query helper (so no individual endpoint can forget the `company_id` filter), and Supabase **Row Level Security (RLS)** policies on every tenant-scoped table, so that even a query that bypassed the application layer could not cross tenants. See §3.
- Redis-backed job queue (BullMQ) handles anything async or delayed: payment reminders, scheduled follow-ups, WhatsApp/email sends, and recording processing. This sits alongside Supabase rather than inside it, since Supabase does not provide a job queue.

### 2.4 Integration Layer
- Payment gateway: hosted checkout / tokenized flow, with ledger updates driven entirely by webhooks.
- Telephony: click-to-call initiates via the provider's API; the provider posts call events back via webhook.
- WhatsApp/Email: outbound sends go through the provider's API; delivery status is tracked via webhook where the provider supports it.
- Every third-party call is isolated behind an internal service module (`services/payments/`, `services/telephony/`, and so on), so a provider can be swapped later with minimal blast radius to the rest of the codebase.

### 2.5 Storage Layer
- **Supabase Storage** holds generated PDFs (invoices, vouchers, itineraries) and call recordings, in access-controlled buckets.
- Signed, time-limited URLs are used for any access to a sensitive file — nothing sensitive is ever served from a public bucket or a permanent link.

---

## 3. Multi-Tenancy Model

- Single Supabase project per environment, shared schema, with a `company_id` foreign key on every tenant-scoped table. This is simpler to operate at this scale than provisioning a separate database per tenant, and it's the model both the PRD and TRD assume.
- Every API query filters by the authenticated user's `company_id`, enforced in a shared query middleware/helper — this is never left to individual endpoint authors to remember correctly on their own.
- Supabase RLS policies mirror that same `company_id` scoping directly on the tables, so tenant isolation does not depend solely on application code being correct. Both layers are tested independently as part of the Phase 3+ security checks (see `security.md` §4).

---

## 4. Role-Based Access Control (RBAC)

- Three roles at v1: `admin`, `staff_agent`, `accounts`.
- Enforced at the API middleware level — each endpoint declares the role(s) required to call it.
- The UI hides actions a role can't perform, purely as a usability convenience. The server is the actual gatekeeper in every case; hiding a button in the UI is never treated as a substitute for a server-side check.
- The complete role/permission matrix, endpoint by endpoint, lives in `auth.md`.

---

## 5. Deployment Topology

- **Frontend + API:** Vercel, auto-deployed from the main branch per environment.
- **Database, Auth, Storage:** a dedicated Supabase project per environment (dev / staging / production), each with automated backups.
- **Redis:** a managed instance (Upstash or similar) for the background job queue.
- **Environments:** dev → staging (sandbox keys) → production (live keys, gated behind KYC completion for the payment gateway).

---

## 6. Scalability Considerations
*(Not urgent at v1, but the design should not preclude these later.)*

- The API layer is stateless and can scale horizontally behind a load balancer if needed.
- Background jobs are decoupled via the queue, so slow operations (PDF generation, WhatsApp sends) never block a user-facing request.
- Database indexes are planned on `company_id`, `lead.status`, and `booking.date` from schema design time, so pipeline and calendar queries stay fast as data volume grows.

---

## 7. Why This Architecture Fits the Project's Constraints

- A single primary language (TypeScript) across frontend and backend keeps the codebase easy for a build agent to reason about consistently, and easy for a small team to maintain.
- An API-first design means a future native app — if the product is later wrapped for the Play Store or App Store — reuses the same backend with zero duplication.
- Managed services (Vercel, Supabase, managed Redis) minimize infrastructure overhead, so build effort stays focused on product features rather than operations.
