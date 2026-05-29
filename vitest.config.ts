import { defineConfig } from 'vitest/config'
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // server-only is a Next.js build-time guard — alias to a no-op in test env
      'server-only': path.resolve(__dirname, './src/tests/server-only-stub.ts'),
    },
  },
})
