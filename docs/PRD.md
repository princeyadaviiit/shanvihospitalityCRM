# Product Requirements Document (PRD)
## Travel CRM Platform

**Document version:** 2.0
**Status:** Approved for build — implementation reference for Claude Code
**Companion documents:** TRD.md, architecture.md, security.md, auth.md, phases.md, rules.md

---

## 1. Product Vision

This product is a B2B travel CRM built for outbound travel agencies and tour operators that run an internal sales team — typically 10 to 100 staff — and need one system to manage the full lifecycle of a client relationship: enquiry, itinerary and quoting, outbound calling, payment collection, and post-sale documentation.

Three capability areas are brought together in a single application:

- A fast itinerary and quote builder that lets an agent price a multi-day trip and get a proposal in front of a client quickly.
- An outbound sales pipeline with click-to-call and agent performance tracking, so sales leadership can see pipeline health and individual productivity in one place.
- Multi-currency financial ledgers, GST-compliant invoicing, and role-scoped dashboards, so the finance side of the business isn't run out of a separate spreadsheet.

The product category and general UX patterns are informed by what already works in this space; nothing here is a copy of any specific competitor's code, design assets, or proprietary implementation. Everything described below is being built from scratch.

The application ships as a single responsive web app, installable as a Progressive Web App (PWA) on both phone and laptop, with the option to wrap it for the Play Store and App Store later without a rebuild.

---

## 2. Target Market

**Primary audience:** B2B travel agencies and tour operators with an internal sales team — admins, staff agents, and accounts personnel — managing inbound and outbound leads for their own clients.

**Explicitly out of scope for v1:** a direct-to-consumer, self-service booking storefront for end travelers. This may be considered as a separate product extension in a future phase, but it does not share this build's data model or permission structure and should not be designed into v1.

---

## 3. User Roles

| Role | Responsibilities |
|---|---|
| **Admin** | Full system access. Manages the team, sets monthly sales targets, reviews leaderboards, oversees the entire pipeline, configures company-wide settings, and has visibility into all financial reports. |
| **Staff Agent** | Owns assigned leads, builds itineraries and quotes, places calls through click-to-call, logs follow-ups, and can see their own performance against target. |
| **Accounts** | Owns payment ledgers, deposits, supplier costings, and invoice/voucher generation, and handles multi-currency reconciliation. Has little to no access to editing the lead pipeline itself. |

All three roles require a working, role-appropriate dashboard from v1 — this is not something that can be deferred to a later phase. The full permission matrix (who can do what, per module) is defined in `auth.md` and must be treated as the source of truth during implementation, not this table.

---

## 4. Core Modules

### 4.1 Lead / Pipeline CRM
- Kanban board with stages: Enquiry → In Progress → Confirmed → Missed. Stage names should be configurable later, but the four default stages ship at v1.
- Lead card shows: traveller name, destination, pax count, quoted price and currency, and assigned agent.
- Lead detail view shows full contact information, communication history, links to any itinerary/quote, the payment ledger for that lead's booking (if one exists), and free-text notes.
- Lead source is tracked (manual entry, website, Meta/Google Ads, WhatsApp) — the API integrations that auto-populate some of these sources are phased in later; manual entry and tagging work from Phase 1.
- Follow-up reminders and automated alerts so a lead doesn't go cold silently.

### 4.2 Itinerary / Quote Builder
- Drag-and-drop, day-by-day itinerary builder.
- Pre-built templates by destination, to speed up repeat itinerary creation.
- Automatic tour costing across accommodation, transfers, activities, and airfare line items.
- Export as PDF, and share directly via WhatsApp and Email once those integrations are live.
- A quote converts into a confirmed Booking, at which point its cost details lock.

### 4.3 Click-to-Call & Call Logging
- Outbound calls are initiated from inside the app, through a telephony provider API (Twilio, Exotel, or Knowlarity are the leading candidates — see TRD.md).
- Every call auto-logs its timestamp, duration, linked lead, and the agent who placed it.
- Call recordings, where the provider supports them, are stored and linked to the lead record, and are playable by Admin for training and audit purposes.
- Talk-time and call count are tracked per agent, feeding the leaderboard.

### 4.4 Agent Productivity Leaderboards
- Tracked metrics: talk time, number of calls, conversion cycle time (enquiry to confirmed), and booking volume.
- Admin sets a monthly sales target per agent.
- The leaderboard ranks staff against target.
- Each agent can see their own detailed stats and their rank, but not the full detail behind other agents' numbers.

### 4.5 Tour Calendar
- Calendar view of every confirmed tour, showing start and end dates, payment cutoff dates, and supplier booking status.
- Used operationally for on-tour tracking and transport scheduling, not just as a passive report.

### 4.6 Payments & Multi-Currency Ledgers
- Real-time tracking of package price, deposits received, supplier costs, and net margin.
- Multi-currency support — INR and USD are required at v1, with the ledger architecture built to extend beyond those two without a schema rewrite.
- Payment gateway integration for online client payments (candidates: Razorpay, Stripe, PayU — final choice in TRD.md), sandbox-only until business KYC is complete.
- Manual payment entry for offline and bank-transfer payments, always attributed to the Accounts user who recorded it.
- Automated reminders for pending or overdue payments.

### 4.7 Invoices & Vouchers
- GST-compliant PDF invoice generation with a full line-item breakdown and correct tax calculation.
- Accommodation and service vouchers, including hotel details, dates, and confirmation number.
- One-click delivery of either document via WhatsApp or Email.

### 4.8 Reports & MIS
- Sales reports covering leads, conversions, and revenue.
- Ledger and financial reports, scoped to the Accounts role.
- Exportable as PDF and/or Excel.

### 4.9 Team & Company Management
- Employee and staff records: name, role, contact details, active/inactive status.
- Company profile settings: branding used on quotes and invoices, GST number, and default currency.

---

## 5. Platform Requirements

- Responsive web application usable across desktop, laptop, tablet, and mobile browsers.
- PWA-installable ("Add to Home Screen"), with an offline app shell and an app-like experience.
- The architecture is deliberately built so that a native wrapper — a Trusted Web Activity for Android, Capacitor for iOS — can be added after launch without a core rebuild. See `architecture.md` §7 and `phases.md` Phase 7.

---

## 6. Non-Functional Requirements (Summary)

This section is a summary only. The authoritative, detailed requirements live in `security.md` and `auth.md` — those documents govern implementation, and this PRD should not be treated as the security spec.

- Role-based access control enforced at the API level, never only in the UI.
- Per-company data isolation, enforced from day one even while only a single company is using the system.
- A full audit trail on every financial action — who changed a ledger entry, and when.
- No raw payment card data is ever stored by the application; card data is handled entirely by the payment gateway's hosted checkout or tokenized flow.
- GST-compliant invoice formatting for Indian tax compliance.
- Reasonable performance with pipelines holding hundreds of concurrent leads per agency.

---

## 7. Out of Scope (v1)

- A B2C, self-serve booking storefront.
- Native mobile apps (deferred to the optional post-launch wrapping phase).
- AI-generated itineraries (a possible future enhancement, not part of this build).
- Multi-language UI — English only at v1.

---

## 8. Success Criteria for v1

- Admin, Staff Agent, and Accounts can each log in and use their respective dashboard end to end.
- A lead can move from Enquiry through to Confirmed, with an itinerary attached, payments tracked, and an invoice generated.
- At least one payment gateway is integrated and functioning in sandbox mode.
- The app installs as a PWA on both Android and iOS devices.

---

## 9. Related Documents

| Document | Covers |
|---|---|
| `TRD.md` | Technology stack, integrations, data model, API design principles |
| `architecture.md` | System architecture, multi-tenancy model, deployment topology |
| `security.md` | Full security requirements and controls |
| `auth.md` | Authentication design and the complete role/permission matrix |
| `phases.md` | Phase-by-phase build plan and per-phase acceptance criteria |
| `rules.md` | Working rules, coding standards, and the memory-log protocol for the build agent |
