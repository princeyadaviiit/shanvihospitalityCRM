const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...\n');

    const sqlPath = path.join(__dirname, '../prisma/migrations/fix_missing_columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (rough split by semicolon)
    const statements = sql
      .split(/;\s*$$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log('✅ Executed statement successfully');
      } catch (err) {
        // Log but continue - some statements might fail if columns already exist
        console.log('⚠️  Statement warning:', err.message);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('📊 Verifying database state...\n');

    // Verify the changes
    const leadsColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'leads'
      AND column_name IN ('created_by_id', 'assigned_agent_id')
    `;

    const salaryColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'salary_payments'
      AND column_name IN ('payment_mode', 'payment_status', 'payment_date')
    `;

    console.log('Leads table columns:', leadsColumns);
    console.log('Salary payments columns:', salaryColumns);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
