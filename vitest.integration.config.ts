import { defineConfig } from 'vitest/config'
import path from 'path'

/**
 * The real-boundary security project (.claude/rules/security-testing.md): suites that use REAL Supabase Auth and the REAL database of the owner-approved
 * development project with synthetic rows. It is a separate collection on purpose — the default jsdom run (vitest.config.ts) excludes `*.integration.test.ts`
 * and never needs a network or a credential. Run:  SECURITY_TEST_PROJECT_REF=<approved project ref> npm run test:security-integration
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/tests/integration/setup.ts'],
    // real network and real Auth: generous limits, but no retries (a flaky green is not evidence) and no parallel files (one project, one set of rows)
    testTimeout: 120_000,
    hookTimeout: 180_000,
    retry: 0,
    fileParallelism: false,
    allowOnly: false,
    passWithNoTests: false,
    isolate: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'server-only': path.resolve(__dirname, './src/tests/server-only-stub.ts'),
      'next/cache': path.resolve(__dirname, './src/tests/next-cache-stub.ts'),
    },
  },
})
