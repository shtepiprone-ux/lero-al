import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// `fetch` is stubbed globally so every test can control its answers: a test that needs a response installs one
// (`vi.mocked(global.fetch).mockResolvedValue(...)`), and the stub must exist before any test file runs so `vi.mocked(global.fetch)` works.
//
// Task 923 R67 (i): the stub used to be an empty mock that answered `undefined`, so code that called `fetch` without the test knowing about it did not fail, it
// carried on with `undefined` (usually into a `catch` that swallowed the TypeError) and the test passed for a reason nobody had checked. An UNEXPECTED call
// (one no test installed an answer for) now throws at the call site AND fails the test that made it, even when the code under test swallows the exception.
const unexpectedFetches: string[] = []

function describeFetchTarget(input: unknown): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.toString()
  if (input && typeof (input as { url?: unknown }).url === 'string') return (input as { url: string }).url
  return String(input)
}

vi.stubGlobal('fetch', vi.fn((input?: unknown) => {
  const target = describeFetchTarget(input)
  unexpectedFetches.push(target)
  throw new Error(`Unexpected fetch in a unit test: ${target}. Give this test an answer: vi.mocked(global.fetch).mockResolvedValue(...)`)
}))

afterEach(() => {
  const seen = unexpectedFetches.splice(0)
  if (seen.length > 0) throw new Error(`The test made ${seen.length} unexpected fetch call(s) that it did not mock: ${seen.join(', ')}`)
})
