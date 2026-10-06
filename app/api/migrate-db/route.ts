import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'MIGRATE_DB_2024';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Security check
    if (secret !== MIGRATION_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid secret' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting database migration...\n');
    const results: string[] = [];

    // 1. Add created_by_id to leads table
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'leads' AND column_name = 'created_by_id'
          ) THEN
            ALTER TABLE leads ADD COLUMN created_by_id TEXT;

            ALTER TABLE leads
            ADD CONSTRAINT leads_created_by_id_fkey
            FOREIGN KEY (created_by_id)
            REFERENCES users(id)
            ON DELETE SET NULL;

            CREATE INDEX IF NOT EXISTS idx_leads_created_by_id ON leads(company_id, created_by_id);

            RAISE NOTICE 'Added created_by_id column to leads table';
          ELSE
            RAISE NOTICE 'created_by_id column already exists';
          END IF;
        END $$;
      `;
      results.push('✅ Leads table: created_by_id column checked/added');
    } catch (err: any) {
      results.push(`⚠️ Leads table warning: ${err.message}`);
    }

    // 2. Fix salary_payments columns (camelCase to snake_case)
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          -- Rename camelCase columns if they exist
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'paymentMode'
          ) THEN
            ALTER TABLE salary_payments RENAME COLUMN "paymentMode" TO payment_mode;
            RAISE NOTICE 'Renamed paymentMode to payment_mode';
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'paymentStatus'
          ) THEN
            ALTER TABLE salary_payments RENAME COLUMN "paymentStatus" TO payment_status;
            RAISE NOTICE 'Renamed paymentStatus to payment_status';
          END IF;

          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'paymentDate'
          ) THEN
            ALTER TABLE salary_payments RENAME COLUMN "paymentDate" TO payment_date;
            RAISE NOTICE 'Renamed paymentDate to payment_date';
          END IF;

          -- Add missing columns if they don't exist
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'payment_mode'
          ) THEN
            ALTER TABLE salary_payments ADD COLUMN payment_mode TEXT DEFAULT 'NEFT';
            RAISE NOTICE 'Added payment_mode column';
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'payment_status'
          ) THEN
            ALTER TABLE salary_payments ADD COLUMN payment_status TEXT DEFAULT 'PAID';
            RAISE NOTICE 'Added payment_status column';
          END IF;
        END $$;
      `;
      results.push('✅ Salary payments table: columns checked/fixed');
    } catch (err: any) {
      results.push(`⚠️ Salary payments warning: ${err.message}`);
    }

    // 3. Ensure critical indexes exist
    try {
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_leads_company_status ON leads(company_id, status);
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_leads_company_assigned ON leads(company_id, assigned_agent_id);
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
      `;
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
      `;
      results.push('✅ Indexes created/verified');
    } catch (err: any) {
      results.push(`⚠️ Indexes warning: ${err.message}`);
    }

    // Verify the changes
    const leadsColumns = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'leads'
      AND column_name IN ('created_by_id', 'assigned_agent_id')
      ORDER BY column_name
    `;

    const salaryColumns = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'salary_payments'
      AND column_name IN ('payment_mode', 'payment_status', 'payment_date')
      ORDER BY column_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      results,
      verification: {
        leadsColumns: leadsColumns.map(c => c.column_name),
        salaryPaymentsColumns: salaryColumns.map(c => c.column_name),
      },
      nextSteps: [
        'Run: npx prisma generate',
        'Restart your development server',
        'Delete this API route (app/api/migrate-db/route.ts) after successful migration',
      ],
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
