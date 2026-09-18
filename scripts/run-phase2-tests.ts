// Script runner for Phase 2 automated tests
import { runPhase2Tests } from '../tests/phase2.test';

async function main() {
  (process.env as any).NODE_ENV = 'test';
  try {
    const result = await runPhase2Tests();
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
