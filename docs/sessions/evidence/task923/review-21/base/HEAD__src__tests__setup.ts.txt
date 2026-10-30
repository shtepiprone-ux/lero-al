import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Stub fetch globally so every test can control /api/auth/me responses.
// Must be declared before any test file runs so vi.mocked(global.fetch) works.
vi.stubGlobal('fetch', vi.fn())
