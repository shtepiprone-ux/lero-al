import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    // Isolate each test file so module mocks do not bleed across files
    isolate: true,
    // A browser-less React Testing Library test of a date picker takes ~1.7s alone and over 5s when the whole suite runs in parallel; with the default 5s the
    // suite failed at random (Task 923 Revision 7, RangeDatePicker "Confirm commits one onChange"). A longer limit does not weaken any assertion.
    testTimeout: 60000,
    // With 200+ files on a many-core machine the heavy React files (date picker, admin profile) were starved of CPU and passed alone but timed out in the full
    // run (Task 923 Revision 7). Half the cores keeps the run fast and the result the same every time.
    maxWorkers: '50%',
    // Owner decision O790-1 (2026-10-07, "Виключити docs/** з vitest"): files under docs/ are frozen
    // evidence records, not regression tests. They stay on disk as evidence but are not collected.
    // Real-boundary security suites (real Supabase Auth and database of the approved development project) are a separate project, vitest.integration.config.ts:
    // this run needs no network and no credential and must never collect them.
    // scripts/quality tests use node:test and run with node --test (CI quality job), not under Vitest.
    exclude: [...configDefaults.exclude, 'docs/**', '**/*.integration.test.ts', 'scripts/quality/**'],
    // Coverage is collected only with --coverage (CI unit job); scripts/quality/changed-lines-coverage.mjs reads the JSON
    // report and requires every changed executable line under src/ to run in a test (owner, 2026-11-06).
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec,stories}.{ts,tsx}', 'src/**/*.d.ts', 'src/**/__tests__/**', 'src/**/__mocks__/**', 'src/tests/**', 'src/stories/**'],
      reporter: ['json'],
      reportsDirectory: 'coverage',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // server-only is a Next.js build-time guard — alias to a no-op in test env
      'server-only': path.resolve(__dirname, './src/tests/server-only-stub.ts'),
      // next/cache functions require a Next.js request scope missing in jsdom — stub to no-ops
      'next/cache': path.resolve(__dirname, './src/tests/next-cache-stub.ts'),
    },
  },
})
