# Shanvi Hospitality CRM - Production Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Clerk Authentication Setup](#clerk-authentication-setup)
5. [Deployment Options](#deployment-options)
6. [Security Checklist](#security-checklist)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Performance Optimization](#performance-optimization)
10. [Maintenance](#maintenance)

---

## Prerequisites

### Required Services
- **Supabase** account (Database + RLS policies)
- **Clerk** account (Authentication)
- **Vercel** account (recommended for deployment) or any Node.js hosting
- **Domain name** with SSL certificate
- **Razorpay** account (Payment Gateway)
- **Twilio** account (optional, for telephony)

### Required Tools
- Node.js 18+ and npm
- Git
- Android Studio (for mobile app builds)
- PostgreSQL client (for database management)

---

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Environment
NODE_ENV=production

# Database (Supabase Postgres)
# Use Connection Pooler URL (port 6543) for serverless
DATABASE_URL=postgresql://postgres:[password]@[project-ref].pooler.supabase.com:6543/postgres?pgbouncer=true
# Direct URL for migrations (port 5432)
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxx
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/onboarding

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Razorpay Payment Gateway (PRODUCTION KEYS)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_production_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id

# Twilio (Production Credentials)
TWILIO_ACCOUNT_SID=your_production_account_sid
TWILIO_AUTH_TOKEN=your_production_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Capacitor (Android/Mobile)
CAPACITOR_SERVER_URL=https://your-domain.com
```

### 2. Security Best Practices for Environment Variables

**CRITICAL SECURITY RULES:**
- ✅ Never commit `.env`, `.env.local`, or `.env.production` to Git
- ✅ Use different Clerk apps for development and production
- ✅ Use Razorpay LIVE keys only in production
- ✅ Rotate secrets every 90 days
- ✅ Use your hosting provider's secret management (Vercel Environment Variables)
- ✅ Enable 2FA on all third-party accounts (Supabase, Clerk, Razorpay)

---

## Database Setup

### 1. Run Prisma Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run all migrations against production database
npx prisma migrate deploy

# Run the lead creator tracking migration
psql $DATABASE_URL -f prisma/migrations/add_lead_creator_tracking.sql
```

### 2. Verify Database Schema

```bash
# Open Prisma Studio to verify tables
npx prisma studio
```

### 3. Set Up Supabase Row Level Security (RLS)

Run the RLS policies from `prisma/supabase_schema.sql` in your Supabase SQL editor:

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

-- Apply RLS policies (see prisma/supabase_schema.sql for full policies)
```

### 4. Create Indexes for Performance

```sql
-- Additional production indexes
CREATE INDEX CONCURRENTLY idx_leads_created_at ON leads(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_bookings_created_at ON bookings(company_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_ledger_entries_created_at ON ledger_entries(company_id, created_at DESC);
```

---

## Clerk Authentication Setup

### 1. Create Production Instance

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application for **Production**
3. Configure the following:
   - **Application Name**: Shanvi Hospitality CRM (Production)
   - **Sign-in options**: Email + Password (enable)
   - **Social logins**: Optional (Google, Microsoft for enterprise)

### 2. Configure Webhook for User Sync

1. In Clerk Dashboard, go to **Webhooks** → **Add Endpoint**
2. Set endpoint URL: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the **Signing Secret** and add to `CLERK_WEBHOOK_SIGNING_SECRET`

### 3. Configure Redirect URLs

In Clerk Dashboard → **Paths**:
- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in**: `/dashboard`
- **After sign-up**: `/onboarding`

### 4. Production Domain Verification

1. Add your production domain in Clerk Dashboard → **Domains**
2. Verify DNS settings
3. Test authentication flow on production domain

---

## Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel:**
- Seamless Next.js 15 support
- Automatic SSL certificates
- Global CDN
- Environment variable management
- Preview deployments

**Deploy Steps:**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables in Vercel Dashboard
# Settings → Environment Variables → Add all from .env.production
```

**Vercel Configuration (`vercel.json`):**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["bom1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Option 2: Self-Hosted (VPS/EC2)

**Requirements:**
- Ubuntu 22.04 LTS or similar
- 2GB RAM minimum (4GB recommended)
- Node.js 18+
- Nginx or Apache
- PM2 for process management

**Setup Steps:**

```bash
# 1. Clone repository
git clone https://github.com/yourusername/shanvi-crm.git
cd shanvi-crm

# 2. Install dependencies
npm ci --production

# 3. Set environment variables
cp .env.production .env

# 4. Build application
npm run build

# 5. Install PM2
npm install -g pm2

# 6. Start with PM2
pm2 start npm --name "shanvi-crm" -- start
pm2 save
pm2 startup
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Security Checklist

### Pre-Launch Security Audit

- [ ] **HTTPS Only**: Enforce SSL/TLS on all routes
- [ ] **Security Headers**: Verify `middleware.ts` security headers are active
- [ ] **CORS**: Restrict origins in production
- [ ] **Rate Limiting**: Enable on authentication and API routes
- [ ] **SQL Injection**: All queries use Prisma (parameterized)
- [ ] **XSS Protection**: All user input sanitized
- [ ] **CSRF Protection**: Clerk handles this
- [ ] **Secrets**: No secrets in client-side code or Git
- [ ] **RLS Policies**: Supabase RLS enabled on all tables
- [ ] **Admin Routes**: `/api/admin/*` restricted to admin role
- [ ] **File Uploads**: PDF generation only (no arbitrary uploads)
- [ ] **Webhook Signatures**: Clerk webhook verified with `svix`

### Regular Security Maintenance

1. **Monthly**:
   - Review audit logs for suspicious activity
   - Check for outdated npm packages: `npm audit`
   - Rotate API keys if compromised

2. **Quarterly**:
   - Rotate database passwords
   - Review and update RLS policies
   - Penetration testing

3. **Annually**:
   - Full security audit
   - Update SSL certificates (auto-renewed with Let's Encrypt)

---

## Monitoring & Logging

### Application Monitoring

**Recommended Tools:**
- **Sentry** (Error tracking)
- **Vercel Analytics** (Performance)
- **LogRocket** or **FullStory** (Session replay)

**Setup Sentry:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to `sentry.client.config.js`:

```javascript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
});
```

### Database Monitoring

**Supabase Dashboard Metrics:**
- Monitor database size
- Active connections
- Query performance
- Slow queries

**Set Alerts:**
- Database CPU > 80%
- Disk usage > 80%
- Connection pool exhausted

### Uptime Monitoring

**Use:**
- **UptimeRobot** (free, 5-minute checks)
- **Pingdom**
- **Better Uptime**

**Monitor:**
- `https://your-domain.com` (200 OK)
- `https://your-domain.com/api/health` (create health check endpoint)

---

## Backup & Recovery

### Automated Database Backups

**Supabase:**
- Automatic daily backups (included)
- Point-in-time recovery (PITR) available
- Manual backups before major changes

**Manual Backup:**

```bash
# Export database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Upload to S3 or secure storage
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### Recovery Procedures

**Database Recovery:**

```bash
# Restore from backup
psql $DATABASE_URL < backup_20250204.sql
```

**Application Rollback:**

```bash
# Vercel: Rollback to previous deployment
vercel rollback

# Self-hosted: PM2 restore
pm2 stop shanvi-crm
git checkout previous-stable-tag
npm ci
npm run build
pm2 restart shanvi-crm
```

---

## Performance Optimization

### Next.js Optimizations

1. **Enable Image Optimization:**
   - Use `next/image` for all images
   - Configure `images.domains` in `next.config.js`

2. **Static Generation:**
   - Pre-render marketing pages
   - Use ISR for package catalogs

3. **Code Splitting:**
   - Dynamic imports for heavy components
   - Lazy load non-critical features

4. **Caching:**
   - Set Cache-Control headers
   - Use Vercel Edge Network

### Database Optimizations

1. **Connection Pooling:**
   - Already configured (PgBouncer via Supabase)
   - Max connections: 100

2. **Query Optimization:**
   - Add indexes on frequently queried columns
   - Use Prisma's `select` to fetch only needed fields
   - Avoid N+1 queries

3. **Pagination:**
   - Implement cursor-based pagination for large datasets

### Monitoring Performance

```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.url=https://your-domain.com
```

**Target Metrics:**
- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 100

---

## Maintenance

### Daily Tasks
- Monitor error logs (Sentry)
- Check uptime status
- Review critical alerts

### Weekly Tasks
- Review new leads and bookings
- Check database size and growth
- Review slow API endpoints

### Monthly Tasks
- Security updates: `npm audit fix`
- Review and optimize slow queries
- Check disk usage and cleanup old logs
- Review user feedback and bug reports

### Quarterly Tasks
- Update dependencies: `npm update`
- Review and update RLS policies
- Load testing
- Security audit

### Release Checklist

Before each production release:

- [ ] Run all tests: `npm run test:all`
- [ ] Run type checking: `npx tsc --noEmit`
- [ ] Run linting: `npm run lint`
- [ ] Test on staging environment
- [ ] Database migrations tested
- [ ] Changelog updated
- [ ] Documentation updated
- [ ] Stakeholders notified
- [ ] Rollback plan prepared
- [ ] Monitor first 30 minutes post-deploy

---

## Support & Troubleshooting

### Common Issues

**Issue: Clerk webhook failing**
- Verify signing secret matches
- Check endpoint is publicly accessible
- Review webhook logs in Clerk Dashboard

**Issue: Database connection timeout**
- Check connection pooler URL (port 6543)
- Verify network connectivity
- Increase connection timeout in Prisma

**Issue: PDF generation slow**
- Implement background job processing
- Cache frequently used PDFs
- Optimize PDF templates

### Emergency Contacts

- **System Admin**: [Your Name] - [Email/Phone]
- **Database Admin**: [Name] - [Email/Phone]
- **Clerk Support**: https://clerk.com/support
- **Supabase Support**: https://supabase.com/support
- **Razorpay Support**: https://razorpay.com/support

---

## Compliance & Legal

### GDPR Compliance
- User data deletion on request
- Data export functionality
- Privacy policy updated
- Cookie consent implemented

### Indian Data Regulations
- GST compliance in invoices
- PAN/GSTIN validation
- Indian Rupee (INR) primary currency

### Audit Trail
- All financial transactions logged in `audit_logs`
- Immutable ledger entries
- Role-based access control (RBAC)

---

## Production Launch Checklist

### Pre-Launch
- [ ] All environment variables set
- [ ] Database migrations completed
- [ ] RLS policies enabled
- [ ] Clerk production instance configured
- [ ] Webhook endpoints verified
- [ ] SSL certificate installed
- [ ] DNS records configured
- [ ] Monitoring tools active
- [ ] Backup system tested
- [ ] Security audit completed

### Post-Launch
- [ ] Monitor error rates for 24 hours
- [ ] Verify all critical flows (sign-up, booking, payment)
- [ ] Check email notifications
- [ ] Test mobile app sync
- [ ] Review performance metrics
- [ ] Collect initial user feedback

---

## Conclusion

This production deployment guide covers all critical aspects of deploying Shanvi Hospitality CRM to production. Follow the checklists systematically and maintain regular monitoring to ensure a stable, secure, and performant application.

For any questions or issues, refer to the documentation in the `docs/` directory or contact the development team.

**Last Updated**: February 2025
**Version**: 1.0.0
