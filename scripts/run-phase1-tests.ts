// Script runner for Phase 1 automated tests
import { runPhase1Tests } from '../tests/phase1.test';

async function main() {
  (process.env as any).NODE_ENV = 'test';
  try {
    const result = await runPhase1Tests();
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Test execution encountered fatal error:', error);
    process.exit(1);
  }
}

main();
