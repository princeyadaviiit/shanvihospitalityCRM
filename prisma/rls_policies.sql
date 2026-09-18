-- Row Level Security (RLS) Policies for Multi-Tenant Travel CRM
-- These policies mirror application-level company_id scoping for defense in depth.

-- Enable RLS on all tenant-scoped tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's company_id from their auth.uid()
CREATE OR REPLACE FUNCTION get_auth_user_company_id()
RETURNS TEXT AS $$
  SELECT company_id FROM users WHERE supabase_uid = auth.uid()::text AND active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get the current user's role
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role::text FROM users WHERE supabase_uid = auth.uid()::text AND active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. COMPANIES POLICIES
DROP POLICY IF EXISTS "Users can view own company" ON companies;
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT
  USING (id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Admins can update own company" ON companies;
CREATE POLICY "Admins can update own company" ON companies
  FOR UPDATE
  USING (id = get_auth_user_company_id() AND get_auth_user_role() = 'admin');

-- 2. USERS POLICIES
DROP POLICY IF EXISTS "Users can view members of own company" ON users;
CREATE POLICY "Users can view members of own company" ON users
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Admins can insert users in own company" ON users;
CREATE POLICY "Admins can insert users in own company" ON users
  FOR INSERT
  WITH CHECK (company_id = get_auth_user_company_id() AND get_auth_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins can update users in own company" ON users;
CREATE POLICY "Admins can update users in own company" ON users
  FOR UPDATE
  USING (company_id = get_auth_user_company_id() AND get_auth_user_role() = 'admin');

-- 3. LEADS POLICIES
-- Admin and Accounts can view all company leads. Staff agents can view only assigned leads.
DROP POLICY IF EXISTS "Tenant-scoped leads select" ON leads;
CREATE POLICY "Tenant-scoped leads select" ON leads
  FOR SELECT
  USING (
    company_id = get_auth_user_company_id()
    AND (
      get_auth_user_role() IN ('admin', 'accounts')
      OR assigned_agent_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS "Tenant-scoped leads insert" ON leads;
CREATE POLICY "Tenant-scoped leads insert" ON leads
  FOR INSERT
  WITH CHECK (
    company_id = get_auth_user_company_id()
    AND get_auth_user_role() IN ('admin', 'staff_agent')
  );

DROP POLICY IF EXISTS "Tenant-scoped leads update" ON leads;
CREATE POLICY "Tenant-scoped leads update" ON leads
  FOR UPDATE
  USING (
    company_id = get_auth_user_company_id()
    AND (
      get_auth_user_role() = 'admin'
      OR (
        get_auth_user_role() = 'staff_agent'
        AND assigned_agent_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()::text)
      )
    )
  );

-- 4. LEAD NOTES POLICIES
DROP POLICY IF EXISTS "Tenant-scoped lead notes select" ON lead_notes;
CREATE POLICY "Tenant-scoped lead notes select" ON lead_notes
  FOR SELECT
  USING (company_id = get_auth_user_company_id());

DROP POLICY IF EXISTS "Tenant-scoped lead notes insert" ON lead_notes;
CREATE POLICY "Tenant-scoped lead notes insert" ON lead_notes
  FOR INSERT
  WITH CHECK (
    company_id = get_auth_user_company_id()
    AND get_auth_user_role() IN ('admin', 'staff_agent')
  );
