import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { assertNoPendingTimers, installPendingTimerGuard, observeGuardRun } from './pendingTimerGuard'
import { installUnexpectedFetchGuard, takeUnexpectedFetches } from './unexpectedFetchGuard'

// `fetch` is stubbed globally so every test can control its answers: a test that needs a response installs one
// (`vi.mocked(global.fetch).mockResolvedValue(...)`), and the stub must exist before any test file runs so `vi.mocked(global.fetch)` works.
//
// Task 923 R67 (i): the stub used to be an empty mock that answered `undefined`, so code that called `fetch` without the test knowing about it did not fail, it
// carried on with `undefined` (usually into a `catch` that swallowed the TypeError) and the test passed for a reason nobody had checked. An UNEXPECTED call
// (one no test installed an answer for) now throws at the call site AND fails the test that made it, even when the code under test swallows the exception.
// Task 971 (F2): the stub survives `vi.unstubAllGlobals()` (see `unexpectedFetchGuard.ts`).
installUnexpectedFetchGuard()

afterEach(() => {
  const seen = takeUnexpectedFetches()
  if (seen.length > 0) throw new Error(`The test made ${seen.length} unexpected fetch call(s) that it did not mock: ${seen.join(', ')}`)
})

// Task 971: a timer with a delay above 0, or an animation frame, that a test leaves pending fires after Vitest has torn the jsdom environment down and React
// throws `window is not defined` as an unhandled error that fails the whole run at random (CI run 42766290854). The timer globals are wrapped here, before any
// test file runs. The `afterEach` below waits on the real clock (never clearing anything) for what the test left to run, up to 3 s, and fails the test by name for
// what is left. Libraries finish work after unmount by design (a Mantine transition, Tiptap and ProseMirror editor teardown), and whether one is still pending at
// the instant of cleanup depends on machine load, so a check made at that instant would fail at random.
//
// Hook order: Vitest runs `afterEach` hooks in the reverse order they were registered (`sequence.hooks` "stack"). This file registers the hook below before any
// test file imports `@testing-library/react`, whose own `afterEach(cleanup)` is registered at that import, so Testing Library's cleanup runs first and this
// check sees what is still pending after the components are unmounted. `src/tests/__tests__/pendingTimers.test.tsx` proves the order.
installPendingTimerGuard()

afterEach(async ({ task }) => {
  observeGuardRun(task.name)
  await assertNoPendingTimers(task.fullName)
})
