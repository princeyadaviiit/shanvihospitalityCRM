# Security Requirements
## Travel CRM Platform

**Document version:** 1.0
**Companion documents:** architecture.md, auth.md, TRD.md, phases.md

This document consolidates every security requirement referenced across the PRD, TRD, and SRS into one authoritative checklist. It is written to be checked against directly during each phase's Test & Fix Loop (see `phases.md`), not just read once.

---

## 1. Transport & Infrastructure

- HTTPS is required everywhere — no endpoint, webhook, or asset is ever served over plain HTTP, in any environment, including local development where practical.
- Secrets (API keys, database URLs, signing secrets) are stored in environment variables or a secret manager. They are never hardcoded, and never committed to the repository — including in commit history, example env files, or test fixtures.
- Each environment (dev / staging / production) uses its own Supabase project and its own set of credentials. Production credentials are never used against staging or dev, and vice versa.

---

## 2. Authentication & Session Security

- All credential handling, password storage, and session/JWT issuance go through Supabase Auth — see `auth.md` for the full design. The application does not implement its own password hashing or token signing.
- Session tokens are held in httpOnly cookies, never in `localStorage` or any location reachable by client-side JavaScript.
- Rate limiting is applied to all authentication endpoints (login, password reset, sign-up) to blunt credential-stuffing and brute-force attempts.
- A deactivated staff account loses API access immediately, even with a still-valid session token.

---

## 3. Authorization (RBAC)

- Role checks are enforced server-side on every endpoint. A UI element being hidden is never treated as sufficient access control.
- The full role/permission matrix in `auth.md` is the source of truth; any endpoint whose access rules aren't already covered there must be resolved against that document (or an explicit, logged extension to it) before being built — not decided ad hoc in the route handler.
- Every financial write endpoint (ledger entries, manual payments, invoice/voucher generation) requires the Accounts or Admin role.

---

## 4. Multi-Tenant Data Isolation

- Every tenant-scoped table carries a `company_id`, and every query is scoped by the authenticated session's `company_id` — never by a client-supplied value.
- Tenant isolation is enforced in two independent layers: a shared application-level query helper, and Supabase Row Level Security policies on the same tables. Both layers must be verified independently.
- From Phase 1 onward, whenever a new tenant-scoped table or endpoint is added, a specific cross-tenant test is required: attempt to read or write another company's data using a valid session for a different company, and confirm it is rejected. This is not satisfied by "the happy path works" — it requires an explicit adversarial check.

---

## 5. Payment & Financial Data Security

- No raw card data ever touches the application server. Payment collection uses the gateway's hosted checkout or tokenized flow exclusively — see `TRD.md` §2 for gateway candidates.
- Every ledger mutation (deposit, payment, supplier cost entry) writes a corresponding `AuditLog` entry in the same transaction: actor, action, entity, before/after values, and timestamp. A ledger write that succeeds while its audit log write silently fails is treated as a bug, not an acceptable edge case.
- Payment gateway live keys are activated only after the business's KYC/verification with that gateway is complete — sandbox keys are used for all development and staging work up to that point (see `phases.md` Phase 3 and Phase 6).
- Multi-currency ledger entries record currency explicitly per entry; conversion/reporting logic never silently assumes a single base currency.

---

## 6. Input Validation & Injection Prevention

- All database access goes through Prisma's parameterized queries — no hand-built SQL string concatenation, anywhere.
- Every API route validates its input against an explicit schema (e.g. Zod) before touching business logic — this covers both basic type/shape validation and defense against injection and XSS payloads in free-text fields (lead notes, itinerary descriptions, etc.).
- File uploads (call recordings, imported data, attachments) are validated on MIME type and size before being written to Supabase Storage.

---

## 7. File & Storage Security

- Sensitive files (invoices, vouchers, call recordings) are stored in access-controlled Supabase Storage buckets, never public buckets.
- Access to any sensitive file is via a signed, time-limited URL — never a permanent or guessable link.
- Storage bucket policies are reviewed alongside RLS policies during each phase's security check, not assumed correct once and forgotten.

---

## 8. Webhooks

- All inbound webhooks (payment gateway, WhatsApp delivery status, telephony call events) verify the provider's signature before processing the payload.
- Every webhook handler is idempotent — a redelivered webhook must never double-apply a ledger entry, duplicate a call log, or re-trigger a notification.

---

## 9. Audit Logging

- `AuditLog` captures actor, action, entity type/ID, before/after state, and timestamp for every financial mutation, and for RBAC-sensitive actions (role changes, account deactivation).
- Audit log entries are treated as append-only. Nothing in the application ever edits or deletes an existing `AuditLog` row.
- Audit log visibility is Admin-only at v1 (see `auth.md` §5).

---

## 10. Dependency & Supply Chain Hygiene

- Dependency vulnerability checks (`npm audit` or equivalent) run as part of every phase's Test & Fix Loop, not just at the end of the project.
- New dependencies are added deliberately — see `rules.md` §4 for the review bar before pulling in a new package.

---

## 11. Logging & Monitoring

- Application logs never contain secrets, full payment details, or full session tokens.
- Error logs may contain enough context to debug (user ID, company ID, endpoint, error type) without leaking personally identifiable traveller information unnecessarily into log storage.

---

## 12. GST / Tax Compliance

- Invoice generation follows Indian GST formatting requirements: correct tax breakdown, GSTIN display, and line-item detail as specified in `PRD.md` §4.7 and `SRS.md`-derived functional requirements.
- Company-level GST configuration (GST number, default currency) is required before an invoice can be generated for that company — the system should block generation with a clear message rather than emit a non-compliant invoice.

---

## 13. Backup & Recovery

- Supabase's automated backup capability is enabled on every environment's project from the start, not added retroactively before launch.
- Backup/restore is explicitly tested — not just assumed to work — as part of Phase 6 (`phases.md`), before production go-live.

---

## 14. Security Checklist by Phase

This mirrors the Test & Fix Loop's security check step in `phases.md`, expanded:

| Phase | What must be verified |
|---|---|
| Phase 0 | Auth/session setup uses Supabase Auth correctly; no secrets committed; env config separated per environment |
| Phase 1 | RBAC structure enforced server-side; cross-tenant access explicitly tested; input validation on all new endpoints |
| Phase 2 | Input validation on itinerary/quote endpoints; PDF export doesn't leak another tenant's branding/data |
| Phase 3 | No raw card data touches the server; ledger writes are Accounts/Admin-only and server-enforced; sandbox-only gateway keys; audit logging confirmed on every ledger mutation |
| Phase 4 | Telephony webhook signature verification; call recordings stored with signed URLs, not public links |
| Phase 5 | WhatsApp webhook idempotency; company branding correctly tenant-scoped on generated documents |
| Phase 6 | Full RBAC audit across all phases; rate limiting confirmed on auth endpoints; dependency vulnerability scan; secrets management review; backup/restore verified; live keys activated only post-KYC |
