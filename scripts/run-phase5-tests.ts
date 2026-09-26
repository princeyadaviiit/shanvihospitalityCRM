// Script runner for Phase 5 automated tests
(process.env as any).NODE_ENV = 'test';

async function run() {
  try {
    const { runPhase5Tests } = await import('../tests/phase5.test');
    const result = await runPhase5Tests();
    if (!result.success) {
      process.exit(1);
    }
    process.exit(0);
  } catch (error) {
    console.error('Test execution encountered fatal error:', error);
    process.exit(1);
  }
}

run();

export {};
