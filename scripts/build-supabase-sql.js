const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'supabase_schema.sql');
const rlsPath = path.join(__dirname, '..', 'prisma', 'rls_policies.sql');
const outputPath = path.join(__dirname, '..', 'prisma', 'supabase_complete_setup.sql');

const schema = fs.readFileSync(schemaPath, 'utf8');
const rls = fs.readFileSync(rlsPath, 'utf8');

const additionalRls = `
-- 7. LEDGER ENTRIES POLICIES
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant-scoped ledger select" ON ledger_entries;
CREATE POLICY "Tenant-scoped ledger select" ON ledger_entries
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Tenant-scoped ledger mutate" ON ledger_entries;
CREATE POLICY "Tenant-scoped ledger mutate" ON ledger_entries
  FOR ALL
  USING (
    company_id = get_auth_user_company_id()
    AND get_auth_user_role() IN ('admin', 'accounts')
  );

-- 8. INVOICES POLICIES
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant-scoped invoices select" ON invoices;
CREATE POLICY "Tenant-scoped invoices select" ON invoices
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Tenant-scoped invoices mutate" ON invoices;
CREATE POLICY "Tenant-scoped invoices mutate" ON invoices
  FOR ALL
  USING (
    company_id = get_auth_user_company_id()
    AND get_auth_user_role() IN ('admin', 'accounts')
  );

-- 9. RAZORPAY ORDERS POLICIES
ALTER TABLE razorpay_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant-scoped razorpay select" ON razorpay_orders;
CREATE POLICY "Tenant-scoped razorpay select" ON razorpay_orders
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

-- 10. CALLS POLICIES
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant-scoped calls select" ON calls;
CREATE POLICY "Tenant-scoped calls select" ON calls
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Tenant-scoped calls insert" ON calls;
CREATE POLICY "Tenant-scoped calls insert" ON calls
  FOR INSERT
  WITH CHECK (company_id = get_auth_user_company_id());

-- 11. TARGETS POLICIES
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant-scoped targets select" ON targets;
CREATE POLICY "Tenant-scoped targets select" ON targets
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Tenant-scoped targets mutate" ON targets;
CREATE POLICY "Tenant-scoped targets mutate" ON targets
  FOR ALL
  USING (
    company_id = get_auth_user_company_id()
    AND get_auth_user_role() = 'admin'
  );

-- 12. AUDIT LOGS POLICIES (Append-only & Admin view)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant-scoped audit logs select" ON audit_logs;
CREATE POLICY "Tenant-scoped audit logs select" ON audit_logs
  FOR SELECT
  USING (company_id = get_auth_user_company_id() AND get_auth_user_role() = 'admin');

-- 13. COMPANY SETTINGS POLICIES
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant-scoped company settings select" ON company_settings;
CREATE POLICY "Tenant-scoped company settings select" ON company_settings
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Tenant-scoped company settings mutate" ON company_settings;
CREATE POLICY "Tenant-scoped company settings mutate" ON company_settings
  FOR ALL
  USING (company_id = get_auth_user_company_id() AND get_auth_user_role() = 'admin');
`;

const complete = `-- =========================================================
-- COMPLETE SUPABASE SETUP SCRIPT (TABLES + INDEXES + RLS)
-- Paste and execute this entire script into your Supabase SQL Editor.
-- =========================================================

${schema}

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & HELPER FUNCTIONS
-- =========================================================

${rls}
${additionalRls}
`;

fs.writeFileSync(outputPath, complete, 'utf8');
console.log('Successfully generated:', outputPath);
