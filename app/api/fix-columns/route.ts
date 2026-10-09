import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MIGRATION_SECRET = process.env.MIGRATION_SECRET || 'FIX_COLUMNS_2024';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== MIGRATION_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized - invalid secret' },
        { status: 401 }
      );
    }

    console.log('🔄 Fixing salary_payments column naming...\n');
    const results: string[] = [];

    // Rename camelCase columns to snake_case
    try {
      await prisma.$executeRaw`
        DO $$
        BEGIN
          -- Rename paymentMode to payment_mode if exists
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'paymentMode'
          ) THEN
            ALTER TABLE salary_payments RENAME COLUMN "paymentMode" TO payment_mode;
            RAISE NOTICE 'Renamed paymentMode to payment_mode';
          ELSIF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'payment_mode'
          ) THEN
            ALTER TABLE salary_payments ADD COLUMN payment_mode TEXT DEFAULT 'NEFT';
            RAISE NOTICE 'Added payment_mode column';
          END IF;

          -- Rename paymentStatus to payment_status if exists
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'paymentStatus'
          ) THEN
            ALTER TABLE salary_payments RENAME COLUMN "paymentStatus" TO payment_status;
            RAISE NOTICE 'Renamed paymentStatus to payment_status';
          ELSIF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'payment_status'
          ) THEN
            ALTER TABLE salary_payments ADD COLUMN payment_status TEXT DEFAULT 'PAID';
            RAISE NOTICE 'Added payment_status column';
          END IF;

          -- Rename paymentDate to payment_date if exists
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'paymentDate'
          ) THEN
            ALTER TABLE salary_payments RENAME COLUMN "paymentDate" TO payment_date;
            RAISE NOTICE 'Renamed paymentDate to payment_date';
          ELSIF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'salary_payments' AND column_name = 'payment_date'
          ) THEN
            ALTER TABLE salary_payments ADD COLUMN payment_date TIMESTAMP DEFAULT NOW();
            RAISE NOTICE 'Added payment_date column';
          END IF;
        END $$;
      `;
      results.push('✅ salary_payments columns fixed');
    } catch (err: any) {
      results.push(`⚠️ Error: ${err.message}`);
    }

    // Verify the changes
    const columns = await prisma.$queryRaw<any[]>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'salary_payments'
      AND column_name IN ('payment_mode', 'payment_status', 'payment_date', 'paymentMode', 'paymentStatus', 'paymentDate')
      ORDER BY column_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Column naming migration completed',
      results,
      columns: columns.map(c => c.column_name),
      nextSteps: [
        'Restart your application',
        'Test employee and payroll operations',
        'Delete this endpoint after successful verification',
      ],
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
