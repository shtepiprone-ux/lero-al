import { describe, expect, it, vi } from 'vitest'
import { takeUnexpectedFetches } from '../unexpectedFetchGuard'

// Task 971 (F2, AC6): `vi.unstubAllGlobals()` is called by 36 test files and used to restore the REAL `fetch`, so the rest of such a file could reach the network
// unseen. The stub of `setup.ts` now survives it. The test takes the recorded calls itself, so the `afterEach` of `setup.ts` (which fails a test that made an
// unexpected call) has nothing left to report for these deliberate ones.
describe('the unexpected-fetch guard survives vi.unstubAllGlobals()', () => {
  it('a fetch call with no answer throws before and after vi.unstubAllGlobals()', () => {
    expect(() => fetch('https://unexpected.invalid/before')).toThrow(/Unexpected fetch in a unit test: https:\/\/unexpected\.invalid\/before/)
    vi.unstubAllGlobals()
    expect(() => fetch('https://unexpected.invalid/after')).toThrow(/Unexpected fetch in a unit test: https:\/\/unexpected\.invalid\/after/)
    expect(takeUnexpectedFetches()).toEqual(['https://unexpected.invalid/before', 'https://unexpected.invalid/after'])
  })

  it('a test that stubs fetch itself with vi.stubGlobal gets the guard back on vi.unstubAllGlobals()', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true }) as Response))
    expect(() => fetch('https://answered.invalid/')).not.toThrow()
    vi.unstubAllGlobals()
    expect(() => fetch('https://unexpected.invalid/restored')).toThrow(/Unexpected fetch in a unit test/)
    expect(takeUnexpectedFetches()).toEqual(['https://unexpected.invalid/restored'])
  })

  it('the unexpected call is still recorded for setup.ts when the code under test swallows the exception', () => {
    try {
      fetch('https://unexpected.invalid/swallowed')
    } catch {
      // the code under test swallows it
    }
    expect(takeUnexpectedFetches()).toEqual(['https://unexpected.invalid/swallowed'])
  })
})
