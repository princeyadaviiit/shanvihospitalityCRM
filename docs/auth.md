# Authentication & Authorization Specification
## Travel CRM Platform

**Document version:** 1.0
**Companion documents:** architecture.md, security.md, TRD.md

This document is the authoritative reference for how identity, sessions, and permissions work in this system. Where any other document (PRD, TRD, phases) touches on auth or roles, this file takes precedence on implementation detail.

---

## 1. Identity Provider

Authentication is handled by **Supabase Auth**, not a custom-built auth system and not NextAuth.js. Supabase Auth owns:

- Credential storage and password hashing (bcrypt under the hood — the application never implements its own hashing).
- Session issuance as short-lived JWTs, with refresh tokens for silent renewal.
- Email/password sign-in at v1.
- A clear upgrade path to OTP (email/SMS) and SSO (Google, Microsoft) later, as a configuration change in Supabase rather than a rebuild.

The application layer does not re-implement any of the above. Anything resembling "roll your own password hashing" or "hand-write JWT signing logic" in application code is a defect, not a stylistic choice.

---

## 2. Identity vs. Role: How They're Linked

Supabase Auth manages *who a user is* (their credentials and their session). It does not manage *what role they hold in which company* — that's application data, not identity data. The two are linked like this:

- Every Supabase Auth user has a stable UID.
- The application's own `User` table stores: `id`, `supabase_uid` (foreign key to the Auth user), `company_id`, `role` (`admin` / `staff_agent` / `accounts`), `name`, `email`, `active` (boolean), timestamps.
- On every authenticated request, the API resolves the Supabase session to its `supabase_uid`, looks up the matching `User` row, and uses that row's `company_id` and `role` for every downstream permission and tenant-scoping decision. The client never gets to assert its own `company_id` or `role` — both are always looked up server-side from the session.
- A deactivated `User` (`active = false`) is rejected at the API layer even if their Supabase session is still technically valid. Deactivation is enforced on the application side, not by deleting the Auth user.

---

## 3. Session Handling

- Sessions are managed through Supabase Auth's server-side helpers for Next.js, using **httpOnly cookies** — session tokens are never placed in `localStorage` or exposed to client-side JavaScript.
- Session refresh happens transparently via Supabase's refresh-token flow; the user is not silently logged out mid-session due to short access-token lifetimes.
- Logout invalidates the session on the Supabase side, not just client-side state.
- All session-bearing requests occur over HTTPS only.

---

## 4. Account Lifecycle

- **Sign-up (company creation):** the first user to register a company becomes that company's `admin`. This is the only self-service path to the `admin` role — nobody can register directly as `staff_agent` or `accounts`.
- **Staff invitation:** an `admin` creates staff accounts (name, email, role). The invited user receives a Supabase Auth invite/sign-up flow to set their own password; the `admin` never sets or sees another user's password.
- **Deactivation:** an `admin` can deactivate a staff account. Deactivation is immediate and blocks API access on the next request, even mid-session.
- **Password reset:** handled entirely through Supabase Auth's standard reset flow (reset email with a time-limited link). No custom reset-token logic is written by the application.

---

## 5. Role-Based Access Control (RBAC) Matrix

Enforcement is server-side, on every endpoint, without exception. The UI may hide controls a role cannot use, but that is a usability convenience only — it is never the actual gate.

| Module / Action | Admin | Staff Agent | Accounts |
|---|---|---|---|
| Manage staff accounts (create, deactivate, assign role) | Full | None | None |
| Configure company profile / branding / GST settings | Full | None | None |
| View own dashboard | Full | Full | Full |
| View all agents' pipeline | Full | Own leads only | Read-only, if needed for reconciliation |
| Create / edit / assign leads | Full | Own leads only | None |
| Move a lead's pipeline stage | Full | Own leads only | None |
| Build / edit itineraries & quotes | Full | Own leads only | None |
| Export itinerary as PDF | Full | Own leads only | Read-only |
| Send quote via WhatsApp/Email | Full | Own leads only | None |
| Convert itinerary to Booking | Full | Own leads only | None |
| Initiate click-to-call | Full | Own leads only | None |
| Play back call recordings | Full | Own calls only | None |
| View leaderboard (all agents) | Full | Own stats + rank only | None |
| Set monthly agent targets | Full | None | None |
| View / create ledger entries (deposits, payments, supplier cost) | Full | None | Full |
| Record manual (offline) payment | Full | None | Full |
| Generate invoice / voucher | Full | None | Full |
| View tour calendar | Full | Full (own tours emphasized) | Full |
| View sales reports | Full | Own performance only | None |
| View financial/ledger reports | Full | None | Full |
| View AuditLog | Full | None | None (unless explicitly extended — see note) |

**Note:** the AuditLog is Admin-only at v1. If a future requirement gives Accounts visibility into financial audit history, that is a deliberate scope change to be logged in `memory.md`'s Decisions Log, not something to be silently added during implementation.

---

## 6. Enforcement Pattern

Every API route follows the same shape, without exception:

1. Resolve the Supabase session → reject with 401 if absent or invalid.
2. Look up the corresponding `User` row → reject with 401 if not found or `active = false`.
3. Check the resolved `role` against the roles the endpoint declares as permitted → reject with 403 if not permitted.
4. Scope every database query by the resolved `company_id` — never by a value taken from the request body, query string, or client-supplied header.
5. For financial writes specifically, write an `AuditLog` entry (actor, action, entity, before/after state, timestamp) as part of the same transaction as the mutation — not as a best-effort follow-up call that could silently fail.

This sequence is not something each endpoint re-implements independently; it belongs in a shared middleware/helper so step 3 and step 4 in particular cannot be skipped by mistake on a new route.

---

## 7. Row Level Security (Defense in Depth)

Supabase RLS policies are applied to every tenant-scoped table, matching the same `company_id` scoping enforced at the application layer. This is a deliberate duplication, not redundancy for its own sake: it means that even a query that bypassed the application's middleware (a bug, a future service that talks to Supabase directly, an admin using the Supabase dashboard) still cannot cross tenant boundaries. Application-level scoping and RLS are treated as two independent controls, and both must be verified — passing one is not sufficient justification for skipping verification of the other. See `security.md` §4 for the required test approach.

---

## 8. Extensibility Notes

- **OTP (SMS/email one-time codes):** enabled via Supabase Auth configuration; no schema change required.
- **SSO (Google/Microsoft):** enabled via Supabase Auth provider configuration; the `User` table's `supabase_uid` link already accommodates any Auth provider Supabase supports.
- Neither is in scope for v1 (see PRD.md §7), but the design should not require rework to add them later.
