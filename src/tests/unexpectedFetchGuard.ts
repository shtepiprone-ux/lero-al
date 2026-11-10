import { vi } from 'vitest'

// Task 923 R67 (i): the global `fetch` stub of every unit test. An UNEXPECTED call (one no test installed an answer for) throws at the call site AND is recorded, so
// `setup.ts` fails the test that made it even when the code under test swallows the exception.
//
// Task 971 (F2): the stub is installed by plain assignment, not `vi.stubGlobal`. `vi.unstubAllGlobals()` (called by 36 test files) restores what `stubGlobal` replaced, which
// was the real `fetch`, so the rest of such a file could reach the network unseen. A test that stubs `fetch` itself with `vi.stubGlobal` now gets this stub back on unstub.
const unexpectedFetches: string[] = []

function describeFetchTarget(input: unknown): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  if (input && typeof (input as { url?: unknown }).url === 'string') return (input as { url: string }).url
  return String(input)
}

export function installUnexpectedFetchGuard() {
  globalThis.fetch = vi.fn((input?: unknown) => {
    const target = describeFetchTarget(input)
    unexpectedFetches.push(target)
    throw new Error(`Unexpected fetch in a unit test: ${target}. Give this test an answer: vi.mocked(global.fetch).mockResolvedValue(...)`)
  }) as unknown as typeof fetch
}

/** The targets of the unexpected calls since the last take; taking them empties the list. */
export function takeUnexpectedFetches(): string[] {
  return unexpectedFetches.splice(0)
}
