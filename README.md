# Travel CRM Platform

A B2B Travel CRM built for outbound travel agencies and tour operators with internal sales teams.

## Project Status

- **Phase 0 - Project Setup**: ✅ COMPLETE (Auth, multi-tenant DB structure, PWA setup)
- **Phase 1 - Basic Core CRM (Leads Only)**: ✅ COMPLETE (Lead model, Kanban pipeline, RBAC enforcement, Staff management, manual notes, automated test suite)
- **Phase 2 - Itinerary & Quote Builder**: ✅ COMPLETE (Itinerary builder, auto-costing, PDF export, booking conversion, automated test suite)
- **Phase 3 - Payments & Ledger (Sandbox)**: ✅ COMPLETE (Razorpay integration, ledger management, GST invoices, audit logging)
- **Phase 4 - Click-to-Call & Leaderboard**: ✅ COMPLETE (Twilio integration, call logging, performance tracking, target management)
- **Phase 5 - Calendar, Reports & WhatsApp**: Ready to start


## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Queue**: BullMQ + Redis
- **Deployment**: Vercel (frontend), Supabase (backend services)

## Prerequisites

- Node.js 20.x or later
- npm or yarn
- A Supabase account and project

## Installation

1. **Clone the repository**
   ```bash
   cd D:\projects\CRM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   
   Then fill in your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `DATABASE_URL`: Your Supabase Postgres connection string

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
D:\projects\CRM\
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── prisma/
│   └── schema.prisma      # Database schema
├── public/                # Static assets
│   ├── manifest.json      # PWA manifest
│   └── icons/             # PWA icons
├── docs/                  # Project documentation
│   ├── PRD.md            # Product Requirements
│   ├── TRD.md            # Technical Requirements
│   ├── architecture.md    # System Architecture
│   ├── security.md        # Security Requirements
│   ├── auth.md           # Authentication Spec
│   ├── phases.md         # Implementation Phases
│   ├── rules.md          # Working Rules
│   └── memory.md         # Project Memory Log
└── package.json
```

## User Roles

- **Admin**: Full system access, manages team and company settings
- **Staff Agent**: Owns assigned leads, builds itineraries, makes calls
- **Accounts**: Manages payments, ledgers, and financial reports

## Phase 0 Acceptance Criteria

- [ ] User can sign up a company
- [ ] User can log in and log out
- [ ] App installs as a PWA
- [ ] App runs locally without errors
- [ ] Security check passes (no secrets committed, HTTPS in production)

## Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:phase1` - Run Phase 1 automated test suite (RBAC, isolation, lifecycle)
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations

### Code Standards

- TypeScript strict mode enabled
- Business logic in API layer, not frontend components
- All endpoints validate input (Zod)
- RBAC enforced server-side on every endpoint
- Every tenant-scoped query filtered by `company_id`

## Security

- HTTPS everywhere
- Session tokens in httpOnly cookies only
- Secrets in environment variables, never committed
- Row Level Security (RLS) on all tenant-scoped tables
- Input validation on all endpoints
- Regular dependency vulnerability checks

## Documentation

See the `docs/` folder for complete specification:
- **PRD.md**: Product requirements and feature scope
- **TRD.md**: Technology stack and data model
- **architecture.md**: System architecture
- **security.md**: Security requirements
- **auth.md**: Authentication and RBAC specification
- **phases.md**: Phase-by-phase build plan
- **rules.md**: Working rules for build agent
- **memory.md**: Project state and decision log

## License

Private - All Rights Reserved
