-- Fix Missing Database Columns
-- Run this migration to sync database with Prisma schema

-- 1. Add created_by_id to leads table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'created_by_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN created_by_id TEXT;

    -- Add foreign key constraint
    ALTER TABLE leads
    ADD CONSTRAINT leads_created_by_id_fkey
    FOREIGN KEY (created_by_id)
    REFERENCES users(id)
    ON DELETE SET NULL;

    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_leads_created_by_id ON leads(company_id, created_by_id);
  END IF;
END $$;

-- 2. Fix salary_payments table - ensure snake_case column names
DO $$
BEGIN
  -- Check if old camelCase columns exist and rename them
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salary_payments' AND column_name = 'paymentMode'
  ) THEN
    ALTER TABLE salary_payments RENAME COLUMN "paymentMode" TO payment_mode;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salary_payments' AND column_name = 'paymentStatus'
  ) THEN
    ALTER TABLE salary_payments RENAME COLUMN "paymentStatus" TO payment_status;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salary_payments' AND column_name = 'paymentDate'
  ) THEN
    ALTER TABLE salary_payments RENAME COLUMN "paymentDate" TO payment_date;
  END IF;

  -- Add payment_mode column if it doesn't exist at all
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salary_payments' AND column_name = 'payment_mode'
  ) THEN
    ALTER TABLE salary_payments ADD COLUMN payment_mode TEXT DEFAULT 'NEFT';
  END IF;

  -- Add payment_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'salary_payments' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE salary_payments ADD COLUMN payment_status TEXT DEFAULT 'PAID';
  END IF;
END $$;

-- 3. Verify all critical indexes exist
CREATE INDEX IF NOT EXISTS idx_leads_company_status ON leads(company_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_company_assigned ON leads(company_id, assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
END $$;
