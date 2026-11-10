# Task 971 — No Mantine transition timer outlives the test that started it

Sprint 93 (governance reset). Priority P1. Owner decision (2026-11-10, translated): the flaky unit-run error found on
PR #26 goes into a new task, not into Task 970; golden rule (2026-11-07): a gap found is closed, not reported.
Implementer: Sonnet. Reviewer: Opus. Human owner of the change: the owner.

## Goal

The unit job of PR #26 (run 42766290854, job 129663450879) failed with every test green: "Test Files 383 passed",
"Tests 6282 passed", "Errors 1 error". Vitest caught `ReferenceError: window is not defined` at
`resolveUpdatePriority` ← `requestUpdateLane` ← `dispatchSetState` ← `Timeout._onTimeout`
`node_modules/@mantine/core/esm/components/Transition/use-transition.mjs:61:13`, "originated in
src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx". PR #26 does not touch that test or `src/`
(`git diff --stat origin/main...c1d040511`). The last `main` run (b1c7b4147) did not show the error, and six local runs
of the file passed (Opus, 2026-11-10, `npx vitest run src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx`,
10/10 each). So the error is intermittent and it blocks `CI Required` at random.

Mechanism (from the code, not yet proven by a test): `use-transition.mjs:41-64` schedules a `requestAnimationFrame`
and then `window.setTimeout(..., duration)` that calls `setStatus` on every change of `mounted`, whenever the duration
is not 0. `Transition.mjs:45` skips the animation when `env === "test"`, but the hook above it still runs, so with
`MantineProvider env="test"` (60 files under `src/` pass it) every opened or closed Modal, Menu or Popover leaves a real
timer. `clearAllTimeouts` runs on unmount (`use-transition.mjs:83-88`). But when the first rAF callback's `flushSync`
unmounts the component, cleanup runs before the second rAF and its timeout are scheduled, and nothing clears them.
Vitest's jsdom environment keeps Node's timers, so such a timer fires after the environment is torn down, `window` is
gone, and React throws.

After the task no Mantine transition can schedule a timer or animation frame in a unit test. A test that leaves one
pending after cleanup fails by name. The full unit run has no unhandled error.

## Scope

- Files to change: `src/tests/setup.ts` (the shared owner of the unit-test environment, `vitest.config.ts:10`); a new
  `src/tests/__tests__/pendingTimers.test.tsx`; at most a test-only Mantine configuration module under `src/tests/`
  if the fix needs one. No per-test-file patch, no retry, no skip, no `dangerouslyIgnoreUnhandledErrors`.
- Two parts, in this order:
  1. Reproduce. Under `vi.useFakeTimers()` (rAF faked too) a test renders a Mantine `Modal` inside
     `MantineProvider env="test"`, opens it, closes it and unmounts it, then reads `vi.getTimerCount()`. Record whether a
     timer is left: that confirms or refutes the mechanism of Goal. If it is refuted, stop and report what the test
     showed. Opus then revises this kickoff; do not guess another cause.
  2. Fix at the shared owner: no unit test may schedule a Mantine transition timer or frame. Example: the setup makes
     every transition duration 0 for tests, so `use-transition.mjs:47` takes the synchronous branch. The production
     theme (`src/design-system/mantine/theme.ts`) is not changed. A leak guard in `src/tests/setup.ts` tracks the
     timers and animation frames each test creates and, after Testing Library's cleanup, fails the test that still has
     any pending, naming it. This follows the existing unexpected-fetch guard (`src/tests/setup.ts:7-28`). The guard
     never silently clears a pending timer.
- Dependencies: none.
- Out of scope: the production theme and its reduced-motion behaviour; Storybook and Playwright runs (real browsers,
  no teardown race); upstream Mantine (a report upstream is optional and not an AC).

## Attack surface

Attack surface: unchanged. Only unit-test setup and tests change; no route, action, data, role, upload, SQL, header or
production dependency is touched.

## OWASP

- Abuse_Case: not applicable — the "race" is a test-teardown timer race, not an attack an application must defend.
- Business_Logic_Security: not applicable — no workflow, price, permission or ownership value changes in this task.
- Cross_Site_Scripting_Prevention: not applicable — test setup only; no output, encoding or rendering of untrusted data.
- DOM_based_XSS_Prevention: not applicable — the new test renders fixed components and never reads untrusted input.
- Denial_of_Service: not applicable — "upload" appears only as excluded surface; no request handling changes.
- File_Upload: not applicable — no upload code or upload test changes; the word is in the out-of-surface list.
- JavaScript_and_TypeScript_Security: "Never pass untrusted input to a recursive merge or set-by-path helper" — the guard
  wraps the timer globals with fixed functions and merges no input; review reads `src/tests/setup.ts` in full — AC2, AC5.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries"
  — the task adds no dependency (Scope); the fix uses Vitest's and Mantine's installed APIs only — AC5.
- User_Privacy_Protection: not applicable — no user data, IP address or upload path is touched by test setup.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier."
  — the cause is settled by the reproduction test, not by the implementer's claim; Opus re-runs AC1 to AC4 — AC1, AC4.
- Web_Frontend_Security: not applicable — no frontend code ships; only the jsdom unit-test environment changes.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The mechanism is reproduced or refuted before any fix: the reproduction case shows the timer count after
  unmount without the fix, and 0 with it — test: `npx vitest run src/tests/__tests__/pendingTimers.test.tsx`
  (its failing run before the fix is in the report).
- AC2 A test that leaves a timer or animation frame pending after cleanup fails by name, and the guard does not clear
  it silently — test: `npx vitest run src/tests/__tests__/pendingTimers.test.tsx` (a planted leaking case run through
  the guard's checker; the report shows the planted case failing).
- AC3 Opening and closing a Modal, Menu and Popover under `MantineProvider env="test"` leaves no timer and no frame
  — test: `npx vitest run src/tests/__tests__/pendingTimers.test.tsx`.
- AC4 The whole unit run passes with the guard on, with no "Unhandled Errors" — test: `npm test -- --coverage` exits 0
  and its output has no "Unhandled Errors" line (`npm test -- --coverage 2>&1 | grep -c "Unhandled Errors"` prints 0).
  Any test the guard catches is fixed in its own file in this task, and each such file is named in the report.
- AC5 `npm run lint`, `npm run typecheck`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/ac-tests.mjs --base main <this kickoff>` exit 0 — test: those commands.

## Route

1. Read `src/tests/setup.ts`, `vitest.config.ts`, `node_modules/@mantine/core/esm/components/Transition/use-transition.mjs`
   and `Transition.mjs`, and `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx`.
2. Write the reproduction (Scope part 1), run it, record the result. Stop and report if the mechanism is refuted.
3. Implement the fix and the guard (Scope part 2). Run the guard's planted leak and record its failure.
4. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs --base main ·
   node scripts/quality/check-files.mjs --worktree · npx vitest run src/tests/__tests__/pendingTimers.test.tsx
5. Report: each command, exit code, relevant output; AC1's failing run before the fix; AC2's planted-leak output; the
   list of test files the guard caught and how each was fixed.

## Review

Pending.
