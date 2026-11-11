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

What is known about the mechanism. `use-transition.mjs:41-64` schedules a `requestAnimationFrame`, then
`window.setTimeout(..., duration)` that calls `setStatus` on every change of `mounted` when the duration is not 0;
`Transition.mjs:45` skips only the rendering of the animation under `env === "test"`, not the hook. Revision 1 facts
(Sonnet, 2026-11-10, fake timers with rAF faked, each pending id attributed by its creating stack): a standalone Modal,
Menu or Popover under `MantineProvider env="test"` leaves no transition timer or frame after open, close and unmount.
`clearAllTimeouts` (`use-transition.mjs:83-88`) cancels them. What is left are 2 zero-delay `setTimeout`s from
`@mantine/hooks/esm/use-focus-trap/use-focus-trap.mjs:38` and `:56`, which have no cleanup and fire on the next macrotask.
So the original claim "every Modal leaves a transition timer" is refuted. A transition timer can outlive its component
only when the component unmounts inside the first rAF's `flushSync` (cleanup runs, then the second rAF and the
`setTimeout(duration)` are scheduled with nothing left to clear them). Whether a test of
`AdminPagesManager.smoke.test.tsx` does that is unknown. Working hypothesis: the leak is deterministic and only the
crash depends on timing, since Vitest's jsdom environment keeps Node's timers and a leaked 200 ms timer crashes only
when the file's environment is torn down first.

After the task no timer or frame a test starts can outlive the test's environment: the guard waits, after Testing
Library's cleanup, until the test's pending timers (delay above 0) and frames have run, and fails the test by name for
any that do not finish within its wait budget. The full unit run has no unhandled error, on any load.

Revision 1 (Opus, 2026-11-10): the reproduction of the first design ran and refuted its mechanism (above). The guard
now comes first and is the reproduction; the fix follows the measured cause.

Revision 2 (Opus, 2026-11-10, Review 1). Measured cause (Sonnet's trace, Review 1): when `mounted` flips inside the
first rAF's `flushSync`, `handleStateChange` runs re-entrantly and schedules frame B, then the outer callback overwrites
`rafRef` with frame C (`use-transition.mjs:52`, `:56`); unmount cancels only C, and B with its `setTimeout(duration)`
outlives the component. A fast flip is likelier on a loaded machine, so which tests leave such a frame depends on load:
Sonnet's full run passed, a stress run caught `ListingInquiryDialog.bot.security.test.tsx`, and Opus's rerun of AC4 failed
2 tests of `ListingInquiryDialog.session.security.test.tsx` (no file of the diff) with frames at `use-transition.mjs:52`
and `:56`. A guard that fails on a frame still pending at the instant of cleanup is itself random in CI. The crash needs a
handle alive at teardown; one that runs during the wait cannot crash. So the guard waits first and fails what is left.
Also found (Review 1): `vi.unstubAllGlobals()`, called by 36 test files, removes the unexpected-fetch stub that
`src/tests/setup.ts:20` installs with `vi.stubGlobal`, so the rest of such a file can call the real `fetch`: it did in
`src/lib/auth/__tests__/sessionMiddleware.test.ts` (a 499 ms timer at `src/proxy.ts:25`, Sonnet's report).

## Scope

- Files to change: `src/tests/setup.ts` (the shared owner of the unit-test environment, `vitest.config.ts:10`) and
  `src/tests/pendingTimerGuard.ts` (accepted in Review 1); `src/tests/__tests__/pendingTimers.test.tsx`; a new
  `src/tests/__tests__/fetchGuard.test.ts`; each file whose leak the guard catches (the test, or the component when the
  leak is a product bug). No retry, no skip, no `dangerouslyIgnoreUnhandledErrors`, no timer cleared by the
  guard, and no change to `src/design-system/mantine/theme.ts` (its values are asserted by `theme.d69-18.test.tsx`).
- Revision 2 changes, applied to the Revision 1 implementation:
  - R2-1 The guard's `afterEach` in `setup.ts` waits on the real clock (it never clears) until no timer above 0 and no
    frame is pending, up to a budget of 3 s, then fails the test by name with what is left (as now). The budget is a
    parameter of the exported check, so a test can plant a case with a short budget.
  - R2-2 The per-file `afterEach(unmountAndSettle)` hooks and `afterEach(settlePendingTimers)` hooks of Revision 1 are
    removed, and `src/tests/unmountAndSettle.ts` is deleted: the guard's wait replaces them. A file keeps only a step
    the wait cannot do: the Google popup files close the attempt (300 s `deadline`, `googlePopup.ts:104`), and
    `sessionMiddleware.test.ts` keeps its explicit `fetch` answer. A file whose only change was the hook is restored to `main`.
  - R2-3 `AdminPagesManager.smoke.test.tsx`'s Task 971 header names the measured causes (Tiptap/ProseMirror teardown
    timers; the re-entrant Transition frame) and says the guard's wait is what settles them.
  - R2-4 The unexpected-fetch stub survives `vi.unstubAllGlobals()` (for example, installed by plain assignment, or
    again before each test), so every unit test that calls `fetch` with no answer fails, as `setup.ts:5-10` says. A
    test file that relied on the real `fetch` gets an explicit answer in that file.
- Three parts, in this order (done in Revision 1; the Revision 2 changes above apply on top):
  1. Guard. In `src/tests/setup.ts`, wrap the real `setTimeout` / `clearTimeout` / `requestAnimationFrame` /
     `cancelAnimationFrame` (check whether Mantine's `window.setTimeout` is the same function in Vitest's jsdom and wrap
     both if not). Record the handles each test creates. In an `afterEach` that runs after Testing Library's cleanup
     (prove the order), fail the test by its name when a frame, or a timer with a delay above 0, is still pending. List
     each with the first `node_modules` or `src` frame of its creating stack. Capture the stack only when the delay is
     above 0, or for a frame. Zero-delay timers are allowed (the focus-trap ones above). The guard leaves a test that
     uses `vi.useFakeTimers()` to the fake clock and does not break it. It never clears a pending handle. Model:
     the unexpected-fetch guard (`src/tests/setup.ts:7-28`).
  2. Reproduce with the guard on unchanged code. Run `AdminPagesManager.smoke.test.tsx`, then the full unit run, and
     record every test the guard fails with its creating frame. If the guard does not fail any test of
     `AdminPagesManager.smoke.test.tsx`, stop and report. The hypothesis is then refuted, and Opus revises again.
  3. Fix each caught leak at its cause and say which cause. A transition hook scheduled after its component's unmount
     is fixed by the test's flow (for example, awaiting the close before the unmount) or by the component that unmounts
     it. Neither the guard nor a global stub may hide it. `AdminPagesManager.smoke.test.tsx` names the caught leak and
     its cause (Task 971) in its header, next to the T-list.
- Dependencies: none.
- Out of scope: the production theme and its reduced-motion behaviour; Storybook and Playwright runs (real browsers,
  no teardown race); upstream Mantine (a report upstream is optional and not an AC).

## Attack surface

Attack surface: unchanged. Only unit-test setup and tests change; no route, action, data, role, upload, SQL, header or
production dependency is touched.

## OWASP

- Abuse_Case: not applicable — the "race" is a test-teardown timer race, not an attack an application must defend.
- Authentication: not applicable — `sessionMiddleware.test.ts` only gets a fixed `fetch` answer; no sign-in code changes.
- Authentication_Patterns: not applicable — no authentication mechanism is designed or changed; test setup only.
- Bot_Management_and_Anti-Automation: not applicable — "bot" names existing test files; the human check is unchanged.
- Business_Logic_Security: not applicable — no workflow, price, permission or ownership value changes in this task.
- Clickjacking_Defense: not applicable — `src/proxy.ts` is cited as a timer's origin only; its headers are unchanged.
- Content_Security_Policy: not applicable — `src/proxy.ts` is cited, not changed; the CSP header code is untouched.
- Cookie_Theft_Mitigation: not applicable — no cookie is set, read or changed; a unit test's fetch answer is fixed.
- Credential_Stuffing_Prevention: not applicable — no login path or attempt limit changes; test setup only.
- Cross_Site_Scripting_Prevention: not applicable — test setup only; no output, encoding or rendering of untrusted data.
- DOM_based_XSS_Prevention: not applicable — the new test renders fixed components and never reads untrusted input.
- Denial_of_Service: not applicable — "upload" appears only as excluded surface; no request handling changes.
- File_Upload: not applicable — no upload code or upload test changes; the word is in the out-of-surface list.
- HTTP_Headers: not applicable — no response header is set or changed; `src/proxy.ts` is cited, not edited.
- HTTP_Strict_Transport_Security: not applicable — the HSTS header code is untouched; only unit-test setup changes.
- JavaScript_and_TypeScript_Security: "Never pass untrusted input to a recursive merge or set-by-path helper" — the guard
  wraps the timer globals with fixed functions and merges no input; review reads `src/tests/setup.ts` in full — AC2, AC5.
- Multifactor_Authentication: not applicable — no factor, enrolment or challenge changes; test setup only.
- Nextjs_Security: not applicable — no route, action or proxy code changes; `src/proxy.ts` is only cited.
- Secure_Coding_with_AI: "AI coding assistants frequently suggest package names that do not exist on public registries"
  — the task adds no dependency (Scope); the fix uses Vitest's and Mantine's installed APIs only — AC5.
- Session_Management: not applicable — session handling is unchanged; its unit test only stops a real network call.
- User_Privacy_Protection: not applicable — no user data, IP address or upload path is touched by test setup.
- Verifying_Third_Party_Agent_Execution_Evidence: "Do not use supplier assertions alone to resolve an incident attribution or dispute involving that supplier."
  — the cause is settled by the reproduction test, not by the implementer's claim; Opus re-runs AC1 to AC4 — AC1, AC4.
- Web_Frontend_Security: not applicable — no frontend code ships; only the jsdom unit-test environment changes.

## UI

No visible change.

## Mobile adaptation record
- Scope: none

## Acceptance criteria

- AC1 The leak behind the CI crash is measured and settled: with a budget of 0 the guard fails named tests of
  `AdminPagesManager.smoke.test.tsx` with the Transition frame or the Tiptap/ProseMirror timers (Revision 1 run, in
  Review 1); with the 3 s budget and no per-file hook the file passes three runs — test:
  `npx vitest run src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx`.
- AC2 The guard waits for a short timer or frame to run (the planted handle has fired before the next test starts),
  fails a test whose timer above 0 or frame is still pending after the budget, names it, allows zero-delay and cleared
  timers, runs after Testing Library's cleanup and never clears a handle — test:
  `npx vitest run src/tests/__tests__/pendingTimers.test.tsx` (planted cases, a short budget for the failing one).
- AC3 A Modal, Menu and Popover opened, closed and unmounted under `MantineProvider env="test"` pass the guard — test:
  `npx vitest run src/tests/__tests__/pendingTimers.test.tsx`.
- AC4 The whole unit run passes with the guard on, with no "Unhandled Errors" — test: `npm test -- --coverage` exits 0
  and its output has no "Unhandled Errors" line (`npm test -- --coverage 2>&1 | grep -c "Unhandled Errors"` prints 0).
  Any test the guard catches is fixed in its own file in this task, and each such file is named in the report. Run it
  three times, and once more while six `node -e "for(;;){}"` processes load the machine; each run exits 0 (the report
  gives each run's duration next to the 134 s of Review 1's run).
- AC6 A unit test that calls `fetch` with no answer fails after `vi.unstubAllGlobals()` as before it — test:
  `npx vitest run src/tests/__tests__/fetchGuard.test.ts` (the report shows it failing on the Revision 1 setup).
- AC5 `npm run lint`, `npm run typecheck`, `node scripts/quality/check-files.mjs --worktree` and
  `node scripts/quality/ac-tests.mjs --base main <this kickoff>` exit 0 — test: those commands.

## Route

1. Read `src/tests/setup.ts`, `vitest.config.ts`, `node_modules/@mantine/core/esm/components/Transition/use-transition.mjs`
   and `Transition.mjs`, and `src/components/admin/__tests__/AdminPagesManager.smoke.test.tsx`.
2. Write the guard and its test (Scope part 1); run the planted leak and record its failure.
3. Run the guard on unchanged code (Scope part 2); record every caught test with its creating frame. Stop and report
   if no test of `AdminPagesManager.smoke.test.tsx` is caught.
4. Fix each caught leak at its cause (Scope part 3).
5. Run: npm run lint · npm run typecheck · npm test -- --coverage · node scripts/quality/changed-lines-coverage.mjs --base main ·
   node scripts/quality/check-files.mjs --worktree · npx vitest run src/tests/__tests__/pendingTimers.test.tsx
6. Report: each command, exit code, relevant output; AC1's guard failure on unchanged code; AC2's planted-leak output; the
   list of test files the guard caught and how each was fixed.
7. Revision 2: write AC6's test and run it on the Revision 1 setup (keep the failure), then R2-4; then R2-1 and AC2's
   new cases, then R2-2 and R2-3; rerun step 5 with AC4's three runs and the loaded run; report as in step 6.

## Review

Review 1 of the working tree on `task/971-transition-timers` (base 6ae9105d5) — NEEDS REVISION (1 of 2)
Scope: the whole diff (24 test files, `src/tests/setup.ts`, `pendingTimerGuard.ts`, `unmountAndSettle.ts`,
`pendingTimers.test.tsx`); no product code changed.
Tools: `npm run lint` 0, `npm run typecheck` 0, `check-files.mjs --worktree` 0 (30 files), `ac-tests.mjs` 0;
`npm test -- --coverage` exit 1: "Test Files 1 failed | 383 passed (384)", "Tests 2 failed | 6289 passed (6291)", 134 s.
Findings: Critical 0, High 0, Medium 2, Low 0
Overall risk: no security exposure; the guard as designed would fail CI at random, and the fetch guard is off in 36 files.

F1 — The guard fails on frames whose survival depends on load, so CI would fail at random
Severity: Medium      Category: testing (error handling)      CWE: —
Location: `src/tests/setup.ts:40-43`, `src/tests/pendingTimerGuard.ts:119-125`
Description: the check runs at the instant after cleanup; the re-entrant Transition frame exists only when `mounted`
flips inside a frame's `flushSync`, which load makes likely. The design (Revision 1 Scope part 1) asked for this.
Impact: `CI Required` fails at random on files the run did not catch; this is the defect the task removes.
Reproduction: Opus's `npm test -- --coverage` on the Revision 1 tree failed 2 tests of
`ListingInquiryDialog.session.security.test.tsx` (frames at `use-transition.mjs:52:24`, `:56:26`); Sonnet's full run
passed and its stress run failed `ListingInquiryDialog.bot.security.test.tsx`. AC4's "exits 0" did not reproduce.
Recommendation: Revision 2, R2-1 to R2-3 (the guard waits up to 3 s and fails what is left; per-file hooks removed).
References: Verifying_Third_Party_Agent_Execution_Evidence; `.claude/rules/quality-gates.md` §8.
Status: open, Revision 2

F2 — `vi.unstubAllGlobals()` turns the unexpected-fetch guard off for the rest of a test file
Severity: Medium      Category: testing (unmocked network)      CWE: —
Location: `src/tests/setup.ts:20` (`vi.stubGlobal('fetch', …)`); 36 files under `src/` call `vi.unstubAllGlobals()`
Description: `vi.unstubAllGlobals()` restores the real `fetch`, which the setup file installed once at load.
Impact: a unit test can call the network unseen, and code that swallows the failure passes for an unchecked reason.
Reproduction: Sonnet's guard run: `sessionMiddleware.test.ts` called undici `fetch` to `https://x.supabase.co`, a 499 ms
timer at `src/proxy.ts:25`; `rg -l unstubAllGlobals src` lists 36 files.
Recommendation: Revision 2, R2-4 and AC6.
References: `src/tests/setup.ts:5-10` (Task 923 R67 (i)).
Status: open, Revision 2

Accepted from Review 1: the guard module `src/tests/pendingTimerGuard.ts` (Scope); the measured cause in Goal; the
Google popup closing steps and `sessionMiddleware.test.ts`'s `fetch` answer. Not run in Review 1 (superseded by Revision
2): the deliberate break of AC1 and of P5. OWASP review record: written at the review of Revision 2.

Review 2 of the working tree on `task/971-transition-timers` (base 6ae9105d5, Revision 2) — APPROVED
Scope: the whole diff, 9 files: `src/tests/setup.ts`, `pendingTimerGuard.ts`, `unexpectedFetchGuard.ts` (new; holds the
fetch stub and `takeUnexpectedFetches` for AC6, accepted), `pendingTimers.test.tsx`, `fetchGuard.test.ts`,
`AdminPagesManager.smoke.test.tsx` (header only), the two Google test files (popup closing hook only) and
`sessionMiddleware.test.ts`; the 20 Revision 1 hook files equal `main`. No product code, dependency or lockfile change.
Tools: lint 0, typecheck 0, `check-files.mjs --worktree` 0 (12 files), `ac-tests.mjs` 0, `changed-lines-coverage.mjs` 0,
`check-ruleset.mjs` 0; `npm test -- --coverage` three times, exit 0 each, 385 files, 6296 tests, 0 "Unhandled Errors":
166 s and 176 s, and 197 s under six `node -e "for(;;){}"` (Review 1: 134 s; the wait costs about 30 s locally).
Findings: Critical 0, High 0, Medium 0, Low 0
Overall risk: none for the product; a timer or frame left by a test runs during the wait or fails that test by name.
Acceptance: AC1 `AdminPagesManager.smoke.test.tsx` 3 runs 10/10 (the budget-0 failure is Review 1's evidence); AC2 and
AC3 `pendingTimers.test.tsx` and AC6 `fetchGuard.test.ts` 14/14; AC4 the runs above; AC5 the tools above.
Deliberate breaks, restored and byte-compared: the fetch stub back on `vi.stubGlobal` fails all 3 AC6 cases; a budget of 0
fails P7a and P7b. F1 and F2 of Review 1 are fixed. Not run: a break of P5's hook order (P5b observes it directly).
Sonnet's `vi.unstubAllGlobals()` concern for leftover fetch answers was measured: the 6 files that set a lasting `fetch`
answer each reset or re-stub it, so no test inherits another test's answer.

Review 2 addenda (PR #28). 79d853932: the OWASP gate failed ("G3 Error_Handling"): `changedFiles` read only `git diff`,
blind to untracked files; fixed (untracked files read, option-shaped `--base` refused), 3 verdicts added. 49899c40f:
`not ok 149` "Not a valid object name main": the new test read the developer's refs, and CI's checkout has no local
`main`; the test now builds its refs in a fixture repo. In a fresh clone without `main` the old test fails the same way,
the fixed one passes; the quality job there: sync and check exit 0, tests 155/155, check-files 0, product gates 36/36.